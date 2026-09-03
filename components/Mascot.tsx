"use client";

import { useEffect, useRef, useState } from "react";
import "./mascot.css";

type MascotProps = {
  /** Where she sits inside the nearest positioned ancestor. */
  className?: string;
  /** Described for screen readers only when she carries meaning; she does not. */
  alt?: string;
};

/**
 * The Bridge mascot. She rises from behind whatever she is placed against the
 * first time that region is scrolled into view, then keeps a slow idle float.
 *
 * Decorative: aria-hidden, and the whole thing sits still under
 * prefers-reduced-motion rather than popping.
 */
export function Mascot({ className = "", alt = "" }: MascotProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [risen, setRisen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRisen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setRisen(true);
        io.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div className={`bridge-mascot ${className}`} data-risen={risen} ref={ref}>
      <img
        alt={alt}
        aria-hidden={alt ? undefined : true}
        className="bridge-mascot-art"
        decoding="async"
        height={900}
        loading="lazy"
        src="/mascot/bridget.webp"
        width={569}
      />
    </div>
  );
}
