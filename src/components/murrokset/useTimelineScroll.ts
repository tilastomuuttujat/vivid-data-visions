import { useEffect, useRef } from "react";

// Keep the selected point visible when a wide SVG is viewed on a narrow screen.
export function useTimelineScroll(fraction: number, contentKey = "") {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const center = () => {
      element.scrollLeft = Math.max(0, element.scrollWidth * fraction - element.clientWidth / 2);
    };
    center();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(center);
    observer?.observe(element);
    window.addEventListener("resize", center);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", center);
    };
  }, [fraction, contentKey]);
  return ref;
}
