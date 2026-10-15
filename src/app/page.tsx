import Button from "@/components/Button";
import { services } from "@/data/services";

const portfolioCards = [
  { number: "01", title: "Minimalista", detail: "Linhas delicadas • Tons neutros", style: "portfolio-art--minimal" },
  { number: "02", title: "Toque de cor", detail: "Cores que expressam você", style: "portfolio-art--color" },
  { number: "03", title: "Clássico elegante", detail: "Beleza atemporal", style: "portfolio-art--classic" },
];

export default function Home() {
  return (
    <>
      <main>
        <section className="hero" id="inicio">
          <div className="hero-orb hero-orb--one" aria-hidden="true" />
          <div className="hero-orb hero-orb--two" aria-hidden="true" />
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow"><span className="eyebrow-line" /> SEU MOMENTO DE CUIDADO</span>
              <h1>Unhas lindas.<br /><em>Você ainda mais.</em></h1>
              <p className="hero-description">
                Um espaço para realçar sua beleza, expressar seu estilo e reservar um tempinho só para você.
              </p>
              <div className="hero-actions">
                <Button href="#contato">Quero agendar <span aria-hidden="true">↗</span></Button>
                <a className="text-link" href="#servicos">Conheça os serviços <span aria-hidden="true">↓</span></a>
              </div>
              <div className="hero-note"><span className="note-star" aria-hidden="true">✳</span><span>Delicadeza em cada detalhe<br /><strong>Feito para você se sentir bem.</strong></span></div>
            </div>
            <div className="hero-visual" aria-label="Ilustração abstrata em tons rosados que representa beleza e cuidado">
              <div className="visual-ring visual-ring--outer" />
              <div className="visual-ring visual-ring--inner" />
              <div className="hero-flower" aria-hidden="true"><span>✳</span></div>
              <div className="visual-stamp"><span>NAILS</span><span className="stamp-star">✳</span><span>BY SAMARA</span></div>
              <div className="visual-caption"><span>BELEZA NATURAL</span><span>·</span><span>ESTILO ÚNICO</span></div>
            </div>
          </div>
          <div className="hero-bottom container"><span>01 — CUIDADO</span><span>02 — BELEZA</span><span>03 — AUTOESTIMA</span></div>
        </section>

        <section className="intro section-pad">
          <div className="container intro-grid">
            <p className="eyebrow">OLÁ, SEJA BEM-VINDA</p>
            <div><h2>Seu estilo, suas regras.<br /><em>Seu momento.</em></h2><p className="section-description">Acredito que cuidar das unhas vai além da beleza: é uma forma de carinho com você mesma. Vamos encontrar o estilo que combina com a sua personalidade?</p></div>
          </div>
        </section>

        <section className="services section-pad" id="servicos">
          <div className="container">
            <div className="section-heading"><div><p className="eyebrow">CUIDADO COM INTENÇÃO</p><h2>Um cuidado para<br /><em>cada versão de você.</em></h2></div><p className="section-description">Escolha o seu próximo momento de autocuidado. Os detalhes e valores podem ser confirmados no agendamento.</p></div>
            <div className="service-grid">
              {services.map((service) => (
                <article className="service-card" key={service.number}>
                  <div className="service-top"><span>{service.number}</span><span className="service-symbol" aria-hidden="true">✳</span></div>
                  <h3>{service.name}</h3><p>{service.description}</p>
                  <div className="service-meta"><span>{service.duration}</span><span>{service.priceLabel}</span></div>
                  <a href="#contato" className="service-link">Tenho interesse <span aria-hidden="true">↗</span></a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="portfolio section-pad" id="portfolio">
          <div className="container">
            <div className="section-heading"><div><p className="eyebrow">INSPIRAÇÃO PARA VOCÊ</p><h2>Pequenos detalhes,<br /><em>grande personalidade.</em></h2></div><p className="section-description">Cada unha é uma tela. Em breve, esta galeria poderá receber os trabalhos reais do estúdio.</p></div>
            <div className="portfolio-grid">
              {portfolioCards.map((card) => <article className="portfolio-card" key={card.number}><div className={`portfolio-art ${card.style}`}><div className="nail-shape nail-shape--one" /><div className="nail-shape nail-shape--two" /><div className="nail-shape nail-shape--three" /><span className="art-sparkle" aria-hidden="true">✳</span></div><div className="portfolio-info"><span>{card.number} / INSPIRAÇÃO</span><h3>{card.title}</h3><p>{card.detail}</p></div></article>)}
            </div>
          </div>
        </section>

        <section className="contact section-pad" id="contato">
          <div className="container contact-panel">
            <div className="contact-decoration" aria-hidden="true">✳</div>
            <p className="eyebrow">VAMOS MARCAR SEU MOMENTO?</p>
            <h2>Você merece esse<br /><em>tempo para você.</em></h2>
            <p>Entre em contato para consultar horários, serviços e valores.</p>
            <a className="button button--light" href="mailto:contato@nailsbysamara.com?subject=Agendamento%20Nails%20by%20Samara">Entrar em contato <span aria-hidden="true">↗</span></a>
            <span className="contact-footnote">Contato provisório — atualize com os canais oficiais antes de publicar.</span>
          </div>
        </section>
      </main>
    </>
  );
}
