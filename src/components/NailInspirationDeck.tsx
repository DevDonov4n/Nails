"use client";
import { useEffect, useRef, useState } from "react";
import anime from "animejs";
import styles from "./NailInspirationDeck.module.css";
const posts = [
  { id: "01", title: "Rosa delicado", tone: "rose", description: "Tons suaves para todos os momentos." },
  { id: "02", title: "Clássico elegante", tone: "wine", description: "Um clássico que nunca perde o charme." },
  { id: "03", title: "Brilho sutil", tone: "pearl", description: "Pequenos detalhes que fazem diferença." },
  { id: "04", title: "Toque moderno", tone: "modern", description: "Personalidade em cada detalhe." },
  { id: "05", title: "Minimalista", tone: "minimal", description: "Beleza leve, simples e atemporal." },
  { id: "06", title: "Seu momento", tone: "blush", description: "Um tempo para cuidar de você." },
];
export default function NailInspirationDeck() {
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (expanded || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % posts.length), 2000);
    return () => window.clearInterval(timer);
  }, [expanded]);
  useEffect(() => {
    if (!expanded || !gridRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    anime({ targets: gridRef.current.querySelectorAll("[data-deck-card]"), opacity: [0, 1], translateY: [14, 0], duration: 450, delay: anime.stagger(60), easing: "easeOutCubic" });
  }, [expanded]);
  return <div className={styles.wrapper}>
    {!expanded ? <button className={styles.deck} type="button" onClick={() => setExpanded(true)} aria-label="Expandir baralho de inspirações">
      {posts.map((post, index) => {
        const offset = (index - active + posts.length) % posts.length;
        return <span key={post.id} className={`${styles.card} ${styles[post.tone]}`} style={{ "--offset": offset } as React.CSSProperties} aria-hidden={index !== active}>
          <span className={styles.art}><i /><i /><i /></span><span className={styles.footer}><small>NAILS BY SAMARA</small><strong>{post.title}</strong><small>{post.id} / 06</small></span>
        </span>;
      })}
      <span className={styles.hint}>TOQUE PARA EXPLORAR ↗</span>
    </button> : <div className={styles.expanded} ref={gridRef}>
      <div className={styles.top}><p>ESCOLHA SUA INSPIRAÇÃO</p><button type="button" onClick={() => setExpanded(false)}>Recolher ↗</button></div>
      <div className={styles.grid}>{posts.map((post) => <article className={styles.item} key={post.id} data-deck-card>
        <div className={`${styles.art} ${styles[post.tone]}`}><i /><i /><i /><small>{post.id}</small></div>
        <div className={styles.caption}><h3>{post.title}</h3><p>{post.description}</p><small>NAILS BY SAMARA · INSPIRAÇÃO</small></div>
      </article>)}</div>
    </div>}
  </div>;
}
