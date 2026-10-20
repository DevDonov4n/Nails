"use client";

import Image, { type StaticImageData } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
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

export default function NailInspirationDeck() {
  const [category, setCategory] = useState<Category>("todos");
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const [active, setActive] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const works = category === "maos" ? handWorks : category === "pes" ? footWorks : [...handWorks, ...footWorks];

  const closeModal = useCallback(() => {
    if (!expanded || closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !modalRef.current || !panelRef.current) {
      setExpanded(false);
      setClosing(false);
      return;
    }
    setClosing(true);
    anime({
      targets: panelRef.current,
      opacity: [1, 0],
      translateY: [0, 12],
      scale: [1, 0.98],
      duration: 220,
      easing: "easeInCubic",
    });
    anime({
      targets: modalRef.current,
      opacity: [1, 0],
      duration: 260,
      easing: "easeInQuad",
      complete: () => {
        setExpanded(false);
        setClosing(false);
      },
    });
  }, [expanded, closing]);

  useEffect(() => {
    if (expanded || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % works.length), 2000);
    return () => window.clearInterval(timer);
  }, [expanded, works.length, category]);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded, closeModal]);

  useEffect(() => {
    if (!expanded || !modalRef.current || !panelRef.current) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    anime({
      targets: modalRef.current,
      opacity: [0, 1],
      duration: 240,
      easing: "easeOutQuad",
    });
    anime({
      targets: panelRef.current,
      opacity: [0, 1],
      translateY: [18, 0],
      scale: [0.98, 1],
      duration: 360,
      easing: "easeOutCubic",
    });
  }, [expanded]);

  useEffect(() => {
    if (!expanded || !gridRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    anime({
      targets: gridRef.current.querySelectorAll("[data-work-card]"),
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 360,
      delay: anime.stagger(45),
      easing: "easeOutCubic",
    });
  }, [expanded, category]);



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
            {item.id === "todos" && <span>{handWorks.length + footWorks.length}</span>}
            {item.id === "maos" && <span>{handWorks.length}</span>}
            {item.id === "pes" && <span>{footWorks.length}</span>}
          </button>
        ))}
      </div>

      <button
        className={styles.deck}
        type="button"
        onClick={() => setExpanded(true)}
        aria-label={`Abrir galeria de trabalhos: ${categories.find((item) => item.id === category)?.label}`}
      >
        {works.map((work, index) => {
          const offset = (index - active + works.length) % works.length;
          return (
            <span
              key={work.id}
              className={styles.card}
              style={{ "--offset": offset, zIndex: works.length - offset } as React.CSSProperties}
              aria-hidden={index !== active}
            >
              <span className={styles.photoFrame}>
                <Image
                  src={work.image}
                  alt={work.title}
                  fill
                  priority={index === active}
                  sizes="(max-width: 420px) 190px, (max-width: 850px) 220px, 270px"
                />
              </span>
              <span className={styles.footer}>
                <small>NAILS BY SAMARA</small>
                <strong>{work.title}</strong>
                <small>{String(index + 1).padStart(2, "0")} / {String(works.length).padStart(2, "0")}</small>
              </span>
            </span>
          );
        })}
        <span className={styles.hint}>TOQUE NO BARALHO PARA VER OS TRABALHOS</span>
      </button>

      {expanded && (
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
          >
            <header className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>NAILS BY SAMARA · PORTFÓLIO</p>
                <h2 id="work-gallery-title">{category === "todos" ? "Pé e mão" : category === "maos" ? "Trabalhos de mãos" : "Trabalhos de pés"}</h2>
                <p id="work-gallery-description" className={styles.modalDescription}>
                  {works.length} {works.length === 1 ? "trabalho" : "trabalhos"} nesta seleção.
                </p>
              </div>
              <button className={styles.closeButton} type="button" onClick={closeModal} disabled={closing} aria-label="Fechar galeria">
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
                  onClick={() => setCategory(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className={styles.grid} ref={gridRef}>
              {works.map((work, index) => (
                <article className={styles.item} key={work.id} data-work-card>
                  <div className={styles.galleryPhoto}>
                    <Image
                      src={work.image}
                      alt={work.title}
                      fill
                      sizes="(max-width: 600px) 46vw, (max-width: 1000px) 30vw, 22vw"
                    />
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
