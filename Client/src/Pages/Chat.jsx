import React, { useCallback, useEffect, useState } from "react";
import MessageList from "@/components/MessageList";

// ⚠️ Set this from your auth (Clerk/Firebase/etc.)
const CURRENT_USER_ID = "REPLACE_WITH_AUTH_USER_ID";

// Map server items to include `mine`
function tagMine(items) {
  return items.map((m) => ({
    ...m,
    mine: m.mine ?? m.senderId === CURRENT_USER_ID,
  }));
}

// Merge without duplicates by `id` (falls back to combo key)
function mergeUnique(left, right) {
  const keyOf = (m) => m.id ?? m._id ?? `${m.createdAt}-${m.senderId ?? ""}`;
  const map = new Map(left.map((m) => [keyOf(m), m]));
  for (const m of right) map.set(keyOf(m), m);
  return Array.from(map.values());
}

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Initial load (newest page)
  useEffect(() => {
    (async () => {
      const res = await listMessages({ before: null, limit: 25 });
      setMessages(tagMine(res.items));
      setHasMoreOlder(Boolean(res.hasMore));
    })();
    // Force light theme in case your app toggled "dark"
    try { document.documentElement.classList.remove("dark"); } catch {}
  }, []);

  const loadOlder = useCallback(async () => {
    if (isLoadingOlder || !hasMoreOlder) return;
    setIsLoadingOlder(true);
    try {
      const oldest = messages[0]?.createdAt ?? null;
      const res = await listMessages({ before: oldest, limit: 25 });
      setMessages((prev) => mergeUnique(tagMine(res.items), prev));
      setHasMoreOlder(Boolean(res.hasMore));
    } finally {
      setIsLoadingOlder(false);
    }
  }, [isLoadingOlder, hasMoreOlder, messages]);

  const onSend = useCallback(async (text) => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    try {
      const msg = await sendMessage(text.trim());
      const withMine = { ...msg, mine: msg.mine ?? msg.senderId === CURRENT_USER_ID };
      setMessages((prev) => mergeUnique(prev, [withMine]));
    } finally {
      setIsSending(false);
    }
  }, [isSending]);

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="px-4 py-2 border-b font-medium text-gray-900 bg-white">
        Chat
      </header>

      <div className="flex-1 min-h-0">
        <MessageList
          messages={messages}
          loadOlder={loadOlder}
          hasMoreOlder={hasMoreOlder}
          isLoadingOlder={isLoadingOlder}
        />
      </div>

      <Composer onSend={onSend} isSending={isSending} />
    </div>
  );
}

function Composer({ onSend, isSending }) {
  const [text, setText] = useState("");

  const submit = useCallback(() => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  }, [text, onSend]);

  return (
    <div className="border-t p-2 flex items-center gap-2 bg-white">
      <input
        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        placeholder="Type a message…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <button
        onClick={submit}
        disabled={isSending}
        className="rounded-md px-3 py-2 text-sm bg-blue-600 text-white disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
}

/* ===========================
   Real API calls (replace paths if needed)
   =========================== */

async function listMessages({ before = null, limit = 25 } = {}) {
  const qs = new URLSearchParams();
  if (before !== null && before !== undefined) qs.set("before", String(before));
  if (limit) qs.set("limit", String(limit));

  const res = await fetch(`/api/messages?${qs.toString()}`, {
    method: "GET",
    headers: { "Accept": "application/json" },
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`listMessages failed: ${res.status} ${text}`);
  }
  // Expected JSON: { items: Message[], hasMore: boolean }
  const data = await res.json();
  return {
    items: Array.isArray(data.items) ? data.items : [],
    hasMore: Boolean(data.hasMore),
  };
}

async function sendMessage(text) {
  const res = await fetch(`/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    credentials: "include",
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`sendMessage failed: ${res.status} ${t}`);
  }
  // Expected JSON: { id, text, createdAt, senderId, ... }
  return await res.json();
}
