import React, { useCallback, useEffect, useState } from "react";
import MessageList from "../components/MessageList"; // <- relative path, no alias

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Initial page
  useEffect(() => {
    (async () => {
      const res = await listMessages({ before: null, limit: 25 });
      setMessages(res.items);
      setHasMoreOlder(!!res.hasMore);
    })();
  }, []);

  const loadOlder = useCallback(async () => {
    if (isLoadingOlder || !hasMoreOlder) return;
    setIsLoadingOlder(true);
    try {
      const oldest = messages[0]?.createdAt ?? null;
      const res = await listMessages({ before: oldest, limit: 25 });
      // Prepend older messages
      setMessages((prev) => [...res.items, ...prev]);
      setHasMoreOlder(!!res.hasMore);
    } finally {
      setIsLoadingOlder(false);
    }
  }, [isLoadingOlder, hasMoreOlder, messages]);

  const onSend = useCallback(async (text) => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    try {
      const msg = await sendMessage(text.trim());
      setMessages((prev) => [...prev, msg]);
    } finally {
      setIsSending(false);
    }
  }, [isSending]);

  return (
    <div className="h-full flex flex-col">
      <header className="px-4 py-2 border-b font-medium">Chat</header>
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
    <div className="border-t p-2 flex items-center gap-2">
      <input
        className="flex-1 rounded-md border px-3 py-2 text-sm"
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
   STUB API — replace with your real endpoints
   =========================== */

async function listMessages({ before = null, limit = 25 } = {}) {
  // Example: GET /api/messages?before=<ts>&limit=25
  await sleep(200);
  const base = before ? Number(before) : Date.now();
  const items = Array.from({ length: limit }, (_, i) => {
    const createdAt = base - (limit - i) * 60_000; // 1 minute apart
    return {
      id: `${createdAt}`,
      text: `Message at ${new Date(createdAt).toLocaleTimeString()}`,
      createdAt,
      mine: Math.random() < 0.5,
    };
  });
  return { items, hasMore: base > 1000 * 60 * 60 };
}

async function sendMessage(text) {
  // Example: POST /api/messages
  await sleep(150);
  return {
    id: `${Date.now()}`,
    text,
    createdAt: Date.now(),
    mine: true,
  };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
