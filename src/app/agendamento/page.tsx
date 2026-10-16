"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ServiceId = "HAND" | "FOOT" | "BOTH";
type LocationId = "SALON" | "HOME";
const serviceOptions: { id: ServiceId; name: string; price: number }[] = [
  { id: "HAND", name: "Mão", price: 30 },
  { id: "FOOT", name: "Pé", price: 35 },
  { id: "BOTH", name: "Pé + mão", price: 60 },
];
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dateValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function AgendamentoPage() {
  const [date, setDate] = useState("");
  const [minimumDate, setMinimumDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [service, setService] = useState<ServiceId>("HAND");
  const [location, setLocation] = useState<LocationId>("SALON");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [accountLoading, setAccountLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  const selectedService = useMemo(() => serviceOptions.find((item) => item.id === service)!, [service]);
  const total = selectedService.price + (location === "HOME" ? 5 : 0);
  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!active || !data.user) return;
        setLoggedIn(true);
        setName(data.user.name ?? "");
        setWhatsapp(data.user.whatsapp ?? "");
      })
      .catch(() => { /* Permite agendamento como visitante se a consulta de sessão falhar. */ })
      .finally(() => { if (active) setAccountLoading(false); });
    const today = dateValue(new Date());
    setDate(today);
    setMinimumDate(today);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!date) return;
    let active = true;
    const controller = new AbortController();
    setLoadingSlots(true);
    setTime("");
    setError("");
    setSuccess("");
    fetch(`/api/availability?date=${encodeURIComponent(date)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Não foi possível consultar os horários.");
        if (active) setSlots(Array.isArray(data.slots) ? data.slots.filter((slot: unknown) => typeof slot === "string") : []);
      })
      .catch((reason: unknown) => {
        if (active && !(reason instanceof DOMException && reason.name === "AbortError")) {
          setSlots([]);
          setError(reason instanceof Error ? reason.message : "Erro ao consultar horários.");
        }
      })
      .finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; controller.abort(); };
  }, [date]);

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setError("");
    setSuccess("");
    if (!time || !slots.includes(time)) {
      setError("Escolha um horário disponível antes de continuar.");
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, whatsapp, address, service, location, date, time }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível solicitar o agendamento.");
      setSuccess(`${data.message} Código: ${data.booking.id}. Total: ${data.booking.totalPriceLabel ?? money(total)}.`);
      setTime("");
      const refreshedResponse = await fetch(`/api/availability?date=${encodeURIComponent(date)}`, { cache: "no-store" });
      const refreshed = await refreshedResponse.json();
      if (refreshedResponse.ok && Array.isArray(refreshed.slots)) setSlots(refreshed.slots);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ocorreu um erro inesperado.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="booking-page">
      <div className="booking-shell">
        <Link className="booking-back" href="/">← Voltar ao início</Link>
        <div className="booking-heading">
          <p className="eyebrow">NAILS BY SAMARA · RESERVAS</p>
          <h1>Seu momento<br /><em>começa aqui.</em></h1>
          <p>Escolha o serviço que deseja, veja os horários disponíveis e solicite seu agendamento. {loggedIn ? "Seus dados de contato serão usados automaticamente pela sua conta." : "Você pode agendar como visitante ou entrar na sua conta para agilizar o processo."}</p>
        </div>
        {!loggedIn && <aside className="booking-account-promo">
          <span className="booking-promo-icon" aria-hidden="true">✦</span>
          <div>
            <strong>Quer deixar os próximos agendamentos mais práticos?</strong>
            <p>Na sua área de cliente, você poderá acompanhar os agendamentos vinculados à sua conta e o progresso da fidelidade.</p>
          </div>
          <Link href="/cadastro">Conhecer o cadastro <span aria-hidden="true">↗</span></Link>
        </aside>}
        <form className="booking-card" onSubmit={submitBooking}>
          <section className="booking-section">
            <span className="booking-step">01</span>
            <div><h2>Escolha o tratamento</h2><p>Veja as opções abaixo e selecione o atendimento que prefere. Cada serviço tem duração estimada de uma hora.</p></div>
            <div className="booking-service-options">
              {serviceOptions.map((option) => (
                <button key={option.id} type="button" className={service === option.id ? "booking-service is-selected" : "booking-service"} onClick={() => setService(option.id)} aria-pressed={service === option.id}>
                  <span>{option.name}</span><strong>{money(option.price)}</strong><small>aprox. 1 hora</small>
                </button>
              ))}
            </div>
          </section>
          <section className="booking-section">
            <span className="booking-step">02</span>
            <div><h2>Onde você prefere?</h2><p>Escolha entre atendimento no salão ou em domicílio. Para a visita em casa, há uma taxa fixa de mobilidade de R$ 5,00.</p></div>
            <div className="booking-location-options">
              <label className={location === "SALON" ? "booking-location is-selected" : "booking-location"}><input type="radio" name="location" value="SALON" checked={location === "SALON"} onChange={() => setLocation("SALON")} /><span><strong>No salão</strong><small>Sem taxa de mobilidade</small></span></label>
              <label className={location === "HOME" ? "booking-location is-selected" : "booking-location"}><input type="radio" name="location" value="HOME" checked={location === "HOME"} onChange={() => setLocation("HOME")} /><span><strong>Em domicílio</strong><small>Acrescenta R$ 5,00 de mobilidade</small></span></label>
            </div>
            {location === "HOME" && <label className="booking-field">Endereço completo<input required maxLength={300} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Informe rua, número, bairro e cidade" autoComplete="street-address" /></label>}
          </section>
          <section className="booking-section">
            <span className="booking-step">03</span>
            <div><h2>Escolha a data e o horário</h2><p>Selecione o dia desejado e depois escolha um dos horários livres. O atendimento funciona de segunda a sexta, das 16h às 20h, e aos sábados e domingos, das 9h às 18h.</p></div>
            <label className="booking-field">Data do atendimento<input type="date" min={minimumDate} value={date} onChange={(e) => setDate(e.target.value)} required /></label>
            <div className="booking-slots-label">Horários disponíveis</div>
            {loadingSlots ? <p className="booking-muted" role="status">Estamos consultando os horários para essa data. Só um instante, por favor.</p> : slots.length ? <div className="booking-slots">{slots.map((slot) => <button type="button" key={slot} onClick={() => setTime(slot)} className={time === slot ? "booking-slot is-selected" : "booking-slot"} aria-pressed={time === slot}>{slot}</button>)}</div> : <p className="booking-muted">Não encontramos horários livres para esse dia. Você pode escolher outra data para consultar novas opções.</p>}
          </section>
          <section className="booking-section">
            <span className="booking-step">04</span>
            <div><h2>{loggedIn ? "Dados da sua conta" : "Seus dados para contato"}</h2><p>{loggedIn ? "Vamos usar o nome e WhatsApp cadastrados na sua conta. Não é necessário preenchê-los novamente." : "Preencha seu nome e WhatsApp com DDD para que o salão possa identificar sua solicitação e conversar com você sobre a confirmação do atendimento."}</p></div>
            {accountLoading ? <p className="booking-muted" role="status">Conferindo sua conta...</p> : loggedIn ? <div className="booking-account-details"><p><strong>Nome:</strong> {name}</p><p><strong>WhatsApp:</strong> {whatsapp}</p><small>Para alterar esses dados, atualize seu cadastro antes de agendar.</small></div> : <><label className="booking-field">Nome completo<input required minLength={2} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Informe seu nome e sobrenome" /></label><label className="booking-field">WhatsApp com DDD<input required type="tel" maxLength={20} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} autoComplete="tel" placeholder="Ex.: (11) 99999-9999" /></label></> }
          </section>
          <aside className="booking-total"><div><span>Valor do tratamento</span><strong>{money(selectedService.price)}</strong></div><div><span>Taxa de mobilidade</span><strong>{money(location === "HOME" ? 5 : 0)}</strong></div><div className="booking-total-final"><span>Valor total</span><strong>{money(total)}</strong></div></aside>
          {error && <p className="booking-feedback booking-feedback--error" role="alert">{error}</p>}
          {success && <p className="booking-feedback booking-feedback--success" role="status">{success}</p>}
          <button className="button button--primary booking-submit" type="submit" disabled={sending || loadingSlots}>{sending ? "Enviando solicitação…" : "Solicitar agendamento ↗"}</button>
          <p className="booking-disclaimer">Após enviar, sua solicitação será registrada. O horário ainda precisará ser confirmado pelo salão, para que você tenha certeza de que está tudo combinado.</p>
        </form>
        {!loggedIn && <p className="booking-login-prompt">Já tem uma conta? <Link href="/login">Acesse seu login</Link> para agilizar seus próximos agendamentos.</p>}
      </div>
    </main>
  );
}
