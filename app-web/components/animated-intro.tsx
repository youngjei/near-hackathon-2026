"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import "./animated-intro.css";

const phrases = ["Photograph a receipt.", "Split the amount.", "Send ready-to-pay requests.", "Privately."];
const arrival = 350;
const hold = 2400;
const exit = 200;
const phraseDuration = arrival + hold + exit;
const sequenceDuration = (phrases.length - 1) * phraseDuration + arrival + 3000;
type MotionState = "static" | "running" | "paused" | "complete";

export function AnimatedIntro({ headingRef }: { headingRef: Ref<HTMLHeadingElement> }) {
  const root = useRef<HTMLDivElement>(null);
  const animations = useRef<Animation[]>([]);
  const userPaused = useRef(false);
  const synchronize = useRef<() => void>(() => {});
  const [state, setState] = useState<MotionState>("static");
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = true;
    let finished = false;
    let observer: IntersectionObserver | undefined;
    const cancel = () => {
      animations.current.forEach(animation => {
        animation.onfinish = null;
        animation.cancel();
      });
      animations.current = [];
    };
    const sync = () => {
      if (finished || !animations.current.length) return;
      const paused = userPaused.current || document.hidden || !inView;
      animations.current.forEach(animation => paused ? animation.pause() : animation.play());
      setState(paused ? "paused" : "running");
    };
    synchronize.current = sync;
    const start = () => {
      cancel();
      finished = false;
      userPaused.current = false;
      if (preference.matches || !element.animate) {
        setState("static");
        return;
      }
      const words = element.querySelectorAll<HTMLElement>(".animated-intro-phrase");
      animations.current = Array.from(words, (word, index) => {
        const last = index === words.length - 1;
        const start = index * phraseDuration;
        return word.animate([
          { opacity: 0, transform: "translateX(28px)", offset: 0, easing: start ? "linear" : "cubic-bezier(.16, 1, .3, 1)" },
          ...(start ? [{ opacity: 0, transform: "translateX(28px)", offset: start / sequenceDuration, easing: "cubic-bezier(.16, 1, .3, 1)" }] : []),
          { opacity: 1, transform: "translateX(0)", offset: (start + arrival) / sequenceDuration },
          { opacity: 1, transform: "translateX(0)", offset: last ? 1 : (start + arrival + hold) / sequenceDuration, easing: "cubic-bezier(.7, 0, .84, 0)" },
          ...(!last ? [
            { opacity: 0, transform: "translateX(-24px)", offset: (start + phraseDuration) / sequenceDuration },
            { opacity: 0, transform: "translateX(-24px)", offset: 1 },
          ] : []),
        ], { duration: sequenceDuration, fill: "both" });
      });
      animations.current.at(-1)!.onfinish = () => {
        finished = true;
        cancel();
        setState("complete");
      };
      sync();
    };
    start();
    document.addEventListener("visibilitychange", sync);
    preference.addEventListener("change", start);
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        sync();
      });
      observer.observe(element);
    }
    return () => {
      cancel();
      observer?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      preference.removeEventListener("change", start);
      synchronize.current = () => {};
    };
  }, [replay]);

  function control() {
    if (state === "complete") {
      setReplay(value => value + 1);
      return;
    }
    userPaused.current = !userPaused.current;
    synchronize.current();
  }

  const controlLabel = state === "complete" ? "Replay animation" : state === "paused" ? "Resume animation" : "Pause animation";
  return <div ref={root} className="intro start-intro animated-intro" data-motion-state={state}>
    <h1 ref={headingRef} tabIndex={-1} className="animated-intro-heading"
      aria-label="Photograph a receipt. Split the amount. Send ready-to-pay requests. Privately.">
      <span aria-hidden="true" className="animated-intro-static">Split a receipt into private requests.</span>
      {phrases.map((phrase, index) => <span key={phrase} aria-hidden="true"
        className={`animated-intro-phrase${index === phrases.length - 1 ? " animated-intro-private" : ""}`}>
        {index === 2 ? <>Send <span className="animated-intro-unbroken">ready-to-pay</span> requests.</> : phrase}
      </span>)}
    </h1>
    <div className="animated-intro-caption">
      <p>One private payment link for each friend.</p>
      {state !== "static" && <button type="button" className="intro-motion-control" onClick={control} aria-label={controlLabel} title={controlLabel}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" aria-hidden="true">
          {state === "complete" ? <><path d="M5 9a7.5 7.5 0 1 1-.5 6M5 4v5h5" /></> : state === "paused" ? <path d="m9 6 9 6-9 6Z" /> : <><path d="M9 6v12M15 6v12" /></>}
        </svg>
      </button>}
    </div>
  </div>;
}
