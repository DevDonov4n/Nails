import Image from "next/image";
import logo from "@/assets/logo.jpg";
import Button from "@/components/Button";
import PageAnimations from "@/components/animations/PageAnimations";
import NailPolishExperience from "@/components/animations/NailPolishExperience";
import ServiceDecks from "@/components/services/ServiceDecks";
import NailScrollSequence from "@/components/animations/NailScrollSequence";
import BrandPolishes from "@/components/BrandPolishes";

export default function Home() {
  return (
    <>
      <PageAnimations />
      <main>
        <NailScrollSequence scrollLength={4} />
        {/* <NailPolishExperience /> */}
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
                <Button href="/agendamento">Quero agendar</Button>
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
              <div id="visual-stamp" className="visual-stamp visual-stamp--logo"><Image src={logo} alt="Logo Nails by Samara" priority sizes="104px" /></div>
              <div className="visual-caption"><span>BELEZA NATURAL</span><span>·</span><span>ESTILO ÚNICO</span></div>
            </div>
          </div>  
          <div className="hero-bottom container" />
        </section>

        

        <section className="services section-pad" id="servicos">
          <div className="container">
            <div className="section-heading"><div><p className="eyebrow">CUIDADO COM INTENÇÃO</p><h2>Um cuidado para<br /><em>cada versão de você.</em></h2></div><p className="section-description">Escolha o atendimento que deseja e consulte os valores com tranquilidade. Cada serviço tem duração estimada de uma hora, para que você possa se organizar e aproveitar seu momento sem pressa. Toque em um baralho para ver todos os trabalhos daquela categoria.</p></div>
            <ServiceDecks />
          </div>
        </section>

        <BrandPolishes />

        <section className="contact section-pad" id="contato">
          <div className="container contact-panel">
            <p className="eyebrow">VAMOS MARCAR SEU MOMENTO?</p>
            <h2>Você merece esse<br /><em>tempo para você.</em></h2>
            <p>Quer saber qual serviço combina melhor com o que você procura? Consulte os horários disponíveis, tire suas dúvidas e veja os detalhes do atendimento antes de reservar.</p>
            <a className="button button--light" href="https://wa.me/5511918356982?text=Ol%C3%A1%20samara!%20Vim%20pelo%20site%20e%20desejo%20tirar%20algumas%20d%C3%BAvidas!!" target="_blank" rel="noopener noreferrer">Conversar pelo WhatsApp ↗</a>
          </div>
        </section>
      </main>
    </>
  );
}