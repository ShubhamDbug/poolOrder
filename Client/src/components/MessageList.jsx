import React, { useEffect, useMemo, useRef, useState } from "react";
import useChatScroller from "@/hooks/useChatScroller";

export default function MessageList({
  messages,
  loadOlder,
  hasMoreOlder,
  isLoadingOlder,
}) {
  const {
    scrollRef,
    pinned,
    onScroll,
    scrollToBottom,
    measureBeforePrepend,
    restoreAfterPrepend,
    notifyNewMessages,
  } = useChatScroller();

  // Oldest -> Newest (robust to string/number timestamps)
  const ordered = useMemo(() => {
    const ts = (v) => (typeof v === "number" ? v : new Date(v).getTime() || 0);
    return [...messages].sort((a, b) => ts(a.createdAt) - ts(b.createdAt));
  }, [messages]);

  // Auto-stick when newest message changes
  const lastMsgIdRef = useRef(null);
  useEffect(() => {
    const last = ordered[ordered.length - 1];
    const lastId = last?.id ?? last?._id ?? last?.createdAt;
    if (lastId !== lastMsgIdRef.current) {
      notifyNewMessages("smooth");
      lastMsgIdRef.current = lastId;
    }
  }, [ordered, notifyNewMessages]);

  // Infinite-scroll load older
  const [topLock, setTopLock] = useState(false);
  const onScrollWrapper = async () => {
    onScroll();
    const el = scrollRef.current;
    if (!el) return;

    if (el.scrollTop <= 80 && hasMoreOlder && !isLoadingOlder && !topLock) {
      setTopLock(true);
      measureBeforePrepend();
      try {
        await loadOlder();
      } finally {
        requestAnimationFrame(() => {
          restoreAfterPrepend();
          setTimeout(() => setTopLock(false), 250);
        });
      }
    }
  };

  return (
    <div className="h-full w-full relative">
      <div
        ref={scrollRef}
        onScroll={onScrollWrapper}
        className="overflow-y-auto h-full px-3 py-2 space-y-2 bg-white"
        id="chat-scroll-container"
      >
        {isLoadingOlder && (
          <div className="text-center text-xs text-gray-500 py-2">Loading older…</div>
        )}

        {ordered.map((m) => (
          <Bubble key={m.id ?? m._id ?? `${m.createdAt}-${m.senderId}`} msg={m} />
        ))}

        <div style={{ height: 8 }} />
      </div>

      {!pinned && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="absolute right-4 bottom-24 text-sm rounded-full shadow-md bg-gray-900 text-white px-3 py-1"
        >
          Jump to latest ↓
        </button>
      )}
    </div>
  );
}

function Bubble({ msg }) {
  const mine = msg.mine ?? msg.isMine ?? false;
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap shadow-sm
        ${mine ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}
      >
        {msg.text}
        <div className="mt-1 text-[10px] text-gray-500">
          {formatTime(msg.createdAt)}
        </div>
      </div>
    </div>
  );
}

function formatTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
