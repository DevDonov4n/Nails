"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./NailPolishScroll.module.css";

// Ajustes rápidos da animação.
const POLISH_COLOR = "#a90f25";
const BRUSH_OPACITY = 0.12;
const SCROLL_SMOOTHING = 1.2;
const DESKTOP_SIDE_INSET = 7; // distância da margem em vw
const MOBILE_BREAKPOINT = 768;

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function NailPolishScroll() {
  const enabled = process.env.NEXT_PUBLIC_NAIL_POLISH_SCROLL !== "false";

  useGSAP(() => {
    if (!enabled) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
    const object = document.querySelector<HTMLElement>("[data-nail-polish-object]");
    const trail = document.querySelector<SVGPathElement>("[data-nail-polish-trail]");
    if (!object || !trail || reduceMotion) return;

    // O traço cresce e recua com o progresso nativo do scroll.
    const trailLength = trail.getTotalLength();
    gsap.set(trail, { strokeDasharray: trailLength, strokeDashoffset: trailLength });

    const leftSide = mobile ? "5%" : `${DESKTOP_SIDE_INSET}%`;
    const rightSide = mobile ? "95%" : `${100 - DESKTOP_SIDE_INSET}%`;
    gsap.set(object, { left: leftSide, top: "28%", xPercent: -50, yPercent: -50, rotation: 0, rotationY: 0 });
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        scrub: SCROLL_SMOOTHING,
        invalidateOnRefresh: true,
      },
    });

    // Move apenas entre as margens; a peça não atravessa o texto.
    timeline
      .to(object, { left: rightSide, top: "34%", rotation: 7, rotationY: 8, duration: 1, ease: "sine.inOut" })
      .to(object, { left: leftSide, top: "62%", rotation: -6, rotationY: -7, duration: 1, ease: "sine.inOut" })
      .to(object, { left: rightSide, top: "72%", rotation: 5, rotationY: 6, duration: 1, ease: "sine.inOut" })
      .to(object, { left: leftSide, top: "38%", rotation: -5, rotationY: -6, duration: 1, ease: "sine.inOut" })
      .to(object, { left: rightSide, top: "58%", rotation: 6, rotationY: 7, duration: 1, ease: "sine.inOut" })
      .to(object, { left: leftSide, top: "72%", rotation: -4, rotationY: -5, duration: 1, ease: "sine.inOut" });

    timeline.to(trail, { strokeDashoffset: 0, ease: "none", duration: 6 }, 0);

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
    };
  }, { dependencies: [enabled], revertOnUpdate: true });

  if (!enabled) return null;

  return (
    <div className={styles.layer} aria-hidden="true">
      <svg className={styles.trail} viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          data-nail-polish-trail
          d="M 7 4 C 12 10, 28 13, 38 19 S 70 27, 91 34 S 68 45, 35 52 S 20 67, 63 73 S 84 88, 93 97"
          fill="none"
          stroke={POLISH_COLOR}
          strokeWidth="0.42"
          strokeLinecap="round"
          opacity={BRUSH_OPACITY}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className={styles.object} data-nail-polish-object>
        <svg className={styles.artwork} viewBox="0 0 240 310">
          <defs>
            <linearGradient id="polish-glass" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#f4d7d5" />
              <stop offset="45%" stopColor="#a75c65" />
              <stop offset="100%" stopColor="#57252e" />
            </linearGradient>
            <linearGradient id="polish-red" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#f34252" />
              <stop offset="48%" stopColor={POLISH_COLOR} />
              <stop offset="100%" stopColor="#5e0615" />
            </linearGradient>
            <linearGradient id="polish-metal" x1="0" x2="1">
              <stop offset="0%" stopColor="#b7a3a0" />
              <stop offset="45%" stopColor="#fff2e9" />
              <stop offset="100%" stopColor="#9d8582" />
            </linearGradient>
            <filter id="polish-shadow" x="-40%" y="-30%" width="180%" height="180%">
              <feDropShadow dx="0" dy="12" stdDeviation="9" floodColor="#613c43" floodOpacity=".2" />
            </filter>
          </defs>
          <g filter="url(#polish-shadow)">
            {/* Unha em perspectiva com brilho de esmalte. */}
            <path d="M 128 142 C 151 132 173 147 176 172 L 185 229 C 187 247 174 260 156 257 C 138 254 127 244 125 226 L 117 172 C 114 157 117 147 128 142 Z" fill="#e5b8b3" stroke="#fff4ee" strokeWidth="2" />
            <path d="M 130 151 C 149 141 166 153 169 173 L 178 225 C 180 238 171 248 157 246 C 144 244 136 236 134 223 L 126 173 C 124 163 124 155 130 151 Z" fill="url(#polish-red)" />
            <path d="M 132 157 C 139 154 143 160 145 171 L 153 213" fill="none" stroke="#ffb0b3" strokeWidth="3" strokeLinecap="round" opacity=".72" />
            {/* Frasco facetado, tampa e pincel. */}
            <g transform="rotate(-24 92 151)">
              <rect x="70" y="122" width="48" height="95" rx="10" fill="url(#polish-glass)" stroke="#f8e4df" strokeWidth="1.5" />
              <rect x="75" y="145" width="38" height="58" rx="6" fill="url(#polish-red)" opacity=".9" />
              <path d="M 80 132 L 80 155" stroke="#fff8f0" strokeWidth="3" strokeLinecap="round" opacity=".7" />
              <rect x="78" y="91" width="32" height="43" rx="4" fill="url(#polish-metal)" />
              <path d="M 85 96 L 85 127" stroke="#fffaf4" strokeWidth="2" opacity=".8" />
              <rect x="82" y="45" width="24" height="53" rx="5" fill="url(#polish-red)" />
              <rect x="89" y="51" width="3" height="39" rx="1.5" fill="#ffb5ba" opacity=".8" />
              <path d="M 91 96 C 91 113 112 125 128 148" fill="none" stroke="#4e1720" strokeWidth="4" strokeLinecap="round" />
              <path d="M 91 96 C 91 113 112 125 128 148" fill="none" stroke="#c51b31" strokeWidth="2.5" strokeLinecap="round" />
            </g>
            <circle cx="132" cy="149" r="3" fill="#ffb6b9" opacity=".8" />
          </g>
        </svg>
      </div>
    </div>
  );
}
