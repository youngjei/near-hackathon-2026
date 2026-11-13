"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import "./animated-intro.css";

const phrases = ["Photograph a receipt.", "Split the amount.", "Send payment requests.", "Get paid back privately."];
const arrival = 500;
const hold = 2400;
// The next arrival shares the outgoing phrase's 500ms exit: no empty beat.
const phraseDuration = arrival + hold;
const sequenceDuration = (phrases.length - 1) * phraseDuration + arrival + 4500;
const handoffEasing = "cubic-bezier(.4, 0, .2, 1)";
type MotionState = "static" | "running" | "paused";

function PhraseText({ index }: { index: number }) {
  return phrases[index];
}

export function AnimatedIntro({ headingRef }: { headingRef: Ref<HTMLHeadingElement> }) {
  const root = useRef<HTMLDivElement>(null);
  const animations = useRef<Animation[]>([]);
  const userPaused = useRef(false);
  const synchronize = useRef<() => void>(() => {});
  const [state, setState] = useState<MotionState>("static");

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = true;
    let observer: IntersectionObserver | undefined;
    const cancel = () => {
      animations.current.forEach(animation => {
        animation.onfinish = null;
        animation.cancel();
      });
      animations.current = [];
    };
    const sync = () => {
      if (!animations.current.length) return;
      const paused = userPaused.current || document.hidden || !inView;
      animations.current.forEach(animation => paused ? animation.pause() : animation.play());
      setState(paused ? "paused" : "running");
    };
    synchronize.current = sync;
    const start = () => {
      cancel();
      userPaused.current = false;
      if (preference.matches || !element.animate) {
        setState("static");
        return;
      }
      const words = element.querySelectorAll<HTMLElement>(".animated-intro-phrase");
      // Carry the final phrase across the cycle boundary while the first arrives.
      // Starting at arrival skips this carry-over on the initial page load.
      const frames = Array.from(words, (_, index): Keyframe[] => {
        const start = index * phraseDuration;
        if (index === words.length - 1) return [
          { opacity: 1, transform: "translateX(0)", offset: 0, easing: handoffEasing },
          { opacity: 0, transform: "translateX(-12px)", offset: arrival / sequenceDuration },
          { opacity: 0, transform: "translateX(12px)", offset: start / sequenceDuration, easing: handoffEasing },
          { opacity: 1, transform: "translateX(0)", offset: (start + arrival) / sequenceDuration },
          { opacity: 1, transform: "translateX(0)", offset: 1 },
        ];
        return [
          { opacity: 0, transform: "translateX(12px)", offset: 0, easing: start ? "linear" : handoffEasing },
          ...(start ? [{ opacity: 0, transform: "translateX(12px)", offset: start / sequenceDuration, easing: handoffEasing }] : []),
          { opacity: 1, transform: "translateX(0)", offset: (start + arrival) / sequenceDuration },
          { opacity: 1, transform: "translateX(0)", offset: (start + phraseDuration) / sequenceDuration, easing: handoffEasing },
          { opacity: 0, transform: "translateX(-12px)", offset: (start + phraseDuration + arrival) / sequenceDuration },
          { opacity: 0, transform: "translateX(-12px)", offset: 1 },
        ];
      });
      const timing = { duration: sequenceDuration, iterations: Infinity, fill: "both" as const };
      animations.current = Array.from(words, (word, index) => word.animate(frames[index], timing));
      const peeks = element.querySelectorAll<HTMLElement>(".animated-intro-peek-group");
      animations.current.push(...Array.from(peeks, (peek, index) => peek.animate(
        frames[index].map(({ opacity, offset, easing }) => ({ opacity: Number(opacity) * .4, offset, easing })), timing,
      )));
      animations.current.forEach(animation => { animation.currentTime = arrival; });
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
  }, []);

  function control() {
    userPaused.current = !userPaused.current;
    synchronize.current();
  }

  const controlLabel = state === "paused" ? "Resume animation" : "Pause animation";
  return <div ref={root} className="intro start-intro animated-intro" data-motion-state={state}>
    <div className="animated-intro-stage">
      <div className="animated-intro-peeks" aria-hidden="true">
        {phrases.map((phrase, index) => <div className="animated-intro-peek-group" key={phrase}>
          <span className="animated-intro-trail"><span><PhraseText index={(index + phrases.length - 1) % phrases.length} /></span></span>
          <span className="animated-intro-upcoming"><span><PhraseText index={(index + 1) % phrases.length} /></span></span>
        </div>)}
      </div>
    <h1 ref={headingRef} tabIndex={-1} className="animated-intro-heading"
      aria-label={phrases.join(" ")}>
      <span aria-hidden="true" className="animated-intro-static">Split a receipt into private requests.</span>
      {phrases.map((phrase, index) => <span key={phrase} aria-hidden="true"
        className={`animated-intro-phrase${index === phrases.length - 1 ? " animated-intro-private" : ""}`}>
        <PhraseText index={index} />
      </span>)}
    </h1>
    </div>
    <div className="animated-intro-caption">
      <p>Get paid back in USDC for the dinner you covered.<span className="animated-intro-secondary">Each friend gets a private link to pay their share.</span></p>
      {state !== "static" && <button type="button" className="intro-motion-control" onClick={control} aria-label={controlLabel} title={controlLabel}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" aria-hidden="true">
          {state === "paused" ? <path d="m9 6 9 6-9 6Z" /> : <><path d="M9 6v12M15 6v12" /></>}
        </svg>
      </button>}
    </div>
  </div>;
}
