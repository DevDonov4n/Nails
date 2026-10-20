"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function PageAnimations() {
  useGSAP(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
    intro
      .from(".hero-copy .eyebrow", { y: 16, autoAlpha: 0, duration: 0.65 })
      .from(".hero h1 > span", { yPercent: 110, autoAlpha: 0, duration: 0.95, stagger: 0.14 }, "-=0.28")
      .from(".hero-description", { y: 18, autoAlpha: 0, duration: 0.65 }, "-=0.48")
      .from(".hero-actions > *", { y: 14, autoAlpha: 0, duration: 0.55, stagger: 0.1 }, "-=0.36")
      .from(".hero-note", { y: 12, autoAlpha: 0, duration: 0.55 }, "-=0.3")
      .from(".hero-visual", { scale: 0.94, y: 22, autoAlpha: 0, duration: 1.1 }, "-=0.9");

    gsap.to(".hero-flower", {
      rotate: 18,
      scale: 1.04,
      duration: 5,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      transformOrigin: "50% 50%",
    });
    gsap.to(".visual-ring--inner", {
      rotate: -24,
      scale: 1.04,
      duration: 18,
      ease: "none",
      repeat: -1,
      transformOrigin: "50% 50%",
    });
    gsap.to(".hero-orb--two", {
      y: -28,
      x: -18,
      duration: 7,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    gsap.utils.toArray<HTMLElement>(".intro-grid, .section-heading, .contact-panel").forEach((element) => {
      gsap.from(element, {
        y: 36,
        autoAlpha: 0,
        duration: 0.85,
        ease: "power2.out",
        scrollTrigger: { trigger: element, start: "top 84%", once: true },
      });
    });

    gsap.utils.toArray<HTMLElement>(".service-card, [data-service-card]").forEach((card, index) => {
      gsap.from(card, {
        y: 42,
        autoAlpha: 0,
        duration: 0.7,
        delay: index * 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: card, start: "top 88%", once: true },
      });
    });

    gsap.utils.toArray<HTMLElement>(".portfolio-card").forEach((card, index) => {
      gsap.from(card, {
        y: 34,
        autoAlpha: 0,
        scale: 0.97,
        duration: 0.8,
        delay: index * 0.12,
        ease: "power2.out",
        scrollTrigger: { trigger: card, start: "top 86%", once: true },
      });
    });

    gsap.from(".contact-panel .button", {
      y: 16,
      autoAlpha: 0,
      duration: 0.65,
      scrollTrigger: { trigger: ".contact-panel", start: "top 75%", once: true },
    });
  });

  return null;
}