"use client";

import { useEffect, useRef, useState } from "react";
import "./bridge-intro.css";

/*
 * The 3.25s scrapbook cold open that runs before the 21+ gate.
 *
 * The wordmark cycles through fourteen treatments at speed while torn paper, tape,
 * stamps, doodles and a guitar slam in around it. It is the Field Notes
 * companion's visual language, which the client already reacted to, pushed
 * harder and made the front door.
 *
 * Two rules it must not break: it is skippable at any time by anyone, and it
 * does not run at all under prefers-reduced-motion. It is decoration in front
 * of a legal gate, so it can never be the thing standing between a person and
 * that gate.
 */

const RUN_MS = 3250;
const TREATMENT_MS = 210;
const TREATMENTS = 14;
const WORD = "BRIDGE";

export function BridgeIntro({ onDone }: { onDone: () => void }) {
  const [treatment, setTreatment] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);
  const skipRef = useRef<HTMLButtonElement>(null);

  /* One exit path, however it is reached, so a skip and a timeout cannot both fire. */
  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true);
    window.setTimeout(onDone, 320);
  }

  useEffect(() => {
    skipRef.current?.focus();

    const cycle = window.setInterval(() => {
      setTreatment((current) => (current + 1) % TREATMENTS);
    }, TREATMENT_MS);
    const end = window.setTimeout(finish, RUN_MS);

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") finish();
    }
    window.addEventListener("keydown", onKey);

    return () => {
      window.clearInterval(cycle);
      window.clearTimeout(end);
      window.removeEventListener("keydown", onKey);
    };
    // finish and onDone are stable for the life of the intro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      aria-label="Bridge intro animation"
      className="bridge-intro"
      data-leaving={leaving || undefined}
      onClick={finish}
      role="presentation"
    >
      <div className="bridge-intro-grain" aria-hidden="true" />

      {/* Paper, tape and stamps land on beats rather than drifting in. */}
      <img alt="" aria-hidden="true" className="bi-ephemera bi-tape-a" src="/intro/ephemera.svg" />
      <img alt="" aria-hidden="true" className="bi-ephemera bi-tape-b" src="/intro/ephemera.svg" />
      <img alt="" aria-hidden="true" className="bi-ephemera bi-leaf-a" src="/intro/leaf-doodles.svg" />
      <img alt="" aria-hidden="true" className="bi-ephemera bi-leaf-b" src="/intro/leaf-doodles.svg" />
      <img alt="" aria-hidden="true" className="bi-ephemera bi-arrow" src="/intro/arrows.svg" />
      <img alt="" aria-hidden="true" className="bi-ephemera bi-stamp" src="/intro/stamp-1.webp" />
      <img alt="" aria-hidden="true" className="bi-ephemera bi-smoke" src="/intro/smoke-motif.svg" />

      {/* The guitar runs corner to corner behind the wordmark. */}
      <svg aria-hidden="true" className="bi-guitar" viewBox="0 0 620 190">
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="6">
          <path d="M108 95c0-34 26-58 62-58 24 0 38 12 52 12s24-10 44-10c30 0 50 22 50 56s-20 56-50 56c-20 0-30-10-44-10s-28 12-52 12c-36 0-62-24-62-58z" />
          <path d="M316 95h150" />
          <path d="M466 74h44a10 10 0 0 1 10 10v22a10 10 0 0 1-10 10h-44z" />
          <circle cx="196" cy="95" r="26" />
          <path d="M258 78v34M276 74v42" />
          <path d="M476 82h34M476 95h34M476 108h34" strokeWidth="3" />
        </g>
      </svg>

      <div className="bi-stage">
        <span className="bi-kicker">Est. for the industry that gets shut out</span>
        <h1 className="bi-word" data-treatment={treatment}>
          {WORD.split("").map((letter, index) => (
            <span
              className="bi-letter"
              key={`${letter}-${index}`}
              style={{ animationDelay: `${index * 38}ms` }}
            >
              {letter}
            </span>
          ))}
        </h1>
        <span className="bi-underline" aria-hidden="true" />
        <span className="bi-hand">one industry, one network</span>
      </div>

      <button className="bi-skip" onClick={finish} ref={skipRef} type="button">
        Skip
      </button>
    </div>
  );
}
