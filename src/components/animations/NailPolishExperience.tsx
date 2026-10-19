"use client";

import { useEffect, useRef } from "react";
import styles from "./NailPolishExperience.module.css";

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const zigzagPoints = [
  { x: 560, y: 42 }, { x: 565, y: 88 }, { x: 720, y: 118 },
  { x: 560, y: 148 }, { x: 720, y: 185 }, { x: 595, y: 218 },
  { x: 650, y: 270 }, { x: 700, y: 322 },
];

function pointOnPath(progress: number) {
  const scaled = clamp(progress) * (zigzagPoints.length - 1);
  const index = Math.min(zigzagPoints.length - 2, Math.floor(scaled));
  const fraction = scaled - index;
  const from = zigzagPoints[index];
  const to = zigzagPoints[index + 1];
  return { x: from.x + (to.x - from.x) * fraction, y: from.y + (to.y - from.y) * fraction };
}

export default function NailPolishExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const bottleRef = useRef<SVGGElement>(null);
  const brushRef = useRef<SVGGElement>(null);
  const paintRef = useRef<SVGPathElement>(null);
  const phraseRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const paint = paintRef.current;
    const pathLength = paint?.getTotalLength() ?? 1;
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const range = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = clamp(-rect.top / range);
      const bottle = bottleRef.current;
      const brush = brushRef.current;
      const paintProgress = clamp((progress - 0.06) / 0.78);

      if (bottle) {
        const opacity = progress > 0.82 ? clamp((1 - progress) / 0.18) : 1;
        bottle.style.opacity = String(opacity);
        bottle.style.transform = reducedMotion ? "none" : `translateY(${Math.sin(progress * Math.PI) * -7}px)`;
      }
      if (paint) {
        paint.style.strokeDasharray = String(pathLength);
        paint.style.strokeDashoffset = String(pathLength * (1 - paintProgress));
      }
      if (brush) {
        const point = pointOnPath(paintProgress);
        const next = pointOnPath(Math.min(1, paintProgress + 0.015));
        const angle = Math.atan2(next.y - point.y, next.x - point.x) * (180 / Math.PI) + 90;
        brush.style.opacity = progress > 0.04 && progress < 0.88 ? "1" : "0";
        brush.style.transform = reducedMotion ? `translate(${point.x}px, ${point.y}px) rotate(0deg)` : `translate(${point.x}px, ${point.y}px) rotate(${angle}deg)`;
      }

      phraseRefs.current.forEach((element, index) => {
        if (!element) return;
        const start = 0.12 + index * 0.27;
        const opacity = clamp((progress - start) / 0.09) * clamp((start + 0.24 - progress) / 0.09);
        element.style.opacity = String(opacity);
        element.style.transform = reducedMotion ? "none" : `translateY(${(1 - opacity) * 10}px)`;
      });
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(onScroll);
    observer.observe(section);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.experience} aria-label="Demonstração de esmaltação em zigue-zague">
      <div className={styles.sticky}>
        <div className={styles.intro}>
          <span className={styles.kicker}>NAILS BY SAMARA · AUTOCUIDADO</span>
          <h2>Um toque de cor.<br /><em>Um momento seu.</em></h2>
          <span className={styles.scrollHint}>CONTINUE DESCENDO <span aria-hidden="true">↓</span></span>
        </div>

        <div className={styles.stage}>
          <svg className={styles.scene} viewBox="0 0 900 400" role="img" aria-label="Frascos de esmalte e pincel pintando uma linha em zigue-zague" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="polish-glass" x1="0" x2="1">
                <stop offset="0" stopColor="#f51b6d" /><stop offset=".5" stopColor="#ff4d91" /><stop offset="1" stopColor="#cc0752" />
              </linearGradient>
              <linearGradient id="cap-shine" x1="0" x2="1">
                <stop offset="0" stopColor="#211e20" /><stop offset=".55" stopColor="#555054" /><stop offset="1" stopColor="#211e20" />
              </linearGradient>
            </defs>

            <g ref={bottleRef} className={styles.bottle}>
              {[80, 260, 410].map((x) => (
                <g key={x} transform={`translate(${x} 0)`}>
                  <path d="M-31 313 Q-30 284 -13 276 L13 276 Q30 284 31 313 L31 345 L-31 345 Z" fill="#ffb4d1" opacity=".85" />
                  <path d="M-29 312 Q-29 286 -11 277 L11 277 Q29 286 29 312 L23 331 Q0 344 -23 331 Z" fill="url(#polish-glass)" />
                  <path d="M-15 286 Q-5 278 3 284 Q17 293 12 315 Q9 326 -1 328" fill="none" stroke="#ff91bd" strokeWidth="4" strokeLinecap="round" opacity=".7" />
                  <rect x="-16" y="214" width="32" height="63" rx="4" fill="url(#cap-shine)" />
                  <path d="M-10 219 L-4 219 L-4 270" fill="none" stroke="#ffffff" strokeOpacity=".22" strokeWidth="2" />
                </g>
              ))}
            </g>

            <path d="M560 42 C560 83 587 94 632 105 S730 111 720 128 S590 130 560 148 S600 178 649 188 S739 208 720 224 S625 221 595 218 S617 248 650 270 S675 305 700 322"
              fill="none" stroke="#ed1726" strokeWidth="27" strokeLinecap="round" strokeLinejoin="round" opacity=".98" />
            <path ref={paintRef}
              d="M560 42 C560 83 587 94 632 105 S730 111 720 128 S590 130 560 148 S600 178 649 188 S739 208 720 224 S625 221 595 218 S617 248 650 270 S675 305 700 322"
              fill="none" stroke="#ed1726" strokeWidth="27" strokeLinecap="round" strokeLinejoin="round" pathLength="1" />

            <g ref={brushRef} className={styles.brush} transform="translate(560 42)">
              <g transform="translate(-8 -48) rotate(-35)">
                <rect x="-17" y="-5" width="34" height="62" rx="4" fill="url(#cap-shine)" stroke="#3d383d" strokeWidth="2" />
                <path d="M-10 1 L-10 49" stroke="#ffffff" strokeOpacity=".2" strokeWidth="2" />
                <rect x="-7" y="55" width="14" height="14" rx="2" fill="#ff1672" />
                <path d="M-7 67 L7 67 L4 98 Q0 106 -4 98 Z" fill="#ff1672" />
                <path d="M-2 72 L-2 95" stroke="#ff9ac4" strokeWidth="2" strokeLinecap="round" />
              </g>
            </g>
          </svg>
          <div className={styles.phrases} aria-live="polite">
            <p ref={(node) => { phraseRefs.current[0] = node; }}>frase 1</p>
            <p ref={(node) => { phraseRefs.current[1] = node; }}>frase 2</p>
            <p ref={(node) => { phraseRefs.current[2] = node; }}>frase 3</p>
          </div>
        </div>
        <div className={styles.progress} aria-hidden="true"><span ref={progressRef} /></div>
      </div>
    </section>
  );
}
