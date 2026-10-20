import Button from "@/components/Button";
import PageAnimations from "@/components/animations/PageAnimations";
import NailPolishExperience from "@/components/animations/NailPolishExperience";
import NailInspirationDeck from "@/components/NailInspirationDeck";
import ServiceDecks from "@/components/services/ServiceDecks";

export default function Home() {
  return (
    <>
      <PageAnimations />
      <main>
        <NailPolishExperience />
        <section className="hero" id="inicio">
          <div className="hero-orb hero-orb--one" aria-hidden="true" />
          <div className="hero-orb hero-orb--two" aria-hidden="true" />
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow"><span className="eyebrow-line" /> SEU MOMENTO DE CUIDADO</span>
              <h1><span className="hero-title-line">Unhas lindas.</span><span className="hero-title-line"><em>Você ainda mais.</em></span></h1>
              <p className="hero-description">
                Reserve um momento para você, cuide das mãos e dos pés com carinho e escolha o estilo que faz você se sentir bonita e confiante. Um atendimento pensado para deixar seu dia mais leve, com atenção a cada detalhe.
              </p>
              <div className="hero-actions">
                <Button href="/agendamento">Quero agendar <span aria-hidden="true">↗</span></Button>
                <a className="text-link" href="#servicos">Conheça os serviços <span aria-hidden="true">↓</span></a>
              </div>
              <div className="hero-note">
                <span>Delicadeza em cada detalhe<br /><strong>Um tempo especial para você se cuidar.</strong></span>
              </div>
            </div>
            <div className="hero-visual" aria-label="Ilustração abstrata em tons rosados que representa beleza e cuidado">
              <div className="visual-ring visual-ring--outer" />
              <div className="visual-ring visual-ring--inner" />
              <div className="hero-flower" aria-hidden="true"><span data-polish-start>NC</span></div>
              <div id="visual-stamp" className="visual-stamp"><span>NAILS</span><span className="stamp-star">PIC</span><span>BY SAMARA</span></div>
              <div className="visual-caption"><span>BELEZA NATURAL</span><span>·</span><span>ESTILO ÚNICO</span></div>
            </div>
          </div>  
          <div className="hero-bottom container" />
        </section>

        

        <section className="services section-pad" id="servicos">
          <div className="container">
            <div className="section-heading"><div><p className="eyebrow">CUIDADO COM INTENÇÃO</p><h2>Um cuidado para<br /><em>cada versão de você.</em></h2></div><p className="section-description">Escolha o atendimento que deseja e consulte os valores com tranquilidade. Cada serviço tem duração estimada de uma hora, para que você possa se organizar e aproveitar seu momento sem pressa.</p></div>
            <ServiceDecks />
          </div>
        </section>

        <section className="portfolio section-pad" id="portfolio">
          <div className="container">
            <div className="section-heading"><div><p className="eyebrow">INSPIRAÇÃO PARA VOCÊ</p><h2>Pequenos detalhes,<br /><em>grande personalidade.</em></h2></div><p className="section-description">Explore uma seleção de inspirações. As artes são provisórias e poderão ser substituídas pelos prints reais das publicações do Instagram.</p></div>
            <NailInspirationDeck />
          </div>
        </section>

        <section className="contact section-pad" id="contato">
          <div className="container contact-panel">
            <p className="eyebrow">VAMOS MARCAR SEU MOMENTO?</p>
            <h2>Você merece esse<br /><em>tempo para você.</em></h2>
            <p>Quer saber qual serviço combina melhor com o que você procura? Consulte os horários disponíveis, tire suas dúvidas e veja os detalhes do atendimento antes de reservar.</p>
            <a className="button button--light" href="mailto:contato@nailsbysamara.com?subject=Agendamento%20Nails%20by%20Samara">Entrar em contato <span aria-hidden="true">↗</span></a>
            <span className="contact-footnote">Contato provisório — atualize com os canais oficiais antes de publicar.</span>
          </div>
        </section>
      </main>
    </>
  );
}
