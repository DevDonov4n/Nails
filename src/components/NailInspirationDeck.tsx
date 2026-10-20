"use client";

import Image, { type StaticImageData } from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import anime from "animejs";
import styles from "./NailInspirationDeck.module.css";

import mao1 from "@/assets/mao1.webp";
import mao2 from "@/assets/mao2.webp";
import mao3 from "@/assets/mao3.webp";
import mao4 from "@/assets/mao4.webp";
import mao5 from "@/assets/mao5.webp";
import pe1 from "@/assets/pe1.webp";
import pe2 from "@/assets/pe2.webp";
import pe3 from "@/assets/pe3.webp";

type Category = "maos" | "pes" | "todos";
type Work = { id: string; title: string; image: StaticImageData; category: Exclude<Category, "todos"> };

const handWorks: Work[] = [
  { id: "mao-1", title: "Mãos · trabalho 01", image: mao1, category: "maos" },
  { id: "mao-2", title: "Mãos · trabalho 02", image: mao2, category: "maos" },
  { id: "mao-3", title: "Mãos · trabalho 03", image: mao3, category: "maos" },
  { id: "mao-4", title: "Mãos · trabalho 04", image: mao4, category: "maos" },
  { id: "mao-5", title: "Mãos · trabalho 05", image: mao5, category: "maos" },
];

const footWorks: Work[] = [
  { id: "pe-1", title: "Pés · trabalho 01", image: pe1, category: "pes" },
  { id: "pe-2", title: "Pés · trabalho 02", image: pe2, category: "pes" },
  { id: "pe-3", title: "Pés · trabalho 03", image: pe3, category: "pes" },
];

const categories: { id: Category; label: string }[] = [
  { id: "maos", label: "Mãos" },
  { id: "pes", label: "Pés" },
  { id: "todos", label: "Pé e mão" },
];

const VISIBLE_CARDS = 5;
const AUTOPLAY_INTERVAL = 2000;
const CARD_TRANSITION_MS = 620;

export default function NailInspirationDeck() {
  const [category, setCategory] = useState<Category>("todos");
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [modalMounted, setModalMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closingRef = useRef(false);
  const works = useMemo(
    () => category === "maos" ? handWorks : category === "pes" ? footWorks : [...handWorks, ...footWorks],
    [category],
  );

  const closeModal = useCallback(() => {
    if (!expanded || closingRef.current) return;
    closingRef.current = true;
    setClosing(true);

    const finishClose = () => {
      setExpanded(false);
      setModalMounted(false);
      setClosing(false);
      closingRef.current = false;
      window.requestAnimationFrame(() => deckRef.current?.focus());
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !modalRef.current || !panelRef.current) {
      finishClose();
      return;
    }

    anime.remove([modalRef.current, panelRef.current]);
    anime({
      targets: panelRef.current,
      opacity: [1, 0],
      translateY: [0, 14],
      scale: [1, 0.975],
      duration: 300,
      easing: "easeInCubic",
    });
    anime({
      targets: modalRef.current,
      opacity: [1, 0],
      duration: 320,
      easing: "easeInQuad",
      complete: finishClose,
    });
  }, [expanded]);

  useEffect(() => {
    if (expanded || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches || works.length < 2) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % works.length), AUTOPLAY_INTERVAL);
    return () => window.clearInterval(timer);
  }, [expanded, paused, works.length]);

  useEffect(() => {
    if (!expanded) return;
    setModalMounted(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

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
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded, closeModal]);

  useEffect(() => {
    if (!expanded || !modalMounted || !modalRef.current || !panelRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    anime.remove([modalRef.current, panelRef.current]);
    anime({
      targets: modalRef.current,
      opacity: [0, 1],
      duration: 250,
      easing: "easeOutQuad",
    });
    anime({
      targets: panelRef.current,
      opacity: [0, 1],
      translateY: [16, 0],
      scale: [0.975, 1],
      duration: 330,
      easing: "easeOutCubic",
    });
  }, [expanded, modalMounted]);

  useEffect(() => {
    if (!expanded || !gridRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    anime({
      targets: gridRef.current.querySelectorAll("[data-work-card]"),
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 320,
      delay: anime.stagger(35),
      easing: "easeOutCubic",
    });
  }, [expanded, category]);

  const openModal = () => {
    closingRef.current = false;
    setClosing(false);
    setModalMounted(true);
    setExpanded(true);
    setPaused(true);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.categoryBar} role="group" aria-label="Categoria de trabalhos">
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.categoryButton} ${category === item.id ? styles.categoryActive : ""}`}
            aria-pressed={category === item.id}
            onClick={() => {
              setCategory(item.id);
              setActive(0);
            }}
          >
            {item.label}
            <span>{item.id === "todos" ? handWorks.length + footWorks.length : item.id === "maos" ? handWorks.length : footWorks.length}</span>
          </button>
        ))}
      </div>

      <div
        className={styles.deckStage}
        style={{
          position: "relative",
          width: "min(100%, 680px)",
          height: "clamp(340px, 39vw, 490px)",
          minWidth: 0,
          marginInline: "auto",
          overflow: "clip",
          isolation: "isolate",
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <button
          ref={deckRef}
          className={styles.deck}
          style={{
            position: "relative",
            display: "block",
            width: "100%",
            maxWidth: "100%",
            height: "100%",
            margin: 0,
            padding: 0,
            overflow: "clip",
            border: 0,
            background: "transparent",
            isolation: "isolate",
          }}
          type="button"
          onClick={openModal}
          onFocus={() => setPaused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
          }}
          aria-label={`Abrir galeria de trabalhos: ${categories.find((item) => item.id === category)?.label}`}
          aria-haspopup="dialog"
        >
          {works.map((work, index) => {
            const offset = (index - active + works.length) % works.length;
            const visible = offset < VISIBLE_CARDS;
            return (
              <span
                key={work.id}
                className={styles.card}
                style={{
                  "--offset": Math.min(offset, VISIBLE_CARDS - 1),
                  "--depth": Math.min(offset, VISIBLE_CARDS - 1),
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "min(100%, clamp(180px, 22vw, 320px))",
                  maxWidth: "320px",
                  aspectRatio: "5 / 7",
                  boxSizing: "border-box",
                  border: "20px solid var(--cream)",
                  borderRadius: "19px",
                  overflow: "hidden",
                  background: "var(--cream)",
                  boxShadow: offset === 0
                    ? "0 22px 48px rgb(51 40 42 / 20%), 0 4px 10px rgb(51 40 42 / 10%)"
                    : "0 16px 38px rgb(51 40 42 / 16%), 0 3px 8px rgb(51 40 42 / 9%)",
                  transform: `translate(calc(-50% + ${Math.min(offset, VISIBLE_CARDS - 1) * 12}px), calc(-50% + ${Math.min(offset, VISIBLE_CARDS - 1) * 5}px)) rotate(${(Math.min(offset, VISIBLE_CARDS - 1) - 2) * 3}deg) scale(${1 - Math.min(offset, VISIBLE_CARDS - 1) * 0.035})`,
                  transformOrigin: "50% 60%",
                  transition: "transform 620ms cubic-bezier(.22, .75, .25, 1), opacity 420ms ease, box-shadow 420ms ease",
                  zIndex: works.length - offset,
                } as React.CSSProperties}
                data-front={offset === 0 ? "true" : "false"}
                aria-hidden={index !== active}
                inert={index !== active}
                hidden={!visible}
              >
                <span
                  className={styles.photoFrame}
                  style={{
                    position: "relative",
                    display: "block",
                    width: "100%",
                    height: "100%",
                    minWidth: 0,
                    minHeight: 0,
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={work.image}
                    alt={work.title}
                    fill
                    priority={index === active}
                    sizes="(max-width: 768px) 60vw, 320px"
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "block",
                      width: "100%",
                      height: "100%",
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                    }}
                  />
                  <span className={styles.photoShade} aria-hidden="true" />
                  <span className={styles.categoryLabel}>{work.category === "maos" ? "Mão" : "Pé"}</span>
                </span>
              </span>
            );
          })}
          <span className={styles.hint}>TOQUE NAS CARTAS PARA VER OS TRABALHOS</span>
        </button>
      </div>

      {modalMounted && (
        <div
          className={styles.modalBackdrop}
          ref={modalRef}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className={styles.modalPanel}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="work-gallery-title"
            aria-describedby="work-gallery-description"
            tabIndex={-1}
          >
            <header className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>NAILS BY SAMARA · PORTFÓLIO</p>
                <h2 id="work-gallery-title">{category === "todos" ? "Pé e mão" : category === "maos" ? "Trabalhos de mãos" : "Trabalhos de pés"}</h2>
                <p id="work-gallery-description" className={styles.modalDescription}>
                  {works.length} {works.length === 1 ? "trabalho" : "trabalhos"} nesta seleção.
                </p>
              </div>
              <button ref={closeButtonRef} className={styles.closeButton} type="button" onClick={closeModal} disabled={closing} aria-label="Fechar">
                <span aria-hidden="true">×</span>
              </button>
            </header>

            <div className={styles.modalCategories} role="group" aria-label="Filtrar trabalhos">
              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.modalCategory} ${category === item.id ? styles.modalCategoryActive : ""}`}
                  aria-pressed={category === item.id}
                  onClick={() => {
                    setCategory(item.id);
                    setActive(0);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className={styles.grid} ref={gridRef}>
              {works.map((work) => (
                <article className={styles.item} key={work.id} data-work-card>
                  <div className={styles.galleryPhoto}>
                    <Image
                      src={work.image}
                      alt={work.title}
                      fill
                      sizes="(max-width: 600px) 46vw, (max-width: 1000px) 22vw, 250px"
                    />
                    <span className={styles.galleryCategory}>{work.category === "maos" ? "Mão" : "Pé"}</span>
                  </div>
                  <div className={styles.caption}>
                    <span>{work.category === "maos" ? "MÃOS" : "PÉS"}</span>
                    <h3>{work.title}</h3>
                    <p>Trabalho de manicure · Nails by Samara</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
