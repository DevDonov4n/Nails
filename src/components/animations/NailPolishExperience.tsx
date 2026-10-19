"use client";

import { useEffect, useRef } from "react";
import styles from "./NailPolishExperience.module.css";

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export default function NailPolishExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const bottleRef = useRef<SVGGElement>(null);
  const brushRef = useRef<SVGGElement>(null);
  const nailRef = useRef<SVGGElement>(null);
  const polishRef = useRef<SVGPathElement>(null);
  const phraseRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const range = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = clamp(-rect.top / range);
      const bottle = bottleRef.current;
      const brush = brushRef.current;
      const nail = nailRef.current;
      const polish = polishRef.current;

      if (bottle) {
        const bottleOpacity = progress > 0.42 ? clamp((0.56 - progress) / 0.14) : 1;
        bottle.style.opacity = String(bottleOpacity);
        bottle.style.transform = reducedMotion ? "translate(0 0)" : `translate(0 ${progress * 16}px) rotate(${Math.sin(progress * Math.PI * 2) * 2}deg)`;
      }

      const brushProgress = clamp((progress - 0.16) / 0.58);
      if (brush) {
        const x = 205 + Math.sin(brushProgress * Math.PI * 4) * 65;
        const y = 160 + brushProgress * 300;
        brush.style.opacity = progress > 0.13 && progress < 0.82 ? "1" : "0";
        brush.style.transform = reducedMotion ? "translate(0 0)" : `translate(${x - 205}px, ${y - 160}px) rotate(${Math.sin(brushProgress * Math.PI * 4) * 10}deg)`;
      }

      const nailProgress = clamp((progress - 0.48) / 0.36);
      if (nail) {
        nail.style.opacity = String(nailProgress);
        nail.style.transform = reducedMotion ? "translate(0 0)" : `translate(0 ${(1 - nailProgress) * 22}px) scale(${0.94 + nailProgress * 0.06})`;
      }
      if (polish) polish.style.strokeDashoffset = String(1 - nailProgress);

      phraseRefs.current.forEach((element, index) => {
        if (!element) return;
        const start = 0.2 + index * 0.22;
        const opacity = clamp((progress - start) / 0.08) * clamp((start + 0.2 - progress) / 0.08);
        element.style.opacity = String(opacity);
        element.style.transform = reducedMotion ? "none" : `translateY(${(1 - opacity) * 12}px)`;
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
    <section ref={sectionRef} className={styles.experience} aria-label="Experiência visual de esmaltação">
      <div className={styles.sticky}>
        <div className={styles.intro}>
          <span className={styles.kicker}>NAILS BY SAMARA · AUTOCUIDADO</span>
          <h2>Um toque de cor.<br /><em>Um momento seu.</em></h2>
          <span className={styles.scrollHint}>CONTINUE DESCENDO <span aria-hidden="true">↓</span></span>
        </div>

        <svg className={styles.scene} viewBox="0 0 420 520" role="img" aria-label="Frasco de esmalte, pincel e unha sendo pintada" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="bottle-glass" x1="0" x2="1">
              <stop offset="0" stopColor="#8f1535" />
              <stop offset=".32" stopColor="#d64f70" />
              <stop offset=".56" stopColor="#f39aaa" />
              <stop offset="1" stopColor="#85112f" />
            </linearGradient>
            <linearGradient id="cap-shine" x1="0" x2="1">
              <stop offset="0" stopColor="#302229" />
              <stop offset=".5" stopColor="#795762" />
              <stop offset="1" stopColor="#2b2025" />
            </linearGradient>
          </defs>
          <g ref={bottleRef} className={styles.bottle}>
            <rect x="177" y="72" width="66" height="88" rx="8" fill="url(#cap-shine)" />
            <rect x="171" y="151" width="78" height="13" rx="3" fill="#e6c5c5" />
            <path d="M174 161 L246 161 L246 184 Q246 198 260 211 Q278 228 278 252 L278 332 Q278 356 254 356 L166 356 Q142 356 142 332 L142 252 Q142 228 160 211 Q174 198 174 184 Z" fill="url(#bottle-glass)" stroke="#fff4f5" strokeWidth="3" />
            <path d="M159 244 Q159 224 178 214 L178 326 Q178 339 190 342" fill="none" stroke="#fff" strokeOpacity=".34" strokeWidth="8" strokeLinecap="round" />
            <rect x="159" y="264" width="102" height="55" rx="3" fill="#fff0f1" fillOpacity=".94" />
            <text x="210" y="287" textAnchor="middle" fill="#9d1734" fontSize="14" letterSpacing="3" fontFamily="Georgia,serif">NAILS</text>
            <text x="210" y="303" textAnchor="middle" fill="#9d1734" fontSize="6" letterSpacing="2">BY SAMARA</text>
          </g>
          <g ref={nailRef} className={styles.nail}>
            <path d="M142 432 C137 414 147 398 163 393 C180 388 194 402 196 421 L205 464 Q207 480 191 484 L166 490 Q150 491 147 474 Z" fill="#f2c7c9" stroke="#d99da5" strokeWidth="2" />
            <path ref={polishRef} d="M151 430 C148 416 155 405 166 402 C178 400 187 411 189 426 L198 462 Q200 473 188 477 L169 481 Q158 482 156 470 Z" fill="#b51e42" stroke="#b51e42" strokeWidth="2" pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
            <path d="M160 418 Q164 410 171 412" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round" />
          </g>
          <g ref={brushRef} className={styles.brush}>
            <rect x="197" y="126" width="16" height="125" rx="5" fill="url(#cap-shine)" />
            <path d="M197 248 L213 248 L210 287 Q205 296 200 287 Z" fill="#a90f35" />
            <path d="M201 279 L209 279" stroke="#f4a5b6" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>

        <div className={styles.phrases} aria-live="polite">
          <p ref={(node) => { phraseRefs.current[0] = node; }}>Delicada.</p>
          <p ref={(node) => { phraseRefs.current[1] = node; }}>Bem cuidada.</p>
          <p ref={(node) => { phraseRefs.current[2] = node; }}>Elegante.</p>
        </div>
        <div className={styles.progress} aria-hidden="true"><span ref={progressRef} /></div>
      </div>
    </section>
  );
}
