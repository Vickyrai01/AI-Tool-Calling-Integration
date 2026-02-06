"use client";
import { useEffect, useState } from "react";

export default function ScrollToBottom({
  scrollContainerSelector = "#chat-scroll",
}: {
  scrollContainerSelector?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.querySelector(
      scrollContainerSelector,
    ) as HTMLElement | null;
    if (!el) return;
    const scrollEl = el;
    function onScroll() {
      const nearBottom =
        scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight <
        120;
      setVisible(!nearBottom);
    }
    onScroll();
    scrollEl.addEventListener("scroll", onScroll);
    return () => scrollEl.removeEventListener("scroll", onScroll);
  }, [scrollContainerSelector]);

  if (!visible) return null;

  function scrollDown() {
    const el = document.querySelector(
      scrollContainerSelector,
    ) as HTMLElement | null;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }

  return (
    <button
      onClick={scrollDown}
      className="fixed bottom-20 right-6 z-30 px-3 py-2 rounded-full bg-primary text-white shadow-md"
      aria-label="Ir al final"
      title="Ir al final"
    >
      ↓
    </button>
  );
}
