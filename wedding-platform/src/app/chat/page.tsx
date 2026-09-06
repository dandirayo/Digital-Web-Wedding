"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentSession, initStore } from "@/lib/store";
import { loadChatMessages, saveChatMessage, type ChatMessage, type ChatRole } from "@/lib/chat";

export default function ChatPage() {
  const router = useRouter();
  const [role, setRole] = useState<ChatRole | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await initStore();
      const session = await getCurrentSession();
      if (cancelled) return;
      if (!session) { router.replace("/login"); return; }
      setRole(session.role);
      setMessages(loadChatMessages());
    }
    load();
    const refresh = () => setMessages(loadChatMessages());
    window.addEventListener("occasio:chat-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => { cancelled = true; window.removeEventListener("occasio:chat-updated", refresh); window.removeEventListener("storage", refresh); };
  }, [router]);

  const threadMessages = useMemo(() => messages.filter((message) => message.threadId === "evt-1"), [messages]);

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !role) return;
    const message: ChatMessage = { id: `msg-${Date.now()}`, threadId: "evt-1", sender: role, senderName: role === "owner" ? "Occasio Owner" : "Sheila Prameswari", text, createdAt: new Date().toISOString() };
    setMessages(saveChatMessage(message));
    setDraft("");
  }

  if (!role) return <div className="grid min-h-screen place-items-center bg-[#f7f3ed] text-sm text-[#6b6056]">Menyiapkan chat...</div>;

  return (
    <DashboardShell role={role} title="Chat" description="Komunikasi langsung antara owner dan klien untuk menjaga setiap order tetap berjalan.">
      <div className="grid min-h-[calc(100vh-12rem)] overflow-hidden rounded-md border border-[#e0d4c7] bg-white lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-[#e0d4c7] bg-[#fffaf4] p-4 lg:border-b-0 lg:border-r"><div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a6a3a]">Percakapan</div><button type="button" className="mt-4 w-full rounded-md border border-[#cdbba8] bg-white p-4 text-left shadow-sm"><div className="flex items-center justify-between gap-3"><span className="font-semibold">Sheila & Yoga</span><span className="h-2 w-2 rounded-full bg-emerald-500" /></div><p className="mt-1 text-xs text-[#6b6056]">Premium · 27 Desember 2026</p><p className="mt-3 truncate text-xs text-[#9a6a3a]">{threadMessages.at(-1)?.text}</p></button><div className="mt-5 rounded-md border border-[#e0d4c7] p-3 text-xs leading-5 text-[#756a60]">Chat diperbarui otomatis saat tab owner dan klien terbuka bersamaan.</div></aside>
        <section className="flex min-h-[560px] flex-col"><header className="flex items-center justify-between border-b border-[#e0d4c7] px-5 py-4"><div><h2 className="font-semibold">Sheila & Yoga</h2><p className="mt-1 text-xs text-[#6b6056]">Workspace event · Premium</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Online</span></header><div className="flex-1 space-y-4 overflow-y-auto bg-[#f7f3ed] p-5">{threadMessages.map((message) => { const mine = message.sender === role; return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-md px-4 py-3 text-sm leading-6 ${mine ? "bg-[#241f1a] text-white" : "border border-[#e0d4c7] bg-white text-[#5d5146]"}`}><div className={`mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${mine ? "text-[#d6c7a1]" : "text-[#9a6a3a]"}`}>{message.senderName}</div><div>{message.text}</div><div className={`mt-2 text-[10px] ${mine ? "text-white/60" : "text-[#9a8c7e]"}`}>{formatTime(message.createdAt)}</div></div></div>; })}</div><form onSubmit={sendMessage} className="flex gap-3 border-t border-[#e0d4c7] bg-white p-4"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tulis pesan untuk percakapan ini..." className="h-11 min-w-0 flex-1 rounded-md border border-[#d8c9b7] bg-[#fffaf4] px-3 text-sm outline-none focus:border-[#9a6a3a]" /><button className="h-11 rounded-md bg-[#241f1a] px-5 text-sm font-semibold text-white">Kirim</button></form></section>
      </div>
      <p className="mt-3 text-xs text-[#887a6d]">Mode pengembangan: realtime memakai event browser lokal. Saat Supabase Realtime diaktifkan, chat dapat dipakai lintas perangkat.</p>
    </DashboardShell>
  );
}

function formatTime(value: string) { return new Date(value).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }); }
