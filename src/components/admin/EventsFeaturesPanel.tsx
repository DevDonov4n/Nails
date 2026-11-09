"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Feature = { key: string; enabled: boolean };
type PlatformEvent = { id: string; title: string; description: string | null; type: string; discountPercent: number | null; startsAt: string; endsAt: string; active: boolean };
const featureLabels: Record<string, { title: string; description: string }> = {
  loyalty: { title: "Programa de fidelidade", description: "Progresso de visitas e recompensa de 50% no próximo serviço." },
  referrals: { title: "Indique e Ganhe", description: "Campanha de indicação de novas clientes e recompensa por duas indicações concluídas." },
  "promotional-discounts": { title: "Descontos promocionais", description: "Aplicação automática de descontos em campanhas ativas." },
};
const formatDate = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value));
const localInput = (value: string) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
};
const saoPauloIso = (value: string) => new Date(value + ":00-03:00").toISOString();

export default function EventsFeaturesPanel() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [savingEvent, setSavingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PlatformEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDiscount, setEditDiscount] = useState("10");
  const [editStartsAt, setEditStartsAt] = useState("");
  const [editEndsAt, setEditEndsAt] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("LAUNCH_DISCOUNT");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [startsAt, setStartsAt] = useState("2026-12-01T00:00");
  const [endsAt, setEndsAt] = useState("2026-12-25T23:59");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/platform-settings", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar as configurações.");
      setFeatures(data.features ?? []);
      setEvents(data.events ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao carregar eventos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function openEdit(item: PlatformEvent) {
    setEditingEvent(item);
    setEditTitle(item.title);
    setEditDescription(item.description ?? "");
    setEditDiscount(String(item.discountPercent ?? 10));
    setEditStartsAt(localInput(item.startsAt));
    setEditEndsAt(localInput(item.endsAt));
    setError("");
    setMessage("");
  }

  async function saveEditedEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingEvent) return;
    setSavingEvent(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/platform-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: editingEvent.id,
          title: editTitle,
          description: editDescription,
          discountPercent: Number(editDiscount),
          startsAt: saoPauloIso(editStartsAt),
          endsAt: saoPauloIso(editEndsAt),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível salvar as alterações.");
      setEvents((current) => current.map((item) => item.id === editingEvent.id ? data.event : item));
      setEditingEvent(null);
      setMessage("Evento atualizado com sucesso.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao editar evento.");
    } finally {
      setSavingEvent(false);
    }
  }

  async function toggleFeature(feature: Feature) {
    setSavingKey(feature.key);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/platform-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: feature.key, enabled: !feature.enabled }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível atualizar a funcionalidade.");
      setFeatures((current) => current.map((item) => item.key === feature.key ? data.feature : item));
      setMessage(feature.enabled ? "Funcionalidade desativada." : "Funcionalidade ativada.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao atualizar.");
    } finally {
      setSavingKey("");
    }
  }

  async function toggleEvent(item: PlatformEvent) {
    setSavingKey(item.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/platform-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: item.id, active: !item.active }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível atualizar o evento.");
      setEvents((current) => current.map((event) => event.id === item.id ? data.event : event));
      setMessage(item.active ? "Evento pausado." : "Evento reativado.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao atualizar evento.");
    } finally {
      setSavingKey("");
    }
  }

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingEvent(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/platform-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, type, discountPercent: type === "LAUNCH_DISCOUNT" ? Number(discountPercent) : null, startsAt: saoPauloIso(startsAt), endsAt: saoPauloIso(endsAt) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível criar o evento.");
      setEvents((current) => [data.event, ...current]);
      setMessage("Evento cadastrado com sucesso.");
      setTitle("");
      setDescription("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao cadastrar evento.");
    } finally {
      setSavingEvent(false);
    }
  }

  const now = Date.now();
  return (
    <div className="adm-events-content">
      <div className="adm-events-intro">
        <div><span className="adm-panel-overline">CONTROLE DA PLATAFORMA</span><h1>Eventos e <em>funcionalidades.</em></h1><p>Gerencie recursos permanentes e campanhas especiais do Nails by Samara.</p></div>
        <button className="adm-events-refresh" type="button" onClick={() => void load()} disabled={loading}>↻ Atualizar</button>
      </div>
      {error && <div className="adm-error-banner" role="alert">{error}</div>}
      {message && <div className="adm-events-message" role="status">{message}</div>}
      <section className="adm-events-section">
        <div className="adm-events-heading"><div><span className="adm-panel-overline">RECURSOS DO SISTEMA</span><h2>Funcionalidades</h2><p>Ative ou suspenda recursos sem apagar o histórico já registrado.</p></div><span className="adm-events-count">{features.filter((item) => item.enabled).length} ativos</span></div>
        {loading ? <div className="adm-loading">Carregando configurações…</div> : <div className="adm-feature-grid">
          {features.map((feature) => {
            const meta = featureLabels[feature.key] ?? { title: feature.key, description: "Configuração da plataforma." };
            return <article className="adm-feature-card" key={feature.key}>
              <div className="adm-feature-card-top"><span className={feature.enabled ? "adm-feature-indicator is-on" : "adm-feature-indicator"} /> <span className={feature.enabled ? "adm-feature-state is-on" : "adm-feature-state"}>{feature.enabled ? "Ativo" : "Desativado"}</span></div>
              <h3>{meta.title}</h3><p>{meta.description}</p>
              <button type="button" className={feature.enabled ? "adm-feature-toggle is-on" : "adm-feature-toggle"} disabled={savingKey === feature.key || feature.key === "referrals"} onClick={() => void toggleFeature(feature)}>{feature.key === "referrals" ? "Em preparação" : savingKey === feature.key ? "Salvando…" : feature.enabled ? "Desativar recurso" : "Ativar recurso"}</button>
            </article>;
          })}
        </div>}
      </section>
      <section className="adm-events-section">
        <div className="adm-events-heading"><div><span className="adm-panel-overline">CAMPANHAS TEMPORÁRIAS</span><h2>Criar evento</h2><p>Cadastre campanhas com período de validade e regras específicas.</p></div></div>
        <form className="adm-event-form" onSubmit={createEvent}>
          <label>Nome do evento<input value={title} onChange={(event) => setTitle(event.target.value)} minLength={3} maxLength={100} required placeholder="Ex.: Campanha de inauguração" /></label>
          <label>Tipo de evento<select value={type} onChange={(event) => setType(event.target.value)}><option value="LAUNCH_DISCOUNT">Desconto promocional</option><option value="REFERRAL" disabled>Indique e Ganhe (em preparação)</option></select></label>
          {type === "LAUNCH_DISCOUNT" && <label>Desconto (%)<input type="number" min="1" max="90" step="1" value={discountPercent} onChange={(event) => setDiscountPercent(event.target.value)} required /></label>}
          <label className="adm-event-form-wide">Descrição<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={2} /></label>
          <label>Início<input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required /></label>
          <label>Encerramento<input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} required /></label>
          <div className="adm-event-form-wide adm-event-form-footer"><p>Os horários são interpretados no horário de Brasília.</p><button type="submit" disabled={savingEvent}>{savingEvent ? "Salvando…" : "＋ Cadastrar evento"}</button></div>
        </form>
      </section>
      <section className="adm-events-section">
        <div className="adm-events-heading"><div><span className="adm-panel-overline">ACOMPANHAMENTO</span><h2>Eventos cadastrados</h2><p>Confira campanhas futuras, em andamento e encerradas.</p></div><span className="adm-events-count">{events.length} eventos</span></div>
        {events.length === 0 ? <div className="adm-empty">Nenhum evento cadastrado até o momento.</div> : <div className="adm-event-list">{events.map((item) => {
          const start = new Date(item.startsAt).getTime(), end = new Date(item.endsAt).getTime();
          const status = !item.active ? "Pausado" : now > end ? "Encerrado" : now < start ? "Agendado" : "Em andamento";
          return <article className="adm-event-item" key={item.id}><div className="adm-event-item-main"><span className="adm-panel-overline">{item.type === "LAUNCH_DISCOUNT" ? "DESCONTO PROMOCIONAL" : "INDIQUE E GANHE"}</span><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}<small>{formatDate(item.startsAt)} — {formatDate(item.endsAt)}</small></div><div className="adm-event-item-side">{item.discountPercent && <strong>{item.discountPercent}% OFF</strong>}<span className={status === "Em andamento" ? "adm-event-status is-live" : "adm-event-status"}>{status}</span><button type="button" className="adm-event-edit" disabled={savingEvent || item.type !== "LAUNCH_DISCOUNT"} onClick={() => openEdit(item)}>Editar evento</button><button type="button" className="adm-event-toggle" disabled={savingKey === item.id} onClick={() => void toggleEvent(item)}>{savingKey === item.id ? "Salvando…" : item.active ? "Pausar evento" : "Reativar evento"}</button></div></article>;
        })}</div>}
      </section>

      {editingEvent && <div className="adm-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingEvent) setEditingEvent(null); }}>
        <section className="adm-event-modal" role="dialog" aria-modal="true" aria-labelledby="adm-event-modal-title">
          <button className="adm-modal-close" type="button" aria-label="Fechar edição" onClick={() => setEditingEvent(null)} disabled={savingEvent}>×</button>
          <span className="adm-panel-overline">ALTERAR CAMPANHA</span>
          <h2 id="adm-event-modal-title">Editar evento</h2>
          <p>Altere as informações abaixo. As mudanças serão aplicadas aos novos agendamentos dentro do período atualizado.</p>
          <form className="adm-event-form" onSubmit={saveEditedEvent}>
            <label className="adm-event-form-wide">Nome do evento<input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} minLength={3} maxLength={100} required /></label>
            <label className="adm-event-form-wide">Descrição<textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} maxLength={500} rows={3} /></label>
            <label>Desconto (%)<input type="number" min="1" max="90" step="1" value={editDiscount} onChange={(event) => setEditDiscount(event.target.value)} required /></label>
            <label>Início<input type="datetime-local" value={editStartsAt} onChange={(event) => setEditStartsAt(event.target.value)} required /></label>
            <label className="adm-event-form-wide">Encerramento<input type="datetime-local" value={editEndsAt} onChange={(event) => setEditEndsAt(event.target.value)} required /></label>
            {error && <p className="adm-event-modal-error adm-event-form-wide" role="alert">{error}</p>}
            <div className="adm-event-modal-actions adm-event-form-wide"><button type="button" className="adm-secondary-btn" onClick={() => setEditingEvent(null)} disabled={savingEvent}>Cancelar</button><button type="submit" className="adm-primary-btn" disabled={savingEvent}>{savingEvent ? "Salvando…" : "Salvar alterações"}</button></div>
          </form>
        </section>
      </div>}
    </div>
  );
}
