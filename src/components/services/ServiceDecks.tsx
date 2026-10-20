"use client";

import Image, { type StaticImageData } from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type Work = {
  id: string;
  image: StaticImageData;
  label: string;
  category: "Mão" | "Pé";
};

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

const VISIBLE_CARDS = 3;
const AUTOPLAY_MS = 2000;
const OUTGOING_MS = 320;
const STAGGER_MS = 650;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export default function ServiceDecks() {
  const [activeByService, setActiveByService] = useState<Record<string, number>>({
    HAND: 0,
    FOOT: 0,
    BOTH: 0,
  });
  const [leavingByService, setLeavingByService] = useState<Record<string, boolean>>({});
  const [pausedByService, setPausedByService] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<SalonService | null>(null);
  const [modalMounted, setModalMounted] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const activeRef = useRef(activeByService);
  const pausedRef = useRef(pausedByService);
  const selectedRef = useRef<SalonService | null>(selected);
  const reducedMotionRef = useRef(false);
  const deckButtons = useRef<Record<string, HTMLButtonElement | null>>({});
  const closeButton = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const lastFocusedDeck = useRef<HTMLButtonElement | null>(null);
  const closingTimer = useRef<number | null>(null);

  activeRef.current = activeByService;
  pausedRef.current = pausedByService;
  selectedRef.current = selected;

  const setDeckPaused = useCallback((id: string, paused: boolean) => {
    setPausedByService((current) => ({ ...current, [id]: paused }));
  }, []);

  // Um ciclo de timeout por baralho: sem GSAP, intervalos concorrentes ou timers por render.
  useEffect(() => {
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    reducedMotionRef.current = mediaQuery.matches;
    if (mediaQuery.matches) return;

    const cleanups = services.map((service, index) => {
      let timer: number | undefined;
      let disposed = false;

      const schedule = (delay: number) => {
        timer = window.setTimeout(() => {
          if (disposed) return;

          if (document.hidden || selectedRef.current || pausedRef.current[service.id]) {
            schedule(200);
            return;
          }

          setLeavingByService((current) => ({ ...current, [service.id]: true }));
          timer = window.setTimeout(() => {
            if (disposed) return;
            setActiveByService((current) => ({
              ...current,
              [service.id]: ((activeRef.current[service.id] ?? 0) + 1) % workByService[service.id].length,
            }));
            setLeavingByService((current) => ({ ...current, [service.id]: false }));
            schedule(AUTOPLAY_MS - OUTGOING_MS);
          }, OUTGOING_MS);
        }, delay);
      };

      schedule(AUTOPLAY_MS + index * STAGGER_MS);
      return () => {
        disposed = true;
        if (timer !== undefined) window.clearTimeout(timer);
      };
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  const modalWorks = useMemo(
    () => (selected ? workByService[selected.id] : []),
    [selected],
  );

  const openModal = useCallback((service: SalonService, trigger: HTMLButtonElement) => {
    if (closingTimer.current !== null) window.clearTimeout(closingTimer.current);
    lastFocusedDeck.current = trigger;
    setSelected(service);
    setModalMounted(true);
    setModalVisible(false);
    window.requestAnimationFrame(() => setModalVisible(true));
  }, []);

  const closeModal = useCallback(() => {
    if (!selectedRef.current || closingTimer.current !== null) return;
    setModalVisible(false);
    closingTimer.current = window.setTimeout(() => {
      setModalMounted(false);
      setSelected(null);
      closingTimer.current = null;
      lastFocusedDeck.current?.focus();
    }, reducedMotionRef.current ? 0 : 320);
  }, []);

  useEffect(() => {
    if (!modalMounted) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      const computedPadding = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${computedPadding + scrollbarWidth}px`;
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
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [modalMounted, closeModal]);

  useEffect(() => () => {
    if (closingTimer.current !== null) window.clearTimeout(closingTimer.current);
  }, []);

  return (
    <div className={styles.serviceDeckRoot}>
      <div className={styles.serviceDeckGrid}>
        {services.map((service, serviceIndex) => {
          const works = workByService[service.id];
          const active = activeByService[service.id] ?? 0;

          return (
            <article className={styles.serviceCard} key={service.id}>
              <button
                type="button"
                className={styles.deckButton}
                ref={(node) => { deckButtons.current[service.id] = node; }}
                onClick={(event) => openModal(service, event.currentTarget)}
                onPointerEnter={() => setDeckPaused(service.id, true)}
                onPointerLeave={() => setDeckPaused(service.id, false)}
                onFocus={() => setDeckPaused(service.id, true)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setDeckPaused(service.id, false);
                  }
                }}
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
                      data-leaving={offset === 0 && leavingByService[service.id] ? "true" : "false"}
                      data-offset={Math.min(offset, VISIBLE_CARDS - 1)}
                      aria-hidden={offset !== 0}
                      inert={offset !== 0}
                      hidden={!visible}
                      style={{ zIndex: works.length - offset }}
                    >
                      <span className={styles.cardPhoto}>
                        <Image
                          src={work.image}
                          alt=""
                          fill
                          priority={serviceIndex === 0 && offset === 0}
                          sizes="(max-width: 768px) 28vw, 200px"
                        />
                        <span className={styles.cardShade} aria-hidden="true" />
                        <span className={styles.cardLabel}>{work.label}</span>
                      </span>
                    </span>
                  );
                })}
                <span className={styles.deckHint}>TOQUE PARA VER OS TRABALHOS</span>
              </button>

              <div className={styles.serviceDetails}>
                <h3>{service.name}</h3>
                <p className={styles.serviceDescription}>{service.description}</p>
                <div className={styles.serviceMeta}>
                  <span>{service.duration} aproximadamente</span>
                  <strong>{service.priceLabel}</strong>
                </div>
                <a href="/agendamento" className={styles.serviceLink}>
                  Escolher este serviço <span aria-hidden="true">↗</span>
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {modalMounted && selected && (
        <div
          className={`${styles.modalBackdrop} ${modalVisible ? styles.modalOpen : ""}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className={`${styles.modalPanel} ${modalVisible ? styles.modalPanelOpen : ""}`}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-gallery-title"
            tabIndex={-1}
          >
            <header className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>NAILS BY SAMARA · PORTFÓLIO</p>
                <h2 id="service-gallery-title">{selected.name}</h2>
                <p className={styles.modalDescription}>
                  {modalWorks.length} {modalWorks.length === 1 ? "trabalho" : "trabalhos"} nesta seleção.
                </p>
              </div>
              <button
                ref={closeButton}
                className={styles.closeButton}
                type="button"
                onClick={closeModal}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>
            <div className={styles.modalGrid}>
              {modalWorks.map((work) => (
                <article className={styles.modalWork} key={work.id}>
                  <div className={styles.modalPhoto}>
                    <Image
                      src={work.image}
                      alt={`Trabalho de ${work.category.toLowerCase()}`}
                      fill
                      sizes="(max-width: 600px) 42vw, (max-width: 1000px) 22vw, 220px"
                    />
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
