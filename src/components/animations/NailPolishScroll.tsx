"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./NailPolishScroll.module.css";

const POLISH_COLOR = "#a90f25";
const BRUSH_OPACITY = 0.1;
const SCROLL_SMOOTHING = 1;
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
    const logo = document.querySelector<HTMLElement>(".hero-visual");
    if (!object || !trail || !logo || reduceMotion) return;

    const trailLength = trail.getTotalLength();
    gsap.set(trail, { strokeDasharray: trailLength, strokeDashoffset: trailLength });

    const getStops = () => {
      const logoRect = logo.getBoundingClientRect();
      const width = window.innerWidth;
      const height = window.innerHeight;
      const edge = mobile ? Math.max(26, width * 0.075) : Math.max(54, width * 0.09);
      const startX = logoRect.left + logoRect.width * 0.53;
      const startY = logoRect.top + logoRect.height * 0.48;

      // Fixed viewport positions make the brush travel with the scroll,
      // while the final stop appears beside the footer as the page ends.
      return [
        { x: startX, y: startY, rotation: -22 },
        { x: width - edge, y: height * 0.28, rotation: 18 },
        { x: edge, y: height * 0.42, rotation: -18 },
        { x: width - edge, y: height * 0.56, rotation: 17 },
        { x: edge, y: height * 0.69, rotation: -16 },
        { x: width - edge, y: height * 0.79, rotation: 15 },
        { x: edge, y: height * 0.86, rotation: -10 },
      ];
    };

    let stops = getStops();
    const placeAtStop = (stop: (typeof stops)[number]) => ({
      left: stop.x,
      top: stop.y,
      xPercent: -50,
      yPercent: -50,
      rotation: stop.rotation,
    });

    gsap.set(object, placeAtStop(stops[0]));

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        scrub: SCROLL_SMOOTHING,
        invalidateOnRefresh: true,
        onRefresh: () => {
          stops = getStops();
          gsap.set(object, placeAtStop(stops[0]));
        },
      },
    });

    stops.slice(1).forEach((stop) => {
      timeline.to(object, {
        ...placeAtStop(stop),
        duration: 1,
        ease: "sine.inOut",
      });
    });

    timeline.to(trail, { strokeDashoffset: 0, ease: "none", duration: stops.length - 1 }, 0);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("resize", refresh);
    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener("resize", refresh);
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
          d="M 52 24 C 70 28, 91 25, 91 30 S 10 38, 8 43 S 90 52, 91 57 S 10 64, 8 70 S 90 78, 91 83 S 20 88, 8 94"
          fill="none"
          stroke={POLISH_COLOR}
          strokeWidth="0.38"
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
            <path d="M 128 142 C 151 132 173 147 176 172 L 185 229 C 187 247 174 260 156 257 C 138 254 127 244 125 226 L 117 172 C 114 157 117 147 128 142 Z" fill="#e5b8b3" stroke="#fff4ee" strokeWidth="2" />
            <path d="M 130 151 C 149 141 166 153 169 173 L 178 225 C 180 238 171 248 157 246 C 144 244 136 236 134 223 L 126 173 C 124 163 124 155 130 151 Z" fill="url(#polish-red)" />
            <path d="M 132 157 C 139 154 143 160 145 171 L 153 213" fill="none" stroke="#ffb0b3" strokeWidth="3" strokeLinecap="round" opacity=".72" />
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
