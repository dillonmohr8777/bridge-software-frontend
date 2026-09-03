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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [risen, setRisen] = useState(false);
  const [motion, setMotion] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRisen(true);
      return;
    }
    // The loop is charm, not content: skip it on narrow screens entirely.
    setMotion(window.matchMedia("(min-width: 900px)").matches);
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

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    node.load();
    void node.play().catch(() => {});
  }, [risen, motion]);

  return (
    <div className={`bridge-mascot ${className}`} data-risen={risen} ref={ref}>
      {/* The still is the baseline and the only thing phones ever pay for.
          Her loop is fetched and played only once she has risen into view. */}
      {risen && motion ? (
        <video
          aria-hidden={alt ? undefined : true}
          aria-label={alt || undefined}
          className="bridge-mascot-art"
          height={1000}
          loop
          muted
          playsInline
          poster="/mascot/bridget.webp"
          preload="none"
          ref={videoRef}
          width={736}
        >
          <source src="/mascot/bridget-loop.webm" type="video/webm" />
        </video>
      ) : (
        <img
          alt={alt}
          aria-hidden={alt ? undefined : true}
          className="bridge-mascot-art"
          decoding="async"
          height={1000}
          loading="lazy"
          src="/mascot/bridget.webp"
          width={736}
        />
      )}
    </div>
  );
}
