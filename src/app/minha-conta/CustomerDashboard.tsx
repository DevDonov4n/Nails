"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Booking = {
  id: string;
  serviceLabel: string;
  locationLabel: string;
  startAt: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  totalPriceLabel: string;
  loyaltyDiscountLabel: string;
  promotionalDiscountLabel: string;
  updatedAt: string;
};
type AccountData = {
  bookings: Booking[];
  loyalty: { enabled: boolean; updatedAt: string | null; completedCount: number; visitsUntilReward: number; rewardsEarned: number; rewardsAvailable: number; progress: number };
};

const statusLabels: Record<Booking["status"], string> = {
  PENDING: "Aguardando confirmação",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Concluído",
};

export default function MinhaContaPage() {
  const [data, setData] = useState<AccountData | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{title:string;message:string;kind:"status"|"loyalty"|"suspended"}|null>(null);

  useEffect(() => {
    let active = true;
    let previousStatuses = new Map<string, string>();
    async function load() {
      try {
        const [meResponse, bookingsResponse] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch("/api/customer/bookings", { cache: "no-store" }),
        ]);
        const me = await meResponse.json();
        if (!meResponse.ok || !me.user) {
          window.location.replace("/login?next=%2Fminha-conta");
          return;
        }
        const result = await bookingsResponse.json();
        if (!bookingsResponse.ok) throw new Error(result.error ?? "Não foi possível carregar seus agendamentos.");
        if (active) {
          setName(me.user.name);
          setData(result);
          const rewardKey = `nbs-loyalty-reward-${result.loyalty.rewardsEarned}`;
          const hasUnseenReward = result.loyalty.enabled && result.loyalty.rewardsAvailable > 0
            && window.localStorage.getItem(rewardKey) !== "seen";
          const recentDecision = (result.bookings ?? []).find((booking: Booking) => {
            if (booking.status !== "CONFIRMED" && booking.status !== "CANCELLED") return false;
            const isRecent = Date.now() - new Date(booking.updatedAt).getTime() < 48 * 60 * 60 * 1000;
            const key = `nbs-booking-notice-${booking.id}-${booking.status}`;
            return isRecent && window.localStorage.getItem(key) !== "seen";
          });
          const changed = (result.bookings ?? []).find((booking: Booking) => previousStatuses.get(booking.id) === "PENDING" && (booking.status === "CONFIRMED" || booking.status === "CANCELLED"));
          const suspensionKey = "nbs-loyalty-suspended-" + (result.loyalty.updatedAt ?? "disabled");
          const hasUnseenSuspension = !result.loyalty.enabled && window.localStorage.getItem(suspensionKey) !== "seen";
          if (hasUnseenSuspension) {
            setNotice({
              kind: "suspended",
              title: "Programa de fidelidade temporariamente pausado",
              message: "O programa de fidelidade está temporariamente indisponível. Seu histórico, pontos acumulados e benefícios conquistados continuam preservados. Avisaremos quando o recurso estiver disponível novamente."
            });
            window.localStorage.setItem(suspensionKey, "seen");
          } else if (hasUnseenReward) {
            setNotice({
              kind: "loyalty",
              title: "Você conquistou 50% de desconto!",
              message: "Parabéns! Você completou 5 atendimentos e ganhou 50% de desconto no próximo serviço. O benefício é aplicado ao valor do serviço e não inclui a taxa de atendimento em domicílio."
            });
            window.localStorage.setItem(rewardKey, "seen");
          } else {
            const decision = changed ?? recentDecision;
            if (decision) {
              setNotice(decision.status === "CONFIRMED"
                ? { kind: "status", title: "Seu horário foi confirmado!", message: "A Diva confirmou seu agendamento. Em breve, ela poderá entrar em contato pelo WhatsApp." }
                : { kind: "status", title: "Seu pedido de horário foi cancelado", message: "A Diva não conseguiu atender nesse horário. Escolha outra data disponível para enviar uma nova solicitação." });
              window.localStorage.setItem(`nbs-booking-notice-${decision.id}-${decision.status}`, "seen");
            }
          }
          previousStatuses = new Map((result.bookings ?? []).map((booking: Booking) => [booking.id, booking.status]));
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "Não foi possível carregar sua conta.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    const interval = window.setInterval(() => { void load(); }, 15000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  return (
    <main className="account-page">
      <div className="container account-shell">
        <p className="eyebrow">NAILS BY SAMARA · ÁREA DO CLIENTE</p>
        <h1>Olá, <em>{name ? name.split(" ")[0] : "que bom ter você aqui"}.</em></h1>
        <p className="account-intro">Aqui você acompanha seus horários e as informações da sua conta.</p>
        {loading ? <p className="booking-muted" role="status">Carregando sua conta…</p> : error ? <p className="booking-feedback booking-feedback--error" role="alert">{error}</p> : data && (
          <>
            {data.loyalty.enabled && <>
            <div className="account-stats">
              <article className="account-stat"><span>Atendimentos concluídos</span><strong>{data.loyalty.completedCount}</strong><small>Visitas registradas</small></article>
              <article className="account-stat"><span>Recompensas conquistadas</span><strong>{data.loyalty.rewardsEarned}</strong><small>50% de desconto a cada 5 atendimentos concluídos</small></article>
            </div>
            {data.loyalty.rewardsAvailable > 0 && <div className="loyalty-reward-banner"><strong>🎁 Você conquistou 50% de desconto!</strong><span>Seu benefício está reservado para o próximo agendamento.</span></div>}
            <section className="account-loyalty">
              <div><p className="eyebrow">PROGRAMA DE FIDELIDADE</p><h2>Seu cuidado vale mais.</h2><p>Complete 5 atendimentos e ganhe 50% de desconto no próximo serviço. A contagem é atualizada quando a Diva conclui cada atendimento.</p></div>
              <div className="loyalty-progress" aria-label={`${data.loyalty.progress} de 5 atendimentos para a próxima recompensa`}>
                <div className="loyalty-progress-copy"><strong>{data.loyalty.progress}/5</strong><span>{data.loyalty.rewardsAvailable > 0 ? "Recompensa disponível!" : `Faltam ${data.loyalty.visitsUntilReward} atendimento(s)`}</span></div>
                <div className="loyalty-track"><span style={{ width: `${data.loyalty.progress * 20}%` }} /></div>
              </div>
            </section>
            </>}
            {notice && <div className="customer-notice-backdrop" role="presentation"><section className={`customer-notice ${notice.kind === "loyalty" ? "customer-notice--loyalty" : ""}`} role="alertdialog" aria-modal="true" aria-labelledby="customer-notice-title"><button type="button" onClick={() => setNotice(null)} aria-label="Fechar">×</button><p className="eyebrow">{notice.kind === "loyalty" ? "RECOMPENSA DE FIDELIDADE" : notice.kind === "suspended" ? "AVISO IMPORTANTE" : "NAILS BY SAMARA"}</p>{notice.kind === "loyalty" && <div className="customer-notice-gift" aria-hidden="true">50%</div>}<h2 id="customer-notice-title">{notice.title}</h2><p>{notice.message}</p><button className="button button--primary" type="button" onClick={() => setNotice(null)}>{notice.kind === "loyalty" ? "Aproveitar meu benefício" : "Entendi"}</button></section></div>}
            <section className="account-bookings">
              <div className="account-section-heading"><div><p className="eyebrow">SEUS HORÁRIOS</p><h2>Meus agendamentos</h2></div><Link className="button button--primary" href="/agendamento">Novo agendamento ↗</Link></div>
              {data.bookings.length === 0 ? <div className="account-empty"><p>Você ainda não tem agendamentos associados à sua conta.</p><Link href="/agendamento">Escolher meu primeiro horário</Link></div> : <div className="account-booking-list">{data.bookings.map((booking) => (
                <article className="account-booking" key={booking.id}>
                  <div className="account-booking-date"><strong>{new Date(booking.startAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</strong><span>{new Date(booking.startAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}</span></div>
                  <div className="account-booking-main"><strong>{booking.serviceLabel}</strong><span>{booking.locationLabel}</span><small>{new Date(booking.startAt).toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/Sao_Paulo" })}</small></div>
                  <div className="account-booking-meta"><span className={`account-status account-status--${booking.status.toLowerCase()}`}>{statusLabels[booking.status]}</span><strong>{booking.totalPriceLabel}</strong>{booking.loyaltyDiscountLabel !== "R$ 0,00" && <small>Desconto fidelidade: −{booking.loyaltyDiscountLabel}</small>}{booking.promotionalDiscountLabel !== "R$ 0,00" && <small>Desconto promocional: −{booking.promotionalDiscountLabel}</small>}</div>
                </article>
              ))}</div>}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
