"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./NailPolishExperience.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// SVG coordinates make the brush follow the exact same curve as the paint.
const PAINT_PATH =
  "M450 205 C450 235 350 235 350 270 C350 294 535 285 535 310 C535 333 355 326 355 350 C355 374 530 365 530 390 C530 414 405 405 405 425 C405 448 450 455 450 480";

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

  useGSAP(() => {
    const section = sectionRef.current;
    const paint = paintRef.current;
    const brush = brushRef.current;
    if (!section || !paint || !brush) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pathLength = paint.getTotalLength();

    // Reduced motion skips the scrub animation and leaves a complete, readable scene.
    if (reducedMotion) {
      gsap.set(paint, { strokeDasharray: pathLength, strokeDashoffset: 0 });
      gsap.set([bottleRef.current, capRef.current], { autoAlpha: 1 });
      gsap.set(brush, { autoAlpha: 0 });
      gsap.set(nailRef.current, { autoAlpha: 1, y: 0 });
      gsap.set(nailPolishRef.current, { strokeDasharray: 1, strokeDashoffset: 0 });
      gsap.set(phraseRefs.current, { autoAlpha: 1, y: 0 });
      gsap.set(progressRef.current, { scaleX: 1 });
      return;
    }

    gsap.set(paint, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
    gsap.set(nailPolishRef.current, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(nailRef.current, { autoAlpha: 0, y: 18 });
    gsap.set(brush, { autoAlpha: 0 });
    gsap.set(phraseRefs.current, { autoAlpha: 0, y: 10 });

    const stamp = document.querySelector<HTMLElement>("#visual-stamp");

    // One timeline is scrubbed by scroll, so reversing direction reverses every beat.
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.65,
        invalidateOnRefresh: true,
      },
      onUpdate: () => {
        // Keep the brush tip exactly on the currently revealed point of the path.
        const drawnLength = pathLength * timeline.progress();
        const point = paint.getPointAtLength(Math.min(pathLength, drawnLength));
        const next = paint.getPointAtLength(Math.min(pathLength, drawnLength + 1.5));
        const angle = Math.atan2(next.y - point.y, next.x - point.x) * (180 / Math.PI);
        gsap.set(brush, {
          x: point.x,
          y: point.y,
          rotation: angle,
          transformOrigin: "0px 0px",
        });
        if (progressRef.current) {
          gsap.set(progressRef.current, { scaleX: timeline.progress() });
        }
      },
    });

    timeline
      // Open the single bottle first: lift and gently tilt its cap to reveal the brush.
      .to(capRef.current, { y: -45, rotation: -7, transformOrigin: "450px 128px", duration: 0.12, ease: "power2.inOut" }, 0)
      .to(bottleRef.current, { autoAlpha: 0, duration: 0.1 }, 0.1)
      .to(brush, { autoAlpha: 1, duration: 0.035 }, 0.12)
      // Draw the paint as one continuous rounded zigzag, following the brush.
      .to(paint, { strokeDashoffset: 0, duration: 0.68, ease: "none" }, 0.14)
      .to(brush, { autoAlpha: 0, duration: 0.025 }, 0.81)
      // The three short messages appear in sequence alongside the painted curves.
      .to(phraseRefs.current[0], { autoAlpha: 1, y: 0, duration: 0.055 }, 0.28)
      .to(phraseRefs.current[0], { autoAlpha: 0, duration: 0.045 }, 0.43)
      .to(phraseRefs.current[1], { autoAlpha: 1, y: 0, duration: 0.055 }, 0.47)
      .to(phraseRefs.current[1], { autoAlpha: 0, duration: 0.045 }, 0.62)
      .to(phraseRefs.current[2], { autoAlpha: 1, y: 0, duration: 0.055 }, 0.66)
      .to(nailRef.current, { autoAlpha: 1, y: 0, duration: 0.12, ease: "power2.out" }, 0.79)
      .to(nailPolishRef.current, { strokeDashoffset: 0, duration: 0.12, ease: "power1.out" }, 0.82);

    // The final beat acknowledges the real brand stamp in the hero below the story.
    if (stamp) {
      timeline.to(stamp, {
        scale: 1.06,
        boxShadow: "0 0 0 8px rgb(197 141 145 / 18%), 0 18px 45px rgb(97 60 67 / 18%)",
        duration: 0.08,
        ease: "power2.out",
      }, 0.91);
    }

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
    };
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className={styles.experience}
      aria-label="Experiência de esmaltação: role a página para abrir o frasco e acompanhar o pincel pintando"
    >
      <div className={styles.sticky}>
        <div className={styles.intro}>
          <span className={styles.kicker}>NAILS BY SAMARA · AUTOCUIDADO</span>
          <h2>Um toque de cor.<br /><em>Um momento seu.</em></h2>
          <span className={styles.scrollHint}>ROLE PARA DESCOBRIR <span aria-hidden="true">↓</span></span>
        </div>

        <div className={styles.stage}>
          <svg className={styles.scene} viewBox="0 0 900 600" role="img" aria-label="Um único frasco abre; o pincel pinta um caminho contínuo em zigue-zague até uma unha" preserveAspectRatio="xMidYMid meet">
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

            {/* A single bottle; the cap carries the attached brush. */}
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

            {/* The muted guide stays visible; the saturated paint is revealed by scroll. */}
            <path d={PAINT_PATH} fill="none" stroke="#f7a2ac" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round" opacity=".22" />
            <path ref={paintRef} d={PAINT_PATH} fill="none" stroke="#ed1742" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round" />

            <g ref={brushRef} className={styles.brush} transform="translate(450 205)">
              <g transform="translate(0 -96)">
                <rect x="-16" y="-5" width="32" height="59" rx="4" fill="url(#cap-shine)" stroke="#3d383d" strokeWidth="2" />
                <path d="M-9 1 L-9 45" stroke="#fff" strokeOpacity=".2" strokeWidth="2" />
                <rect x="-6" y="51" width="12" height="13" rx="2" fill="#ff1672" />
                <path d="M-6 62 L6 62 L3 89 Q0 96 -3 89 Z" fill="#ff1672" />
                <path d="M-2 67 L-2 86" stroke="#ff9ac4" strokeWidth="2" strokeLinecap="round" />
              </g>
            </g>

            {/* The nail is the illustrated result; the brand stamp is highlighted at the final beat. */}
            <g ref={nailRef} opacity="0">
              <path d="M382 505 Q382 474 410 465 Q450 450 490 465 Q518 474 518 505 L512 548 Q508 565 490 568 L410 568 Q392 565 388 548 Z" fill="#f4b6c8" />
              <path d="M395 505 Q395 480 418 474 Q450 463 482 474 Q505 480 505 505 L500 541 Q498 552 484 554 L416 554 Q402 552 400 541 Z" fill="#f9dce5" stroke="#df9aae" strokeWidth="2" />
              <path ref={nailPolishRef} d="M405 505 Q405 486 425 481 Q450 474 475 481 Q495 486 495 505 L491 536 Q490 543 479 544 L421 544 Q410 543 409 536 Z" fill="url(#nail-shine)" stroke="#d9165b" strokeWidth="2" pathLength="1" />
              <path d="M418 492 Q425 483 437 485" fill="none" stroke="#fff" strokeOpacity=".65" strokeWidth="4" strokeLinecap="round" />
            </g>
          </svg>

          <div className={styles.phrases} aria-label="Mensagens sobre o cuidado">
            <p ref={(node) => { phraseRefs.current[0] = node; }}>Sua próxima cor favorita.</p>
            <p ref={(node) => { phraseRefs.current[1] = node; }}>Cuidado em cada detalhe.</p>
            <p ref={(node) => { phraseRefs.current[2] = node; }}>Seu momento começa aqui.</p>
          </div>
        </div>
        <div className={styles.progress} aria-hidden="true"><span ref={progressRef} /></div>
      </div>
    </section>
  );
}
