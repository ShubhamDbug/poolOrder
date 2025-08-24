import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * useChatScroller
 * - Keeps chat pinned to bottom by default.
 * - Stops pinning if user scrolls up.
 * - Preserves scroll offset when you prepend older messages.
 *
 * Usage:
 *   const {
 *     scrollRef,
 *     pinned,
 *     onScroll,
 *     scrollToBottom,
 *     measureBeforePrepend,
 *     restoreAfterPrepend,
 *     notifyNewMessages,
 *   } = useChatScroller();
 */
export default function useChatScroller({ bottomThreshold = 12 } = {}) {
  const scrollRef = useRef(null);
  const pinnedRef = useRef(true); // start pinned to bottom by default
  const [pinned, setPinned] = useState(true);

  const isAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    const gap = el.scrollHeight - el.clientHeight - el.scrollTop;
    return gap <= bottomThreshold;
  }, [bottomThreshold]);

  const scrollToBottom = useCallback((behavior = "auto") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    pinnedRef.current = pinned;
  }, [pinned]);

  // Attach onScroll to the container
  const onScroll = useCallback(() => {
    setPinned(isAtBottom());
  }, [isAtBottom]);

  // Call this BEFORE you prepend older messages
  const beforePrependMeasure = useRef({ height: 0, top: 0 });
  const measureBeforePrepend = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    beforePrependMeasure.current = {
      height: el.scrollHeight,
      top: el.scrollTop,
    };
  }, []);

  // Call this AFTER older messages have been prepended (state updated)
  const restoreAfterPrepend = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const prev = beforePrependMeasure.current;
    const delta = el.scrollHeight - prev.height;
    el.scrollTop = prev.top + delta; // keep the viewport anchored to the same message
  }, []);

  // When new messages arrive at the bottom, auto-scroll if pinned.
  const notifyNewMessages = useCallback((behavior = "auto") => {
    if (pinnedRef.current) scrollToBottom(behavior);
  }, [scrollToBottom]);

  // On first mount, jump to bottom.
  useLayoutEffect(() => {
    scrollToBottom("auto");
  }, [scrollToBottom]);

  return {
    scrollRef,
    pinned,
    onScroll,
    scrollToBottom,
    measureBeforePrepend,
    restoreAfterPrepend,
    notifyNewMessages,
  };
}
