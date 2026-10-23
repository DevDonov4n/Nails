"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./BrandPolishes.module.css";

import colorama from "@/assets/colorama.webp";
import dailus from "@/assets/dailus.webp";
import impala from "@/assets/impala.webp";
import risque from "@/assets/risque.webp";

const brands = [
  { name: "Impala", image: impala, eyebrow: "COR, CRIATIVIDADE E ESTILO", description: "Uma marca conhecida pela variedade de cores e opções para criar combinações que acompanham seu estilo.", highlights: ["Variedade de tons", "Muitas possibilidades", "Para diferentes estilos"] },
  { name: "Risqué", image: risque, eyebrow: "PERSONALIDADE EM CADA COR", description: "Cores e acabamentos para expressar sua personalidade e completar desde produções clássicas até as mais ousadas.", highlights: ["Cores marcantes", "Estilos variados", "Clássicos e tendências"] },
  { name: "Colorama", image: colorama, eyebrow: "COR PARA CADA MOMENTO", description: "Uma seleção versátil de esmaltes para acompanhar diferentes ocasiões, combinações e preferências.", highlights: ["Tons versáteis", "Combinações criativas", "Do básico ao vibrante"] },
  { name: "Dailus", image: dailus, eyebrow: "BELEZA COM ATITUDE", description: "Opções cheias de personalidade para quem gosta de explorar cores, acabamentos e novas ideias para as unhas.", highlights: ["Visual expressivo", "Cores atuais", "Liberdade para criar"] },
];

export default function BrandPolishes() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeBrand = brands[activeIndex];
  const showPrevious = () => setActiveIndex((current) => (current - 1 + brands.length) % brands.length);
  const showNext = () => setActiveIndex((current) => (current + 1) % brands.length);

  return (
    <section className={styles.section} id="marcas" aria-labelledby="brands-title">
      <div className={styles.container}>
        <div className={styles.heading}>
          <p className="eyebrow"><span className="eyebrow-line" /> MARCAS QUE FAZEM PARTE DO NOSSO CUIDADO</p>
          <h2 id="brands-title">Beleza em cada <em>detalhe.</em></h2>
          <p className={styles.intro}>Produtos selecionados para dar cor às suas escolhas e deixar cada cuidado ainda mais especial.</p>
        </div>
        <div className={styles.carousel} aria-roledescription="carrossel">
          <button className={styles.arrow} type="button" onClick={showPrevious} aria-label="Ver marca anterior"><span aria-hidden="true">←</span></button>
          <div className={styles.content} aria-live="polite" aria-atomic="true">
            <div className={styles.productStage}>
              <span className={styles.orbit} aria-hidden="true" />
              <span className={styles.sparkle} aria-hidden="true">✦</span>
              <div className={styles.productImage} key={activeBrand.name}>
                <Image src={activeBrand.image} alt={`Frasco de esmalte da marca ${activeBrand.name}`} className={styles.bottle} sizes="(max-width: 640px) 58vw, 280px" priority={activeIndex === 0} />
              </div>
              <span className={styles.productIndex}>{String(activeIndex + 1).padStart(2, "0")} / {String(brands.length).padStart(2, "0")}</span>
            </div>
            <div className={styles.details} key={`${activeBrand.name}-details`}>
              <p className={styles.brandEyebrow}>{activeBrand.eyebrow}</p>
              <h3>{activeBrand.name}</h3>
              <p className={styles.description}>{activeBrand.description}</p>
              <ul className={styles.highlights}>
                {activeBrand.highlights.map((highlight) => <li key={highlight}><span aria-hidden="true">✧</span>{highlight}</li>)}
              </ul>
              <div className={styles.dots} aria-label="Escolher marca">
                {brands.map((brand, index) => (
                  <button key={brand.name} type="button" className={index === activeIndex ? styles.dotActive : styles.dot} onClick={() => setActiveIndex(index)} aria-label={`Mostrar ${brand.name}`} aria-current={index === activeIndex ? "true" : undefined} />
                ))}
              </div>
            </div>
          </div>
          <button className={styles.arrow} type="button" onClick={showNext} aria-label="Ver próxima marca"><span aria-hidden="true">→</span></button>
        </div>
        <p className={styles.footnote}>Cada marca tem seu charme. O cuidado está em escolher o que combina com você.</p>
      </div>
    </section>
  );
}
