"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FRAME_COUNT = 120;
const frameSrc = (i: number) =>
  `/sequence/frame-${String(i + 1).padStart(3, "0")}.webp`;

type Props = {
  /** Quantos "telas" de scroll a animação ocupa (maior = mais lenta). */
  scrollLength?: number;
};

export default function NailScrollSequence({ scrollLength = 4 }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameRef = useRef({ index: 0 });
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  // Desenha um frame no canvas com "object-fit: cover"
  const draw = (index: number) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img || !img.complete) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  };

  // Pré-carrega todos os frames
  useEffect(() => {
    let loaded = 0;
    let cancelled = false;
    imagesRef.current = Array.from({ length: FRAME_COUNT }, (_, i) => {
      const img = new Image();
      img.decoding = "async";
      img.src = frameSrc(i);
      const done = () => {
        loaded++;
        if (cancelled) return;
        setProgress(loaded / FRAME_COUNT);
        if (loaded === 1) draw(0);
        if (loaded === FRAME_COUNT) setReady(true);
      };
      img.onload = done;
      img.onerror = done;
      return img;
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ajusta o canvas ao tamanho da tela (com devicePixelRatio)
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      draw(Math.round(frameRef.current.index));
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Liga o scroll aos frames
  useGSAP(
    () => {
      if (!ready) return;
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (reduce) {
        draw(FRAME_COUNT - 1); // mostra só o frame final
        return;
      }
      gsap.to(frameRef.current, {
        index: FRAME_COUNT - 1,
        ease: "none",
        onUpdate: () => draw(Math.round(frameRef.current.index)),
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: `+=${scrollLength * 100}%`,
          pin: true,
          scrub: 0.4, // suaviza o "arrasto" do scroll
          anticipatePin: 1,
        },
      });
    },
    { dependencies: [ready, scrollLength], scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      aria-label="Cuidados com as unhas"
      style={{
        position: "relative",
        width: "100%",
        height: "100svh",
        overflow: "hidden",
        background: "#f3e6e6",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
      {!ready && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "2rem",
            transform: "translateX(-50%)",
            width: "40%",
            height: 3,
            background: "rgba(0,0,0,.1)",
            borderRadius: 2,
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              background: "#c98a8a",
              borderRadius: 2,
              transition: "width .2s",
            }}
          />
        </div>
      )}
    </section>
  );
}
