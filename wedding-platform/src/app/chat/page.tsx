"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentSession } from "@/lib/store";
import { getMessages, getThreads, markRead, sendMessage, type ChatMessage, type ChatThread } from "@/lib/business";

const POLL_MS = 5000;

export default function ChatPage() {
  const router = useRouter();
  const [role, setRole] = useState<"owner" | "client" | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selected, setSelected] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  useEffect(() => {
    getCurrentSession()
      .then((session) => {
        if (!session) router.replace("/login");
        else setRole(session.role);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const refreshThreads = useCallback(async () => {
    try {
      const list = await getThreads();
      setThreads(list);
      setSelected((current) => current || new URLSearchParams(window.location.search).get("event") || list[0]?.eventId || "");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Percakapan tidak dapat dimuat.");
    }
  }, []);

  const refreshMessages = useCallback(async (eventId: string) => {
    try {
      const list = await getMessages(eventId);
      setMessages(list);
      if (list.length !== lastCount.current) {
        lastCount.current = list.length;
        markRead(eventId).then(refreshThreads).catch(() => undefined);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pesan tidak dapat dimuat.");
    }
  }, [refreshThreads]);

  useEffect(() => {
    if (!role) return;
    const first = setTimeout(refreshThreads, 0);
    const timer = setInterval(refreshThreads, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [role, refreshThreads]);

  useEffect(() => {
    if (!selected) return;
    lastCount.current = -1;
    const first = setTimeout(() => refreshMessages(selected), 0);
    const timer = setInterval(() => refreshMessages(selected), POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [selected, refreshMessages]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !selected) return;
    setSending(true);
    try {
      const message = await sendMessage(selected, text);
      setMessages((current) => [...current, message]);
      setDraft("");
      setError("");
      refreshThreads();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pesan gagal dikirim. Coba lagi.");
    } finally {
      setSending(false);
    }
  }

  if (!role) return <div className="grid min-h-screen place-items-center bg-[#f7f3ed] text-sm text-[#6b6056]">Menyiapkan chat...</div>;
  const current = threads.find((thread) => thread.eventId === selected);

  return (
    <DashboardShell role={role} title="Chat" description="Percakapan owner dan klien per event. Pesan tersimpan di server dan tampil di semua perangkat.">
      <div className="grid min-h-[calc(100vh-12rem)] overflow-hidden rounded-md border border-[#e0d4c7] bg-white lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-[#e0d4c7] bg-[#fffaf4] p-4 lg:border-b-0 lg:border-r">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a6a3a]">Percakapan</div>
          <div className="mt-4 space-y-2">
            {!threads.length ? <p className="text-sm italic text-[#6b6056]">Belum ada event.</p> : null}
            {threads.map((thread) => (
              <button key={thread.eventId} type="button" onClick={() => setSelected(thread.eventId)} aria-current={thread.eventId === selected} className={`w-full rounded-md border p-3 text-left ${thread.eventId === selected ? "border-[#9a6a3a] bg-white shadow-sm" : "border-[#e0d4c7] bg-white/60"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold">{thread.coupleName}</span>
                  {thread.unread ? <span className="rounded-full bg-[#9a6a3a] px-2 py-0.5 text-[10px] font-semibold text-white">{thread.unread}</span> : null}
                </div>
                <p className="mt-1 truncate text-xs text-[#6b6056]">{thread.lastMessage ? thread.lastMessage.text : "Belum ada pesan"}</p>
              </button>
            ))}
          </div>
        </aside>
        <section className="flex min-h-[560px] flex-col">
          <header className="border-b border-[#e0d4c7] px-5 py-4">
            <h2 className="font-semibold">{current?.coupleName ?? "Pilih percakapan"}</h2>
            <p className="mt-1 text-xs text-[#6b6056]">Pesan diperbarui otomatis setiap beberapa detik.</p>
          </header>
          <div className="flex-1 space-y-4 overflow-y-auto bg-[#f7f3ed] p-5" aria-live="polite">
            {selected && !messages.length ? <p className="text-center text-sm italic text-[#6b6056]">Belum ada pesan. Mulai percakapan di bawah.</p> : null}
            {messages.map((message) => {
              const mine = message.senderRole === role;
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-md px-4 py-3 text-sm leading-6 ${mine ? "bg-[#241f1a] text-white" : "border border-[#e0d4c7] bg-white text-[#5d5146]"}`}>
                    <div className={`mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${mine ? "text-[#d6c7a1]" : "text-[#9a6a3a]"}`}>{message.senderName}</div>
                    <div className="whitespace-pre-wrap break-words">{message.text}</div>
                    <div className={`mt-2 text-[10px] ${mine ? "text-white/60" : "text-[#9a8c7e]"}`}>{new Date(message.createdAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
              );
            })}
            <div ref={bottom} />
          </div>
          {error ? <p role="alert" className="border-t border-[#e0d4c7] bg-white px-4 pt-3 text-sm font-medium text-rose-700">{error}</p> : null}
          <form onSubmit={submit} className="flex gap-3 border-t border-[#e0d4c7] bg-white p-4">
            <input value={draft} maxLength={2000} disabled={!selected} onChange={(event) => setDraft(event.target.value)} placeholder="Tulis pesan..." aria-label="Pesan" className="h-11 min-w-0 flex-1 rounded-md border border-[#d8c9b7] bg-[#fffaf4] px-3 text-base outline-none focus:border-[#9a6a3a] sm:text-sm" />
            <button disabled={sending || !draft.trim() || !selected} className="h-11 rounded-md bg-[#241f1a] px-5 text-sm font-semibold text-white disabled:opacity-50">{sending ? "Mengirim..." : "Kirim"}</button>
          </form>
        </section>
      </div>
    </DashboardShell>
  );
}
