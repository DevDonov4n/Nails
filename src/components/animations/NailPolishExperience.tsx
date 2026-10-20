"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./NailPolishExperience.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const PAINT_PATH =
  "M450 205 C450 235 350 235 350 270 C350 294 535 285 535 310 C535 333 355 326 355 350 C355 374 530 365 530 390 C530 414 405 405 405 425 C405 448 450 455 450 480";

const PHRASES = [
  { text: "Sua próxima cor favorita.", curveIndex: 0 },
  { text: "Cuidado em cada detalhe.", curveIndex: 1 },
  { text: "Seu momento começa aqui.", curveIndex: 2 },
] as const;

// Tuning knobs: anticipation before an apex, lateral spacing and fade duration.
const PHRASE_ANTICIPATION = 0.05;
const PHRASE_SIDE_OFFSET = 22;
const PHRASE_FADE_PROGRESS = 0.05;
const DEBUG_MARKER_COUNT = 12;

type CurveApex = { progress: number; x: number; y: number; side: "left" | "right" };

export default function NailPolishExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<SVGSVGElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bottleRef = useRef<SVGGElement>(null);
  const capRef = useRef<SVGGElement>(null);
  const brushRef = useRef<SVGGElement>(null);
  const paintRef = useRef<SVGPathElement>(null);
  const guideRef = useRef<SVGPathElement>(null);
  const phraseRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const markerRefs = useRef<(SVGGElement | null)[]>([]);
  const progressRef = useRef<HTMLSpanElement>(null);
  const debugReadoutRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const section = sectionRef.current;
    const scene = sceneRef.current;
    const stage = stageRef.current;
    const paint = paintRef.current;
    const brush = brushRef.current;
    const guide = guideRef.current;
    if (!section || !scene || !stage || !paint || !brush || !guide) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const debug = new URLSearchParams(window.location.search).get("debug") === "1";
    const pathLength = paint.getTotalLength();
    const stamp = document.querySelector<HTMLElement>("#visual-stamp");
    const phraseElements = phraseRefs.current.filter((node): node is HTMLParagraphElement => node !== null);

    // Find horizontal direction changes from the real SVG path, rather than hardcoding curve coordinates.
    const detectApexes = (): CurveApex[] => {
      const samples = Math.max(300, Math.min(600, DEBUG_MARKER_COUNT));
      const points = Array.from({ length: samples + 1 }, (_, index) => {
        const length = (pathLength * index) / samples;
        return { ...paint.getPointAtLength(length), progress: index / samples };
      });
      const candidates: CurveApex[] = [];
      let previousDirection = 0;
      for (let index = 2; index < points.length - 2; index += 1) {
        const dx = points[index + 1].x - points[index - 1].x;
        const direction = Math.abs(dx) < 0.12 ? previousDirection : Math.sign(dx);
        if (previousDirection !== 0 && direction !== 0 && direction !== previousDirection) {
          const point = points[index];
          const apex: CurveApex = {
            progress: point.progress,
            x: point.x,
            y: point.y,
            side: point.x >= 450 ? "right" : "left",
          };
          const last = candidates[candidates.length - 1];
          if (!last || apex.progress - last.progress > 0.06) candidates.push(apex);
        }
        if (direction !== 0) previousDirection = direction;
      }
      return candidates;
    };

    let apexes = detectApexes();

    // Convert SVG coordinates into the stage's CSS pixel coordinates using its current screen matrix.
    const placePhrases = () => {
      const matrix = scene.getScreenCTM();
      if (!matrix) return;
      const stageRect = stage.getBoundingClientRect();
      const inverse = matrix.inverse();
      PHRASES.forEach((phrase, index) => {
        const element = phraseRefs.current[index];
        const apex = apexes[phrase.curveIndex];
        if (!element || !apex) return;
        const screenPoint = scene.createSVGPoint();
        screenPoint.x = apex.x;
        screenPoint.y = apex.y;
        const screen = screenPoint.matrixTransform(matrix);
        const localX = screen.x - stageRect.left;
        const localY = screen.y - stageRect.top;
        // Touch inverse too, so matrix availability is validated before layout updates.
        void inverse;
        element.style.left = `${localX + (apex.side === "right" ? PHRASE_SIDE_OFFSET : -PHRASE_SIDE_OFFSET)}px`;
        element.style.top = `${localY}px`;
        element.style.textAlign = apex.side === "right" ? "left" : "right";
        element.dataset.curveSide = apex.side;
      });
      markerRefs.current.forEach((marker, index) => {
        const apex = apexes[index];
        if (!marker) return;
        marker.setAttribute("display", apex ? "inline" : "none");
        if (apex) marker.setAttribute("transform", `translate(${apex.x} ${apex.y})`);
      });
    };

    const paintProgress = { value: 0 };
    const renderPaint = (progress: number) => {
      const p = gsap.utils.clamp(0, 1, progress);
      paint.style.strokeDashoffset = String(pathLength * (1 - p));
      const point = paint.getPointAtLength(p * pathLength);
      const next = paint.getPointAtLength(Math.min(pathLength, p * pathLength + 1.5));
      const angle = Math.atan2(next.y - point.y, next.x - point.x) * (180 / Math.PI);
      gsap.set(brush, {
        x: point.x,
        y: point.y,
        rotation: angle,
        transformOrigin: "0px 0px",
      });
      if (progressRef.current) gsap.set(progressRef.current, { scaleX: p });
      if (debugReadoutRef.current) debugReadoutRef.current.textContent = `p = ${p.toFixed(3)}`;

      // Fade in starts just before the matching apex and remains visible after the brush passes it.
      PHRASES.forEach((phrase, index) => {
        const element = phraseRefs.current[index];
        const apex = apexes[phrase.curveIndex];
        if (!element || !apex) return;
        const fadeStart = Math.max(0, apex.progress - PHRASE_ANTICIPATION);
        const opacity = gsap.utils.clamp(0, 1, (p - fadeStart) / PHRASE_FADE_PROGRESS);
        gsap.set(element, { autoAlpha: reducedMotion ? 1 : opacity, y: reducedMotion ? 0 : 8 * (1 - opacity) });
      });
    };

    gsap.set(paint, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
    gsap.set(guide, { strokeDasharray: pathLength, strokeDashoffset: 0 });
    gsap.set(phraseElements, { autoAlpha: 0, y: 8 });
    gsap.set(brush, { autoAlpha: 0 });
    gsap.set([bottleRef.current, capRef.current], { autoAlpha: 1 });
    gsap.set(markerRefs.current, { autoAlpha: debug ? 1 : 0 });
    if (debugReadoutRef.current) debugReadoutRef.current.hidden = !debug;
    placePhrases();

    if (reducedMotion) {
      gsap.set(paint, { strokeDashoffset: 0 });
      gsap.set(brush, { autoAlpha: 0 });
      gsap.set(capRef.current, { y: -38, rotation: -10 });
      gsap.set(phraseElements, { autoAlpha: 1, y: 0 });
      if (stamp) gsap.set(stamp, { scale: 1.04, boxShadow: "0 0 0 8px rgb(197 141 145 / 18%)" });
      return;
    }

    // One scrubbed ScrollTrigger drives all six beats and the single paint progress value.
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
      onUpdate: () => renderPaint(paintProgress.value),
    });

    timeline
      // 1 → 2: lift the cap vertically while the bottle remains visible.
      .to(capRef.current, { y: -20, duration: 0.08, ease: "power2.inOut" }, 0)
      // 2 → 3: show the pale guide before the brush begins painting.
      .to(capRef.current, { y: -38, duration: 0.07, ease: "power2.out" }, 0.08)
      // 3 → 4: tilt the removed cap/brush assembly toward the path.
      .to(capRef.current, { rotation: -10, x: 28, duration: 0.08, ease: "power1.inOut" }, 0.15)
      .to(brush, { autoAlpha: 1, duration: 0.03 }, 0.22)
      // 4 → 5 → 6: paintProgress is the one source of truth for stroke, brush and phrases.
      .to(paintProgress, { value: 1, duration: 0.72, ease: "none", onUpdate: () => renderPaint(paintProgress.value) }, 0.25)
      .to(brush, { autoAlpha: 0, duration: 0.025 }, 0.975);

    if (stamp) {
      timeline.to(stamp, {
        scale: 1.06,
        boxShadow: "0 0 0 8px rgb(197 141 145 / 18%), 0 18px 45px rgb(97 60 67 / 18%)",
        duration: 0.08,
        ease: "power2.out",
      }, 0.92);
    }

    // Debug markers show every detected apex and its normalized path progress.
    if (debug) {
      apexes.forEach((apex, index) => {
        const marker = markerRefs.current[index];
        if (marker) {
          const label = marker.querySelector("text");
          if (label) label.textContent = `${index} · ${apex.progress.toFixed(2)}`;
        }
      });
    }

    const refreshLayout = () => {
      apexes = detectApexes();
      placePhrases();
      ScrollTrigger.refresh();
      renderPaint(paintProgress.value);
    };
    const onResize = () => refreshLayout();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    document.fonts?.ready.then(refreshLayout);
    window.addEventListener("load", refreshLayout, { once: true });
    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      timeline.scrollTrigger?.kill();
      timeline.kill();
    };
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className={styles.experience} aria-label="Experiência de esmaltação: role para abrir o frasco e acompanhar o pincel pintando">
      <div className={styles.sticky}>
        <div className={styles.intro}>
          <span className={styles.kicker}>NAILS BY SAMARA · AUTOCUIDADO</span>
          <h2>Um toque de cor.<br /><em>Um momento seu.</em></h2>
          <span className={styles.scrollHint}>ROLE PARA DESCOBRIR <span aria-hidden="true">↓</span></span>
        </div>
        <div ref={stageRef} className={styles.stage}>
          <svg ref={sceneRef} className={styles.scene} viewBox="0 0 900 600" role="img" aria-label="Um frasco de esmalte se abre e o pincel pinta um zigue-zague contínuo" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="polish-glass" x1="0" x2="1">
                <stop offset="0" stopColor="#f51b6d" /><stop offset=".5" stopColor="#ff4d91" /><stop offset="1" stopColor="#cc0752" />
              </linearGradient>
              <linearGradient id="cap-shine" x1="0" x2="1">
                <stop offset="0" stopColor="#211e20" /><stop offset=".55" stopColor="#555054" /><stop offset="1" stopColor="#211e20" />
              </linearGradient>
            </defs>
            {/* One bottle stays on screen throughout the preparation and painting beats. */}
            <g ref={bottleRef}>
              <path d="M395 112 Q395 91 417 82 L483 82 Q505 91 505 112 L505 158 Q505 179 485 190 L485 204 L415 204 L415 190 Q395 179 395 158 Z" fill="url(#polish-glass)" stroke="#fff0f5" strokeWidth="3" />
              <path d="M411 112 Q412 98 428 95 L430 177" fill="none" stroke="#fff" strokeOpacity=".48" strokeWidth="8" strokeLinecap="round" />
              <rect x="405" y="132" width="90" height="43" rx="3" fill="#fff0f5" />
              <text x="450" y="150" textAnchor="middle" fill="#9d1734" fontSize="13" letterSpacing="2" fontFamily="Georgia,serif">NAILS</text>
              <text x="450" y="164" textAnchor="middle" fill="#9d1734" fontSize="7" letterSpacing="1.5">BY SAMARA</text>
            </g>
            <g ref={capRef}>
              <rect x="421" y="54" width="58" height="76" rx="7" fill="url(#cap-shine)" />
              <path d="M432 62 L439 62 L439 119" fill="none" stroke="#fff" strokeOpacity=".2" strokeWidth="3" />
              <rect x="414" y="122" width="72" height="13" rx="3" fill="#d8a9b5" />
            </g>
            {/* The guide and paint share the exact same path and SVG viewBox. */}
            <path ref={guideRef} d={PAINT_PATH} fill="none" stroke="#f7a2ac" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round" opacity=".28" />
            <path ref={paintRef} d={PAINT_PATH} fill="none" stroke="#ed1742" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round" />
            {/* The brush tip sits at the origin; its transform follows getPointAtLength(). */}
            <g ref={brushRef} className={styles.brush} transform="translate(450 205)">
              <g transform="translate(0 -96)">
                <rect x="-16" y="-5" width="32" height="59" rx="4" fill="url(#cap-shine)" stroke="#3d383d" strokeWidth="2" />
                <path d="M-9 1 L-9 45" stroke="#fff" strokeOpacity=".2" strokeWidth="2" />
                <rect x="-6" y="51" width="12" height="13" rx="2" fill="#ff1672" />
                <path d="M-6 62 L6 62 L3 89 Q0 96 -3 89 Z" fill="#ff1672" />
                <path d="M-2 67 L-2 86" stroke="#ff9ac4" strokeWidth="2" strokeLinecap="round" />
              </g>
            </g>
            {/* Debug-only apex markers; labels are populated from the sampled path. */}
            {Array.from({ length: DEBUG_MARKER_COUNT }, (_, index) => (
              <g key={index} ref={(node) => { markerRefs.current[index] = node; }} className={styles.debugMarker} opacity="0">
                <circle r="5" fill="#542038" stroke="#fff" strokeWidth="2" />
                <text x="8" y="-8" fontSize="12" fill="#542038">...</text>
              </g>
            ))}
          </svg>
          <div className={styles.phrases} aria-label="Mensagens sobre o cuidado">
            {PHRASES.map((phrase, index) => (
              <p key={phrase.text} ref={(node) => { phraseRefs.current[index] = node; }}>{phrase.text}</p>
            ))}
          </div>
        </div>
        <div className={styles.progress} aria-hidden="true"><span ref={progressRef} /></div>
        <div ref={debugReadoutRef} className={styles.debugReadout} aria-live="off" hidden>p = 0.000</div>
      </div>
    </section>
  );
}
