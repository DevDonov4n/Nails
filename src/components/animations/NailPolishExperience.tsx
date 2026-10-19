"use client";

import { useEffect, useRef } from "react";
import styles from "./NailPolishExperience.module.css";

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const easeInOut = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

const zigzagPoints = [
  { x: 450, y: 205 },
  { x: 450, y: 235 },
  { x: 350, y: 270 },
  { x: 535, y: 310 },
  { x: 355, y: 350 },
  { x: 530, y: 390 },
  { x: 405, y: 425 },
  { x: 450, y: 480 },
];

function pointOnPath(progress: number) {
  const scaled = clamp(progress) * (zigzagPoints.length - 1);
  const index = Math.min(zigzagPoints.length - 2, Math.floor(scaled));
  const fraction = scaled - index;
  const from = zigzagPoints[index];
  const to = zigzagPoints[index + 1];
  return {
    x: from.x + (to.x - from.x) * fraction,
    y: from.y + (to.y - from.y) * fraction,
  };
}

export default function NailPolishExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const bottleRef = useRef<SVGGElement>(null);
  const capRef = useRef<SVGGElement>(null);
  const brushRef = useRef<SVGGElement>(null);
  const paintRef = useRef<SVGPathElement>(null);
  const nailRef = useRef<SVGGElement>(null);
  const nailPolishRef = useRef<SVGPathElement>(null);
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

      // First open the bottle, then draw the polish trail, and finally reveal the nail.
      const opening = easeInOut(progress / 0.16);
      const painting = easeInOut((progress - 0.12) / 0.76);
      const nailReveal = easeInOut((progress - 0.78) / 0.2);

      if (capRef.current) {
        capRef.current.setAttribute(
          "transform",
          `translate(0 ${reducedMotion ? 0 : -opening * 46}) rotate(${reducedMotion ? 0 : -opening * 7} 450 128)`,
        );
        capRef.current.style.opacity = String(1 - opening * 0.96);
      }
      if (bottleRef.current) {
        bottleRef.current.style.opacity = String(1 - easeInOut((progress - 0.16) / 0.16));
      }

      if (paint) {
        paint.style.strokeDasharray = String(pathLength);
        paint.style.strokeDashoffset = String(pathLength * (1 - painting));
      }

      if (brushRef.current) {
        const point = pointOnPath(painting);
        const next = pointOnPath(Math.min(1, painting + 0.012));
        const angle = Math.atan2(next.y - point.y, next.x - point.x) * (180 / Math.PI) + 90;
        brushRef.current.style.opacity = progress > 0.1 && progress < 0.91 ? "1" : "0";
        brushRef.current.setAttribute(
          "transform",
          `translate(${point.x} ${point.y}) rotate(${reducedMotion ? 0 : angle})`,
        );
      }

      if (nailRef.current) {
        nailRef.current.style.opacity = String(nailReveal);
        nailRef.current.style.transform = reducedMotion ? "none" : `translateY(${(1 - nailReveal) * 18}px)`;
      }
      if (nailPolishRef.current) {
        nailPolishRef.current.style.strokeDasharray = "1";
        nailPolishRef.current.style.strokeDashoffset = String(1 - nailReveal);
      }

      phraseRefs.current.forEach((element, index) => {
        if (!element) return;
        const start = 0.2 + index * 0.25;
        const opacity = clamp((progress - start) / 0.1) * clamp((start + 0.23 - progress) / 0.1);
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
    <section ref={sectionRef} className={styles.experience} aria-label="O esmalte se abre e pinta uma unha conforme você rola a página">
      <div className={styles.sticky}>
        <div className={styles.intro}>
          <span className={styles.kicker}>NAILS BY SAMARA · AUTOCUIDADO</span>
          <h2>Um toque de cor.<br /><em>Um momento seu.</em></h2>
          <span className={styles.scrollHint}>ROLE PARA DESCOBRIR <span aria-hidden="true">↓</span></span>
        </div>

        <div className={styles.stage}>
          <svg className={styles.scene} viewBox="0 0 900 600" role="img" aria-label="Um frasco de esmalte abre, seu pincel pinta um caminho em zigue-zague e alcança uma unha" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="polish-glass" x1="0" x2="1">
                <stop offset="0" stopColor="#f51b6d" />
                <stop offset=".5" stopColor="#ff4d91" />
                <stop offset="1" stopColor="#cc0752" />
              </linearGradient>
              <linearGradient id="cap-shine" x1="0" x2="1">
                <stop offset="0" stopColor="#211e20" />
                <stop offset=".55" stopColor="#555054" />
                <stop offset="1" stopColor="#211e20" />
              </linearGradient>
              <linearGradient id="nail-shine" x1="0" x2="1">
                <stop offset="0" stopColor="#b80d43" />
                <stop offset=".48" stopColor="#ff4b8d" />
                <stop offset="1" stopColor="#d9165b" />
              </linearGradient>
            </defs>

            {/* One bottle: cap lifts away as the scroll begins. */}
            <g ref={bottleRef}>
              <path d="M395 112 Q395 91 417 82 L483 82 Q505 91 505 112 L505 158 Q505 179 485 190 L485 204 L415 204 L415 190 Q395 179 395 158 Z"
                fill="url(#polish-glass)" stroke="#fff0f5" strokeWidth="3" />
              <path d="M411 112 Q412 98 428 95 L430 177" fill="none" stroke="#fff" strokeOpacity=".48" strokeWidth="8" strokeLinecap="round" />
              <rect x="405" y="132" width="90" height="43" rx="3" fill="#fff0f5" />
              <text x="450" y="150" textAnchor="middle" fill="#9d1734" fontSize="13" letterSpacing="2" fontFamily="Georgia,serif">NAILS</text>
              <text x="450" y="164" textAnchor="middle" fill="#9d1734" fontSize="7" letterSpacing="1.5">BY SAMARA</text>
            </g>
            <g ref={capRef} transform="translate(0 0)">
              <rect x="421" y="54" width="58" height="76" rx="7" fill="url(#cap-shine)" />
              <path d="M432 62 L439 62 L439 119" fill="none" stroke="#fff" strokeOpacity=".2" strokeWidth="3" />
              <rect x="414" y="122" width="72" height="13" rx="3" fill="#d8a9b5" />
              <path d="M449 135 L451 188" stroke="#ff1672" strokeWidth="9" strokeLinecap="round" />
              <path d="M444 183 L456 183 L454 207 Q450 214 446 207 Z" fill="#ff1672" />
            </g>

            {/* The stroke is revealed by vertical scroll progress. */}
            <path d="M450 205 C450 235 350 235 350 270 C350 294 535 285 535 310 C535 333 355 326 355 350 C355 374 530 365 530 390 C530 414 405 405 405 425 C405 448 450 455 450 480"
              fill="none" stroke="#f7a2ac" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round" opacity=".22" />
            <path ref={paintRef}
              d="M450 205 C450 235 350 235 350 270 C350 294 535 285 535 310 C535 333 355 326 355 350 C355 374 530 365 530 390 C530 414 405 405 405 425 C405 448 450 455 450 480"
              fill="none" stroke="#ed1742" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round" pathLength="1" />

            <g ref={brushRef} className={styles.brush} transform="translate(450 205)">
              <g transform="translate(-8 -44) rotate(-30)">
                <rect x="-16" y="-5" width="32" height="59" rx="4" fill="url(#cap-shine)" stroke="#3d383d" strokeWidth="2" />
                <path d="M-9 1 L-9 45" stroke="#fff" strokeOpacity=".2" strokeWidth="2" />
                <rect x="-6" y="51" width="12" height="13" rx="2" fill="#ff1672" />
                <path d="M-6 62 L6 62 L3 89 Q0 96 -3 89 Z" fill="#ff1672" />
                <path d="M-2 67 L-2 86" stroke="#ff9ac4" strokeWidth="2" strokeLinecap="round" />
              </g>
            </g>

            {/* The nail appears only as the brush reaches the end of its stroke. */}
            <g ref={nailRef} opacity="0">
              <path d="M382 505 Q382 474 410 465 Q450 450 490 465 Q518 474 518 505 L512 548 Q508 565 490 568 L410 568 Q392 565 388 548 Z"
                fill="#f4b6c8" />
              <path d="M395 505 Q395 480 418 474 Q450 463 482 474 Q505 480 505 505 L500 541 Q498 552 484 554 L416 554 Q402 552 400 541 Z"
                fill="#f9dce5" stroke="#df9aae" strokeWidth="2" />
              <path ref={nailPolishRef} d="M405 505 Q405 486 425 481 Q450 474 475 481 Q495 486 495 505 L491 536 Q490 543 479 544 L421 544 Q410 543 409 536 Z"
                fill="url(#nail-shine)" stroke="#d9165b" strokeWidth="2" pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
              <path d="M418 492 Q425 483 437 485" fill="none" stroke="#fff" strokeOpacity=".65" strokeWidth="4" strokeLinecap="round" />
            </g>
          </svg>
          <div className={styles.phrases} aria-live="polite">
            <p ref={(node) => { phraseRefs.current[0] = node; }}>Delicada.</p>
            <p ref={(node) => { phraseRefs.current[1] = node; }}>Bem cuidada.</p>
            <p ref={(node) => { phraseRefs.current[2] = node; }}>Elegante.</p>
          </div>
        </div>
        <div className={styles.progress} aria-hidden="true"><span ref={progressRef} /></div>
      </div>
    </section>
  );
}
