import React, { useEffect, useMemo, useRef, useState } from "react";
import useChatScroller from "@/hooks/useChatScroller";

export default function MessageList({
  messages,
  loadOlder,        // async () => void  (prepend older messages)
  hasMoreOlder,     // boolean
  isLoadingOlder,   // boolean
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

  // Sort ascending (oldest -> newest) for rendering consistency
  const ordered = useMemo(() => {
    return [...messages].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }, [messages]);

  // Track last rendered newest message id to detect appends
  const lastMsgIdRef = useRef(null);
  useEffect(() => {
    const last = ordered[ordered.length - 1];
    const lastId = last?.id ?? last?._id ?? last?.createdAt;
    const changed = lastId !== lastMsgIdRef.current;
    if (changed) {
      // Newest message changed — tell the scroller so it can stick if pinned
      notifyNewMessages("smooth");
      lastMsgIdRef.current = lastId;
    }
  }, [ordered, notifyNewMessages]);

  // Handle reaching the top to load older messages
  const [topLock, setTopLock] = useState(false); // simple throttle
  const onScrollWrapper = async () => {
    onScroll();
    const el = scrollRef.current;
    if (!el) return;

    if (el.scrollTop <= 80 && hasMoreOlder && !isLoadingOlder && !topLock) {
      setTopLock(true);
      // Preserve position while we prepend
      measureBeforePrepend();
      try {
        await loadOlder(); // parent should prepend older messages to state
      } finally {
        // Let React paint, then restore position
        requestAnimationFrame(() => {
          restoreAfterPrepend();
          // Small delay to avoid immediate retrigger
          setTimeout(() => setTopLock(false), 250);
        });
      }
    }
  };

  return (
    <div className="h-full w-full relative">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        onScroll={onScrollWrapper}
        className="overflow-y-auto h-full px-3 py-2 space-y-2 bg-white dark:bg-neutral-900"
        id="chat-scroll-container"
      >
        {isLoadingOlder && (
          <div className="text-center text-xs text-neutral-500 py-2">Loading older…</div>
        )}

        {ordered.map((m) => (
          <Bubble key={m.id ?? m._id ?? `${m.createdAt}-${m.senderId}` } msg={m} />
        ))}

        {/* Bottom spacer to ensure last bubble isn't glued to the edge */}
        <div style={{ height: 8 }} />
      </div>

      {/* Jump-to-latest when not pinned */}
      {!pinned && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="absolute right-4 bottom-24 text-sm rounded-full shadow-md bg-black/80 text-white px-3 py-1"
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
        ${mine ? "bg-blue-600 text-white" : "bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-100"}`}
      >
        {msg.text}
        <div className="mt-1 text-[10px] opacity-70">
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
