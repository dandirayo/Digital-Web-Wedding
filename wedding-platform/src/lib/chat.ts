export type ChatRole = "owner" | "client";

export type ChatMessage = {
  id: string;
  threadId: string;
  sender: ChatRole;
  senderName: string;
  text: string;
  createdAt: string;
};

export const CHAT_STORAGE_KEY = "occasio_chat_messages_v1";

export const initialChatMessages: ChatMessage[] = [
  { id: "msg-1", threadId: "evt-1", sender: "owner", senderName: "Occasio Owner", text: "Halo Sheila, konten utama sudah kami cek. Silakan lengkapi daftar tamu dan ucapan pembuka.", createdAt: "2026-09-06T08:20:00.000Z" },
  { id: "msg-2", threadId: "evt-1", sender: "client", senderName: "Sheila Prameswari", text: "Siap, hari ini saya upload daftar tamunya. Untuk foto galeri apakah bisa menyusul?", createdAt: "2026-09-06T08:35:00.000Z" },
  { id: "msg-3", threadId: "evt-1", sender: "owner", senderName: "Occasio Owner", text: "Bisa. Kami tandai sebagai task berikutnya dan tetap review halaman utama dulu.", createdAt: "2026-09-06T08:42:00.000Z" },
];

export function loadChatMessages(): ChatMessage[] {
  if (typeof window === "undefined") return initialChatMessages;
  try {
    const saved = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || "[]") as ChatMessage[];
    return saved.length ? saved : initialChatMessages;
  } catch {
    return initialChatMessages;
  }
}

export function saveChatMessage(message: ChatMessage) {
  const messages = [...loadChatMessages(), message];
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  window.dispatchEvent(new CustomEvent("occasio:chat-updated"));
  return messages;
}
