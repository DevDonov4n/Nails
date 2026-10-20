"use client";

import Image, { type StaticImageData } from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { services, type SalonService } from "@/data/services";
import styles from "./ServiceDecks.module.css";

import mao1 from "@/assets/mao1.webp";
import mao2 from "@/assets/mao2.webp";
import mao3 from "@/assets/mao3.webp";
import mao4 from "@/assets/mao4.webp";
import mao5 from "@/assets/mao5.webp";
import pe1 from "@/assets/pe1.webp";
import pe2 from "@/assets/pe2.webp";
import pe3 from "@/assets/pe3.webp";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Work = { id: string; image: StaticImageData; label: string; category: "Mão" | "Pé" };

const hands: Work[] = [
  { id: "mao-1", image: mao1, label: "Mão", category: "Mão" },
  { id: "mao-2", image: mao2, label: "Mão", category: "Mão" },
  { id: "mao-3", image: mao3, label: "Mão", category: "Mão" },
  { id: "mao-4", image: mao4, label: "Mão", category: "Mão" },
  { id: "mao-5", image: mao5, label: "Mão", category: "Mão" },
];
const feet: Work[] = [
  { id: "pe-1", image: pe1, label: "Pé", category: "Pé" },
  { id: "pe-2", image: pe2, label: "Pé", category: "Pé" },
  { id: "pe-3", image: pe3, label: "Pé", category: "Pé" },
];
const workByService: Record<SalonService["id"], Work[]> = {
  HAND: hands,
  FOOT: feet,
  BOTH: [hands[0], feet[0], hands[1], feet[1], hands[2], feet[2], hands[3], hands[4]],
};

const VISIBLE_CARDS = 4;
const AUTOPLAY_MS = 2000;
const STAGGER_MS = 650;
const ROTATION_DEG = 3;

export default function ServiceDecks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<SalonService | null>(null);
  const [modalMounted, setModalMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [activeByService, setActiveByService] = useState<Record<string, number>>({ HAND: 0, FOOT: 0, BOTH: 0 });
  const [pausedByService, setPausedByService] = useState<Record<string, boolean>>({ HAND: false, FOOT: false, BOTH: false });
  const deckButtons = useRef<Record<string, HTMLButtonElement | null>>({});
  const closeButton = useRef<HTMLButtonElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closingRef = useRef(false);
  const reducedMotion = useRef(false);

  useGSAP(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion.current || !sectionRef.current) return;
    const decks = gsap.utils.toArray<HTMLElement>(sectionRef.current.querySelectorAll("[data-service-deck]"));
    gsap.fromTo(decks,
      { autoAlpha: 0, y: 24 },
      {
        autoAlpha: 1, y: 0, duration: 0.72, stagger: 0.16, ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 82%", once: true },
      },
    );
  }, { scope: sectionRef });

  // One recursive timeout per deck; pause while hovered/focused or while the modal is open.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cleanups = services.map((service, index) => {
      if (selected || pausedByService[service.id]) return () => undefined;
      let timeoutId: number | undefined;
      let cancelled = false;
      const schedule = (delay: number) => {
        timeoutId = window.setTimeout(() => {
          if (cancelled) return;
          setActiveByService((current) => ({
            ...current,
            [service.id]: ((current[service.id] ?? 0) + 1) % workByService[service.id].length,
          }));
          schedule(AUTOPLAY_MS);
        }, delay);
      };
      schedule(AUTOPLAY_MS + index * STAGGER_MS);
      return () => {
        cancelled = true;
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      };
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [pausedByService, selected]);

  const closeModal = useCallback(() => {
    if (!selected || closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const finish = () => {
      setSelected(null);
      setModalMounted(false);
      setClosing(false);
      closingRef.current = false;
      window.requestAnimationFrame(() => deckButtons.current[selected.id]?.focus());
    };
    if (reducedMotion.current || !backdropRef.current || !panelRef.current) {
      finish();
      return;
    }
    gsap.killTweensOf([backdropRef.current, panelRef.current]);
    gsap.to(panelRef.current, { autoAlpha: 0, y: 12, scale: 0.98, duration: 0.29, ease: "power2.in", overwrite: true });
    gsap.to(backdropRef.current, { autoAlpha: 0, duration: 0.32, ease: "power1.in", overwrite: true, onComplete: finish });
  }, [selected]);

  useEffect(() => {
    if (!selected || !modalMounted) return;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      const currentPadding = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    }
    const focusTimer = window.setTimeout(() => closeButton.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selected, modalMounted, closeModal]);

  useEffect(() => {
    if (!selected || !modalMounted || !backdropRef.current || !panelRef.current || reducedMotion.current) return;
    gsap.killTweensOf([backdropRef.current, panelRef.current]);
    gsap.fromTo(backdropRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.24, ease: "power1.out" });
    gsap.fromTo(panelRef.current, { autoAlpha: 0, y: 16, scale: 0.98 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.34, ease: "power2.out" });
  }, [selected, modalMounted]);

  const modalWorks = useMemo(() => selected ? workByService[selected.id] : [], [selected]);
  const openModal = (service: SalonService) => {
    closingRef.current = false;
    setClosing(false);
    setSelected(service);
    setModalMounted(true);
  };

  return (
    <div className={styles.serviceDeckRoot} ref={sectionRef}>
      <div className={styles.serviceDeckGrid}>
        {services.map((service, serviceIndex) => {
          const works = workByService[service.id];
          const active = activeByService[service.id] ?? 0;
          return (
            <article className={`service-card ${styles.serviceCard}`} key={service.id} data-service-deck>
              <div className={styles.deckStage}>
                <button
                  type="button"
                  className={styles.deckButton}
                  ref={(node) => { deckButtons.current[service.id] = node; }}
                  onClick={() => openModal(service)}
                  onMouseEnter={() => setPausedByService((state) => ({ ...state, [service.id]: true }))}
                  onMouseLeave={() => setPausedByService((state) => ({ ...state, [service.id]: false }))}
                  onFocus={() => setPausedByService((state) => ({ ...state, [service.id]: true }))}
                  onBlur={() => setPausedByService((state) => ({ ...state, [service.id]: false }))}
                  aria-label={`Ver todos os trabalhos de ${service.name}`}
                  aria-haspopup="dialog"
                >
                  {works.map((work, index) => {
                    const offset = (index - active + works.length) % works.length;
                    const visible = offset < VISIBLE_CARDS;
                    return (
                      <span
                        className={styles.card}
                        key={work.id}
                        data-front={offset === 0 ? "true" : "false"}
                        aria-hidden={offset !== 0}
                        inert={offset !== 0}
                        hidden={!visible}
                        style={{
                          "--offset": Math.min(offset, VISIBLE_CARDS - 1),
                          "--rotation": (Math.min(offset, VISIBLE_CARDS - 1) - 1.5) * ROTATION_DEG,
                          zIndex: works.length - offset,
                        } as React.CSSProperties}
                      >
                        <span className={styles.cardPhoto}>
                          <Image src={work.image} alt={`Trabalho de ${work.category.toLowerCase()}`} fill priority={serviceIndex === 0 && offset === 0} sizes="(max-width: 767px) 60vw, (max-width: 1023px) 26vw, 300px" />
                          <span className={styles.cardShade} aria-hidden="true" />
                          <span className={styles.cardLabel}>{work.label}</span>
                        </span>
                      </span>
                    );
                  })}
                  <span className={styles.deckHint}>TOQUE PARA VER OS TRABALHOS</span>
                </button>
              </div>

              <div className={styles.serviceDetails}>
                <h3>{service.name}</h3>
                <p className={styles.serviceDescription}>{service.description}</p>
                <div className={styles.serviceMeta}>
                  <span>{service.duration} aproximadamente</span>
                  <strong>{service.priceLabel}</strong>
                </div>
                <a href="/agendamento" className={`service-link ${styles.serviceLink}`}>Escolher este serviço <span aria-hidden="true">↗</span></a>
              </div>
            </article>
          );
        })}
      </div>

      {modalMounted && selected && (
        <div
          className={styles.modalBackdrop}
          ref={backdropRef}
          onClick={(event) => { if (event.target === event.currentTarget) closeModal(); }}
        >
          <section className={styles.modalPanel} ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="service-gallery-title" tabIndex={-1}>
            <header className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>NAILS BY SAMARA · PORTFÓLIO</p>
                <h2 id="service-gallery-title">{selected.name}</h2>
                <p className={styles.modalDescription}>{modalWorks.length} {modalWorks.length === 1 ? "trabalho" : "trabalhos"} nesta seleção.</p>
              </div>
              <button ref={closeButton} className={styles.closeButton} type="button" onClick={closeModal} disabled={closing} aria-label="Fechar">×</button>
            </header>
            <div className={styles.modalGrid}>
              {modalWorks.map((work) => (
                <article className={styles.modalWork} key={work.id}>
                  <div className={styles.modalPhoto}>
                    <Image src={work.image} alt={`Trabalho de ${work.category.toLowerCase()}`} fill sizes="(max-width: 600px) 42vw, (max-width: 1000px) 22vw, 220px" />
                  </div>
                  <p>{work.label}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
