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
  const [motion, setMotion] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRisen(true);
      return;
    }
    // Mobile-first product: she animates on phones too. The loop is a 666 KB
    // webm fetched only after she rises, and only when the connection is not
    // flagged as slow or data-saving.
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const thrifty = Boolean(conn && (conn.saveData || /2g/.test(conn.effectiveType ?? "")));
    setMotion(!thrifty);
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
      {/* Animated WebP, not a video: iOS Safari has no alpha support in
          WebM, so a <video> renders her on an opaque block. WebP alpha works
          everywhere, and it is a plain <img> so there is nothing to play. */}
      <img
        alt={alt}
        aria-hidden={alt ? undefined : true}
        className="bridge-mascot-art"
        decoding="async"
        height={518}
        loading="lazy"
        src={risen && motion ? "/mascot/bridget-loop.webp" : "/mascot/bridget.webp"}
        width={400}
      />
    </div>
  );
}
