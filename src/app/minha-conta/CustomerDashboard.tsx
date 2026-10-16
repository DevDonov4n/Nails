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
};
type AccountData = {
  bookings: Booking[];
  loyalty: { completedCount: number; visitsUntilReward: number; rewardsEarned: number };
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

  useEffect(() => {
    let active = true;
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
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "Não foi possível carregar sua conta.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  return (
    <main className="account-page">
      <div className="container account-shell">
        <p className="eyebrow">NAILS BY SAMARA · ÁREA DO CLIENTE</p>
        <h1>Olá, <em>{name ? name.split(" ")[0] : "que bom ter você aqui"}.</em></h1>
        <p className="account-intro">Aqui você acompanha seus horários e seu progresso no programa de fidelidade.</p>
        {loading ? <p className="booking-muted" role="status">Carregando sua conta…</p> : error ? <p className="booking-feedback booking-feedback--error" role="alert">{error}</p> : data && (
          <>
            <div className="account-stats">
              <article className="account-stat"><span>Atendimentos concluídos</span><strong>{data.loyalty.completedCount}</strong><small>Visitas registradas</small></article>
              <article className="account-stat"><span>Recompensas conquistadas</span><strong>{data.loyalty.rewardsEarned}</strong><small>Uma recompensa a cada 10 atendimentos concluídos</small></article>
            </div>
            <section className="account-loyalty">
              <div><p className="eyebrow">PROGRAMA DE FIDELIDADE</p><h2>Seu cuidado vale mais.</h2><p>Complete 10 atendimentos para conquistar uma recompensa. Os pontos são contabilizados quando o salão marca o atendimento como concluído.</p></div>
              <div className="loyalty-progress" aria-label={`${data.loyalty.completedCount % 10} de 10 atendimentos para a próxima recompensa`}>
                <div className="loyalty-progress-copy"><strong>{data.loyalty.completedCount % 10}/10</strong><span>{data.loyalty.visitsUntilReward === 0 ? "Recompensa alcançada!" : `Faltam ${data.loyalty.visitsUntilReward} atendimento(s)`}</span></div>
                <div className="loyalty-track"><span style={{ width: `${(data.loyalty.completedCount % 10) * 10}%` }} /></div>
              </div>
            </section>
            <section className="account-bookings">
              <div className="account-section-heading"><div><p className="eyebrow">SEUS HORÁRIOS</p><h2>Meus agendamentos</h2></div><Link className="button button--primary" href="/agendamento">Novo agendamento ↗</Link></div>
              {data.bookings.length === 0 ? <div className="account-empty"><p>Você ainda não tem agendamentos associados à sua conta.</p><Link href="/agendamento">Escolher meu primeiro horário</Link></div> : <div className="account-booking-list">{data.bookings.map((booking) => (
                <article className="account-booking" key={booking.id}>
                  <div className="account-booking-date"><strong>{new Date(booking.startAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</strong><span>{new Date(booking.startAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}</span></div>
                  <div className="account-booking-main"><strong>{booking.serviceLabel}</strong><span>{booking.locationLabel}</span><small>{new Date(booking.startAt).toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/Sao_Paulo" })}</small></div>
                  <div className="account-booking-meta"><span className={`account-status account-status--${booking.status.toLowerCase()}`}>{statusLabels[booking.status]}</span><strong>{booking.totalPriceLabel}</strong></div>
                </article>
              ))}</div>}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
