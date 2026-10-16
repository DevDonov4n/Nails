"use client";

import { useEffect, useRef } from "react";
import styles from "./NailPolishScroll.module.css";

const POLISH_COLOR = "#a90f25";
const POLISH_HIGHLIGHT = "#f06b78";
const TRAIL_WIDTH_DESKTOP = 7;
const TRAIL_WIDTH_MOBILE = 2.5;
const ZIGZAG_AMPLITUDE = 0.39;
const CURVE_COUNT = 7;
const TRAIL_OPACITY = 0.28;
const MOBILE_BREAKPOINT = 768;
const LERP_SPEED = 0.16;
const DEBUG_PATH = process.env.NEXT_PUBLIC_NAIL_POLISH_DEBUG === "true";

type Point = { x: number; y: number };
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function pathFromPoints(points: Point[]) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    d += ` Q ${a.x} ${a.y} ${mid.x} ${mid.y}`;
    if (i === points.length - 1) d += ` T ${b.x} ${b.y}`;
  }
  return d;
}

export default function NailPolishScroll() {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const shineRef = useRef<SVGPathElement>(null);
  const brushRef = useRef<SVGGElement>(null);
  const debugRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_NAIL_POLISH_SCROLL === "false") return;
    const svg = svgRef.current, path = pathRef.current, shine = shineRef.current, brush = brushRef.current;
    const debug = debugRef.current;
    const startEl = document.querySelector<HTMLElement>("[data-polish-start]");
    const endEl = document.querySelector<HTMLElement>("[data-polish-end]");
    if (!svg || !path || !shine || !brush || !startEl || !endEl) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let points: Point[] = [], length = 0, startY = 0, endY = 1;
    let progress = 0, target = 0, raf = 0, mobile = window.innerWidth < MOBILE_BREAKPOINT;

    const setBrush = (x: number, y: number, angle: number, opacity: number) => {
      brush.setAttribute("transform", `translate(${x} ${y}) rotate(${angle})`);
      brush.style.opacity = String(opacity);
    };

    const rebuild = () => {
      mobile = window.innerWidth < MOBILE_BREAKPOINT;
      const width = Math.max(document.documentElement.scrollWidth, window.innerWidth);
      const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));
      svg.style.width = `${width}px`;
      svg.style.height = `${height}px`;

      const sr = startEl.getBoundingClientRect(), er = endEl.getBoundingClientRect();
      const start = { x: sr.left + scrollX + sr.width / 2, y: sr.top + scrollY + sr.height / 2 };
      const end = { x: er.left + scrollX + er.width * 0.78, y: er.top + scrollY + Math.min(42, er.height * 0.35) };
      startY = start.y; endY = Math.max(start.y + 1, end.y);

      const sections = Array.from(document.querySelectorAll<HTMLElement>("main section"))
        .filter(s => { const y = s.getBoundingClientRect().top + scrollY + s.offsetHeight * .5; return y > start.y + 60 && y < end.y - 50; });
      const gutter = mobile ? Math.max(14, width * .035) : Math.max(30, width * .045);
      const left = gutter, right = width - gutter;
      const raw: Point[] = [start];
      sections.forEach((section, i) => {
        const rect = section.getBoundingClientRect();
        const container = section.querySelector<HTMLElement>(".container");
        const cr = container?.getBoundingClientRect();
        let x = i % 2 === 0 ? right : left;
        if (cr) {
          const freeLeft = cr.left, freeRight = width - (cr.left + cr.width);
          if (i % 2 === 0 && freeRight > 18) x = width - Math.min(freeRight * .55, gutter + 16);
          else if (i % 2 !== 0 && freeLeft > 18) x = Math.min(freeLeft * .55, gutter + 16);
          else x = i % 2 === 0 ? width - gutter : gutter;
        } else x = i % 2 === 0 ? width - gutter : gutter;
        const amplitude = width * ZIGZAG_AMPLITUDE;
        x = clamp(x, mobile ? 12 : Math.min(amplitude * .12, gutter), width - (mobile ? 12 : Math.min(amplitude * .12, gutter)));
        raw.push({ x, y: rect.top + scrollY + section.offsetHeight * (i % 2 === 0 ? .28 : .72) });
      });
      raw.push({ x: clamp(end.x, left, right), y: end.y });
      points = raw.length > CURVE_COUNT + 2
        ? [raw[0], ...Array.from({ length: CURVE_COUNT }, (_, i) => raw[Math.round((i + 1) * (raw.length - 1) / (CURVE_COUNT + 1))]), raw[raw.length - 1]]
        : raw;

      const d = pathFromPoints(points);
      path.setAttribute("d", d); shine.setAttribute("d", d);
      length = path.getTotalLength();
      path.style.strokeDasharray = String(length); shine.style.strokeDasharray = String(length);
      path.style.strokeDashoffset = String(length * (motion.matches ? .72 : 1));
      shine.style.strokeDashoffset = String(length * (motion.matches ? .72 : 1));
      if (motion.matches) brush.style.opacity = "0";
      if (debug) {
        debug.replaceChildren();
        if (DEBUG_PATH) points.forEach((p, i) => {
          const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          dot.setAttribute("cx", String(p.x)); dot.setAttribute("cy", String(p.y));
          dot.setAttribute("r", i === 0 || i === points.length - 1 ? "7" : "4");
          dot.setAttribute("fill", i === 0 ? "#198754" : i === points.length - 1 ? "#0d6efd" : "#ff8c00");
          debug.appendChild(dot);
        });
      }
      setBrush(start.x, start.y, -18, 0);
      schedule();
    };

    const draw = () => {
      raf = 0;
      if (document.hidden) return;
      const raw = clamp((scrollY + innerHeight * .5 - startY) / Math.max(1, endY - startY), 0, 1);
      target = motion.matches ? 0 : raw;
      progress += (target - progress) * (motion.matches ? 1 : LERP_SPEED);
      const drawn = length * progress;
      path.style.strokeDashoffset = String(length - drawn);
      shine.style.strokeDashoffset = String(length - drawn);
      if (!motion.matches && length > 0 && !mobile) {
        const p = path.getPointAtLength(drawn);
        const ahead = path.getPointAtLength(Math.min(length, drawn + Math.max(2, length * .002)));
        const angle = Math.atan2(ahead.y - p.y, ahead.x - p.x) * 180 / Math.PI;
        const fade = clamp(progress * 10, 0, 1) * clamp((1 - progress) * 10, 0, 1);
        setBrush(p.x, p.y, angle + Math.sin(progress * Math.PI * 8) * 2, fade);
      }
      if (Math.abs(target - progress) > .001) schedule();
    };
    function schedule() { if (!raf && !document.hidden) raf = requestAnimationFrame(draw); }
    const onScroll = () => { if (!motion.matches) schedule(); };
    const onVisibility = () => { if (document.hidden && raf) cancelAnimationFrame(raf); else schedule(); };
    const onMotion = () => rebuild();

    rebuild();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", rebuild, { passive: true });
    window.addEventListener("orientationchange", rebuild, { passive: true });
    window.addEventListener("load", rebuild, { once: true });
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", onMotion);
    const observer = new ResizeObserver(rebuild);
    observer.observe(document.body); observer.observe(document.documentElement);
    document.fonts?.ready.then(() => { if (document.body.isConnected) rebuild(); });
    return () => {
      window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", rebuild);
      window.removeEventListener("orientationchange", rebuild); window.removeEventListener("load", rebuild);
      document.removeEventListener("visibilitychange", onVisibility); motion.removeEventListener("change", onMotion);
      observer.disconnect(); if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (process.env.NEXT_PUBLIC_NAIL_POLISH_SCROLL === "false") return null;
  return <div className={styles.layer} aria-hidden="true">
    <svg ref={svgRef} className={styles.svg} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="polish-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fff0ed"/><stop offset="38%" stopColor="#d9a1a4"/><stop offset="70%" stopColor="#a90f25"/><stop offset="100%" stopColor="#4e0b19"/></linearGradient>
        <linearGradient id="polish-metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#8c7777"/><stop offset="48%" stopColor="#fff8f2"/><stop offset="100%" stopColor="#a28b8b"/></linearGradient>
      </defs>
      <path ref={pathRef} className={styles.trail} fill="none" stroke={POLISH_COLOR} strokeWidth={TRAIL_WIDTH_DESKTOP} strokeLinecap="round" strokeLinejoin="round" opacity={TRAIL_OPACITY}/>
      <path ref={shineRef} className={styles.highlight} fill="none" stroke={POLISH_HIGHLIGHT} strokeWidth="2" strokeLinecap="round" opacity=".65"/>
      <g ref={debugRef} className={styles.debug}/>
      <g ref={brushRef} className={styles.brush} opacity="0">
        <g transform="translate(-18 -34)">
          <ellipse cx="18" cy="31" rx="18" ry="29" fill="#6d1724" opacity=".14"/>
          <rect x="3" y="20" width="30" height="38" rx="7" fill="url(#polish-glass)" stroke="#fff1ed" strokeWidth="1.2"/>
          <rect x="6" y="28" width="24" height="24" rx="4" fill={POLISH_COLOR} opacity=".82"/>
          <path d="M9 24 Q11 22 12 26 V47" stroke="#fff8f1" strokeWidth="2.5" strokeLinecap="round" opacity=".78" fill="none"/>
          <rect x="8" y="8" width="20" height="15" rx="3" fill="url(#polish-metal)"/>
          <rect x="10" y="-9" width="16" height="19" rx="3" fill="url(#polish-glass)" stroke="#fff1ed" strokeWidth=".8"/>
          <path d="M18 9 C18 2 19 -6 22 -14" stroke="#5a2630" strokeWidth="3" strokeLinecap="round" fill="none"/>
          <path d="M18 9 C18 2 19 -6 22 -14" stroke={POLISH_COLOR} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M22 -14 Q18 -20 23 -24 Q28 -20 22 -14" fill={POLISH_COLOR}/>
        </g>
      </g>
    </svg>
  </div>;
}
