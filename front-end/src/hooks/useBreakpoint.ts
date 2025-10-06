import { useEffect, useState } from "react";

/**
 * React hook returning true when viewport width >= minWidth (in px).
 * Uses a resize listener; lightweight for a few components.
 */
export function useBreakpoint(minWidth: number) {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= minWidth;
  });

  useEffect(() => {
    const handler = () => {
      setMatches(window.innerWidth >= minWidth);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [minWidth]);

  return matches;
}
