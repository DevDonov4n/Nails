"use client";

import "./admin.css";
import Image from "next/image";
import logo from "@/assets/logo.jpg";
import { FormEvent, useEffect, useMemo, useState } from "react";

type MonthMetric = {
  month: string;
  revenue: number;
  appointments: number;
  completed: number;
};
type RecentBooking = {
  id: string;
  customerName: string;
  service: string;
  date: string;
  status: string;
  totalPrice: number;
  whatsapp: string;
};
type AdminBooking = {
  id: string;
  customerName: string;
  whatsapp: string;
  address: string | null;
  service: "HAND" | "FOOT" | "BOTH";
  location: "SALON" | "HOME";
  startAt: string;
  endAt: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  servicePrice: number;
  mobilityFee: number;
  totalPrice: number;
  userId: string | null;
};
type DashboardData = {
  year: number;
  goal: number;
  summary: {
    today: number;
    week: number;
    month: number;
    revenue: number;
    forecast: number;
    finishedToday: number;
  };
  months: MonthMetric[];
  recent: RecentBooking[];
};

const currency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
const number = (value: number) => value.toLocaleString("pt-BR");
const monthLong = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).replace(".", "");
const statusLabel: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

function BarChart({ data }: { data: MonthMetric[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((item) => item.completed));
  const width = 640,
    height = 245,
    left = 12,
    right = 12,
    top = 16,
    bottom = 35;
  const plotH = height - top - bottom;
  const step = (width - left - right) / data.length;
  const barWidth = Math.min(27, step * 0.56);
  return (
    <div className="adm-chart-scroll">
      <svg
        className="adm-chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Atendimentos concluídos por mês"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line
              x1={left}
              x2={width - right}
              y1={top + plotH * t}
              y2={top + plotH * t}
              className="adm-grid-line"
            />
            <text x={left} y={top + plotH * t - 5} className="adm-axis-text">
              {Math.round(max * (1 - t))}
            </text>
          </g>
        ))}
        {data.map((item, i) => {
          const barH = (item.completed / max) * (plotH - 8);
          const x = left + i * step + (step - barWidth) / 2;
          return (
            <g
              key={item.month}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              tabIndex={0}
              role="button"
              aria-label={`${item.month}: ${item.completed} atendimentos concluídos`}
            >
              <rect
                x={x - 4}
                y={top}
                width={step}
                height={plotH + 10}
                fill="transparent"
              />
              <rect
                x={x}
                y={top + plotH - barH}
                width={barWidth}
                height={Math.max(3, barH)}
                rx="5"
                className={hover === i ? "adm-bar active" : "adm-bar"}
              />
              <text
                x={left + i * step + step / 2}
                y={height - 11}
                textAnchor="middle"
                className={
                  hover === i ? "adm-axis-text active" : "adm-axis-text"
                }
              >
                {item.month}
              </text>
              {hover === i && (
                <g>
                  <rect
                    x={Math.min(width - 112, Math.max(5, x - 37))}
                    y={Math.max(2, top + plotH - barH - 37)}
                    width="106"
                    height="28"
                    rx="6"
                    className="adm-tooltip-bg"
                  />
                  <text
                    x={Math.min(width - 59, Math.max(58, x + 16))}
                    y={Math.max(20, top + plotH - barH - 19)}
                    textAnchor="middle"
                    className="adm-tooltip-text"
                  >
                    {item.completed} concluídos
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function LineChart({
  data,
  valueKey,
  mode,
}: {
  data: MonthMetric[];
  valueKey: "revenue" | "appointments";
  mode: "money" | "count";
}) {
  const [hover, setHover] = useState<number | null>(null);
  const vals = data.map((item) => item[valueKey]);
  const max = Math.max(1, ...vals) * 1.12;
  const width = 640,
    height = 250,
    left = 12,
    right = 12,
    top = 22,
    bottom = 37;
  const plotH = height - top - bottom,
    plotW = width - left - right;
  const points = data.map((item, i) => ({
    x: left + (i * plotW) / (data.length - 1),
    y: top + plotH - (item[valueKey] / max) * plotH,
    value: item[valueKey],
    month: item.month,
  }));
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  return (
    <div className="adm-chart-scroll">
      <svg
        className="adm-chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={
          mode === "money" ? "Receita mensal" : "Agendamentos por mês"
        }
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line
              x1={left}
              x2={width - right}
              y1={top + plotH * t}
              y2={top + plotH * t}
              className="adm-grid-line"
            />
            <text x={left} y={top + plotH * t - 5} className="adm-axis-text">
              {mode === "money"
                ? Math.round((max * (1 - t)) / 1000) + "k"
                : Math.round(max * (1 - t))}
            </text>
          </g>
        ))}
        <path d={path} className="adm-line-path" />
        {points.map((p, i) => (
          <g
            key={p.month}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            tabIndex={0}
            role="button"
            aria-label={`${p.month}: ${mode === "money" ? currency(p.value) : p.value + " agendamentos"}`}
          >
            <rect
              x={p.x - 16}
              y={top}
              width={32}
              height={plotH + 10}
              fill="transparent"
            />
            {hover === i && (
              <line
                x1={p.x}
                x2={p.x}
                y1={top}
                y2={top + plotH}
                className="adm-crosshair"
              />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={hover === i ? 5 : 3.5}
              className={hover === i ? "adm-line-dot active" : "adm-line-dot"}
            />
            <text
              x={p.x}
              y={height - 12}
              textAnchor="middle"
              className="adm-axis-text"
            >
              {p.month}
            </text>
            {hover === i && (
              <g>
                <rect
                  x={Math.min(width - 122, Math.max(4, p.x - 50))}
                  y={Math.max(1, p.y - 42)}
                  width="116"
                  height="31"
                  rx="6"
                  className="adm-tooltip-bg"
                />
                <text
                  x={Math.min(width - 64, Math.max(62, p.x + 8))}
                  y={Math.max(21, p.y - 22)}
                  textAnchor="middle"
                  className="adm-tooltip-text"
                >
                  {mode === "money"
                    ? currency(p.value)
                    : number(p.value) + " agend."}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalMessage, setGoalMessage] = useState("");
  const [nav, setNav] = useState("Visão geral");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");
  const [bookingFilter, setBookingFilter] = useState("ALL");
  const [bookingSearch, setBookingSearch] = useState("");

  async function loadDashboard() {
    setLoadingDashboard(true);
    setDashboardError("");
    try {
      const response = await fetch("/api/admin/dashboard", {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.status === 401) {
        await fetch("/api/admin/logout", { method: "POST" }).catch(
          () => undefined,
        );
        setDashboard(null);
        setAuthenticated(false);
        setError(
          "Sua sessão expirou ou não é mais válida. Entre novamente com seu e-mail e senha administrativos.",
        );
        return;
      }
      if (!response.ok)
        throw new Error(data.error ?? "Falha ao carregar o painel.");
      setDashboard(data);
      setGoalDraft(String(data.goal));
    } catch (reason) {
      setDashboardError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível carregar os dados.",
      );
    } finally {
      setLoadingDashboard(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/admin/me", { cache: "no-store" })
      .then((response) => {
        if (active && response.ok) setAuthenticated(true);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (authenticated) void loadDashboard();
  }, [authenticated]);

  async function loadBookings() {
    setBookingsLoading(true);
    setBookingsError("");
    try {
      const response = await fetch("/api/admin/bookings", {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.status === 401) {
        setAuthenticated(false);
        setError("Sua sessão expirou. Entre novamente.");
        return;
      }
      if (!response.ok)
        throw new Error(data.error ?? "Não foi possível carregar a agenda.");
      setBookings(data.bookings ?? []);
    } catch (reason) {
      setBookingsError(
        reason instanceof Error
          ? reason.message
          : "Falha ao carregar os registros.",
      );
    } finally {
      setBookingsLoading(false);
    }
  }

  useEffect(() => {
    if (authenticated && (nav === "Agendamentos" || nav === "Atendimentos"))
      void loadBookings();
  }, [authenticated, nav]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "Não foi possível entrar.");
      setAuthenticated(true);
      setPassword("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Falha ao entrar. Tente novamente.",
      );
    } finally {
      setSending(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setDashboard(null);
    setPassword("");
  }

  async function saveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(goalDraft);
    if (!Number.isFinite(amount) || amount < 0) {
      setGoalMessage("Informe um valor válido.");
      return;
    }
    setSavingGoal(true);
    setGoalMessage("");
    try {
      const response = await fetch("/api/admin/dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: amount }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Não foi possível salvar a meta.");
      setDashboard((current) =>
        current ? { ...current, goal: result.goal } : current,
      );
      setEditingGoal(false);
      setGoalMessage("Meta anual atualizada.");
    } catch (reason) {
      setGoalMessage(
        reason instanceof Error ? reason.message : "Falha ao salvar.",
      );
    } finally {
      setSavingGoal(false);
    }
  }

  const completedTotal = useMemo(
    () => dashboard?.months.reduce((sum, item) => sum + item.completed, 0) ?? 0,
    [dashboard],
  );
  const goalProgress =
    dashboard && dashboard.goal > 0
      ? Math.min(100, (dashboard.summary.forecast / dashboard.goal) * 100)
      : 0;

  if (checking)
    return (
      <main className="admin-page">
        <section className="admin-card">
          <p>Verificando acesso…</p>
        </section>
      </main>
    );

  if (!authenticated)
    return (
      <main className="admin-page">
        <section className="admin-card">
          <div className="admin-mark"><Image src={logo} alt="Logo Nails by Samara" priority sizes="64px" /></div>
          <p className="admin-eyebrow">NAILS BY SAMARA · ÁREA RESTRITA</p>
          <h1>
            Bem-vinda de <em>volta.</em>
          </h1>
          <p className="admin-description">
            Entre com as credenciais administrativas para acessar o Painel ADM.
          </p>
          <form className="admin-form" onSubmit={submit}>
            <label>
              E-mail administrativo
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@seusite.com"
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite sua senha"
              />
            </label>
            {error && (
              <p className="admin-error" role="alert">
                {error}
              </p>
            )}
            <button className="admin-button" type="submit" disabled={sending}>
              {sending ? "Entrando…" : "Entrar no painel"} <span>↗</span>
            </button>
          </form>
          <a className="admin-back" href="/">
            ← Voltar ao site
          </a>
        </section>
      </main>
    );

  return (
    <main className="adm-shell">
      <aside className="adm-sidebar">
        <a href="/" className="adm-brand">
          <span className="adm-brand-mark"><Image src={logo} alt="" aria-hidden="true" sizes="36px" /></span>
          <span>
            <strong>Nails by Samara</strong>
            <small>PAINEL ADM</small>
          </span>
        </a>
        <div className="adm-side-label">MENU PRINCIPAL</div>
        {["Visão geral", "Agendamentos", "Atendimentos", "Financeiro"].map(
          (item, i) => (
            <button
              key={item}
              className={nav === item ? "adm-nav-item active" : "adm-nav-item"}
              onClick={() => {
                if (i < 3) setNav(item);
              }}
              disabled={i === 3}
              title={i === 3 ? "Planejado para uma próxima etapa" : item}
            >
              <span className="adm-nav-icon">{["◫", "▦", "✦", "↗"][i]}</span>
              {item}
              {i === 3 && <small className="adm-nav-soon">Em breve</small>}
            </button>
          ),
        )}
        <div className="adm-sidebar-bottom">
          <div className="adm-diva-avatar">D</div>
          <div className="adm-diva-info">
            <strong>Diva</strong>
            <small>Administradora</small>
          </div>
          <button
            className="adm-logout"
            onClick={logout}
            aria-label="Sair do painel"
            title="Sair"
          >
            ↗
          </button>
        </div>
      </aside>
      <section className="adm-main">
        <header className="adm-topbar">
          <div>
            <span className="adm-breadcrumb">Painel ADM</span>
            <span className="adm-breadcrumb-sep">/</span>
            <strong>{nav}</strong>
          </div>
          <div className="adm-top-actions">
            <span className="adm-live-dot" /> Dados do salão{" "}
            <button
              className="adm-refresh"
              onClick={() => void loadDashboard()}
              disabled={loadingDashboard}
              title="Atualizar dados"
            >
              ↻
            </button>
          </div>
        </header>
        <div className="adm-content">
          {nav === "Visão geral" ? (
            <>
              <div className="adm-welcome-row">
                <div>
                  <p className="adm-eyebrow">
                    {new Intl.DateTimeFormat("pt-BR", {
                      weekday: "long",
                      timeZone: "America/Sao_Paulo",
                    })
                      .format(new Date())
                      .toLocaleUpperCase("pt-BR")}{" "}
                    · NAILS BY SAMARA
                  </p>
                  <h1>
                    Bom te ver, <em>Diva.</em>
                  </h1>
                  <p className="adm-subtitle">
                    Aqui está o resumo do seu negócio em{" "}
                    {dashboard?.year ?? new Date().getFullYear()}.
                  </p>
                </div>
                <button
                  className="adm-date-chip"
                  onClick={() => void loadDashboard()}
                >
                  <span>◷</span> Visão anual <span>⌄</span>
                </button>
              </div>
              {dashboardError && (
                <div className="adm-error-banner">
                  {dashboardError}
                  <button onClick={() => void loadDashboard()}>
                    Tentar novamente
                  </button>
                </div>
              )}
              {loadingDashboard && !dashboard && (
                <div className="adm-loading">
                  Preparando os números do seu salão…
                </div>
              )}
              {dashboard && (
                <>
                  <section className="adm-kpis">
                    <article className="adm-kpi">
                      <div className="adm-kpi-top">
                        <span>Atendimentos hoje</span>
                        <span className="adm-kpi-icon">✦</span>
                      </div>
                      <strong>{number(dashboard.summary.today)}</strong>
                      <small>
                        <b>{dashboard.summary.finishedToday}</b> concluídos hoje
                      </small>
                      <div className="adm-kpi-bottom">Seu dia de trabalho</div>
                    </article>
                    <article className="adm-kpi">
                      <div className="adm-kpi-top">
                        <span>Esta semana</span>
                        <span className="adm-kpi-icon">▦</span>
                      </div>
                      <strong>{number(dashboard.summary.week)}</strong>
                      <small>Agendamentos nesta semana</small>
                      <div className="adm-kpi-bottom">Organize sua agenda</div>
                    </article>
                    <article className="adm-kpi">
                      <div className="adm-kpi-top">
                        <span>Este mês</span>
                        <span className="adm-kpi-icon">◷</span>
                      </div>
                      <strong>{number(dashboard.summary.month)}</strong>
                      <small>Agendamentos no mês</small>
                      <div className="adm-kpi-bottom">Visão mensal</div>
                    </article>
                    <article className="adm-kpi adm-kpi-highlight">
                      <div className="adm-kpi-top">
                        <span>Expectativa anual</span>
                        <span className="adm-kpi-icon">↗</span>
                      </div>
                      <strong>{currency(dashboard.summary.forecast)}</strong>
                      <small>
                        Realizado + agenda futura confirmada/pendente
                      </small>
                      <div className="adm-kpi-bottom">
                        Meta:{" "}
                        {dashboard.goal > 0
                          ? currency(dashboard.goal)
                          : "a definir"}
                      </div>
                    </article>
                  </section>
                  <section className="adm-chart-grid">
                    <article className="adm-panel adm-panel-wide">
                      <div className="adm-panel-heading">
                        <div>
                          <span className="adm-panel-overline">DESEMPENHO</span>
                          <h2>Atendimentos concluídos</h2>
                          <p>Quantidade de serviços finalizados por mês</p>
                        </div>
                        <span className="adm-panel-tag">
                          {completedTotal} no ano
                        </span>
                      </div>
                      <BarChart data={dashboard.months} />
                      <div className="adm-chart-legend">
                        <span className="adm-legend-dot wine" /> Atendimentos
                        concluídos
                      </div>
                    </article>
                    <article className="adm-panel">
                      <div className="adm-panel-heading">
                        <div>
                          <span className="adm-panel-overline">FINANCEIRO</span>
                          <h2>Renda ao longo do ano</h2>
                          <p>Receita de atendimentos concluídos</p>
                        </div>
                      </div>
                      <LineChart
                        data={dashboard.months}
                        valueKey="revenue"
                        mode="money"
                      />
                      <div className="adm-panel-foot">
                        <span>Realizado no ano</span>
                        <strong>{currency(dashboard.summary.revenue)}</strong>
                      </div>
                    </article>
                    <article className="adm-panel">
                      <div className="adm-panel-heading">
                        <div>
                          <span className="adm-panel-overline">AGENDA</span>
                          <h2>Agendamentos</h2>
                          <p>Distribuição de janeiro a dezembro</p>
                        </div>
                      </div>
                      <LineChart
                        data={dashboard.months}
                        valueKey="appointments"
                        mode="count"
                      />
                      <div className="adm-panel-foot">
                        <span>Total no ano</span>
                        <strong>
                          {number(
                            dashboard.months.reduce(
                              (sum, item) => sum + item.appointments,
                              0,
                            ),
                          )}
                        </strong>
                      </div>
                    </article>
                  </section>
                  <section className="adm-lower-grid">
                    <article className="adm-panel adm-goal-panel">
                      <div className="adm-panel-heading">
                        <div>
                          <span className="adm-panel-overline">
                            OBJETIVO DO NEGÓCIO
                          </span>
                          <h2>Meta anual da Diva</h2>
                          <p>
                            Ajuste o valor que deseja alcançar até dezembro.
                          </p>
                        </div>
                        <span className="adm-goal-icon">✧</span>
                      </div>
                      {editingGoal ? (
                        <form className="adm-goal-form" onSubmit={saveGoal}>
                          <label htmlFor="yearly-goal">
                            Meta de faturamento (R$)
                          </label>
                          <div className="adm-goal-input-wrap">
                            <span>R$</span>
                            <input
                              id="yearly-goal"
                              type="number"
                              min="0"
                              step="100"
                              value={goalDraft}
                              onChange={(event) =>
                                setGoalDraft(event.target.value)
                              }
                              required
                            />
                          </div>
                          <div className="adm-goal-actions">
                            <button
                              type="button"
                              className="adm-secondary-btn"
                              onClick={() => {
                                setEditingGoal(false);
                                setGoalDraft(String(dashboard.goal));
                              }}
                            >
                              Cancelar
                            </button>
                            <button
                              className="adm-primary-btn"
                              disabled={savingGoal}
                            >
                              {savingGoal ? "Salvando…" : "Salvar meta"}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="adm-goal-value">
                            {dashboard.goal > 0
                              ? currency(dashboard.goal)
                              : "Defina sua meta"}
                            <button
                              className="adm-edit-btn"
                              onClick={() => {
                                setEditingGoal(true);
                                setGoalMessage("");
                              }}
                            >
                              Editar meta <span>↗</span>
                            </button>
                          </div>
                          <div className="adm-progress-label">
                            <span>Progresso da expectativa anual</span>
                            <strong>
                              {dashboard.goal > 0
                                ? Math.round(goalProgress) + "%"
                                : "—"}
                            </strong>
                          </div>
                          <div className="adm-progress-track">
                            <div
                              className="adm-progress-fill"
                              style={{ width: goalProgress + "%" }}
                            />
                          </div>
                          <div className="adm-goal-foot">
                            <span>Expectativa atual</span>
                            <strong>
                              {currency(dashboard.summary.forecast)}
                            </strong>
                          </div>
                        </>
                      )}
                      {goalMessage && (
                        <p className="adm-goal-message" role="status">
                          {goalMessage}
                        </p>
                      )}
                    </article>
                    <article className="adm-panel adm-recent-panel">
                      <div className="adm-panel-heading">
                        <div>
                          <span className="adm-panel-overline">
                            ACOMPANHAMENTO
                          </span>
                          <h2>Agendamentos recentes</h2>
                          <p>Últimos registros do calendário</p>
                        </div>
                        <button
                          className="adm-link-btn"
                          onClick={() => setNav("Agendamentos")}
                        >
                          Ver agenda ↗
                        </button>
                      </div>
                      {dashboard.recent.length === 0 ? (
                        <div className="adm-empty">
                          Ainda não há agendamentos neste ano.
                        </div>
                      ) : (
                        <div className="adm-table-wrap">
                          <table className="adm-table">
                            <thead>
                              <tr>
                                <th>Cliente</th>
                                <th>Serviço</th>
                                <th>Data</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashboard.recent.map((item) => (
                                <tr key={item.id}>
                                  <td>
                                    <strong>{item.customerName}</strong>
                                    <small>{item.whatsapp}</small>
                                  </td>
                                  <td>{item.service}</td>
                                  <td>
                                    {new Intl.DateTimeFormat("pt-BR", {
                                      day: "2-digit",
                                      month: "short",
                                      timeZone: "America/Sao_Paulo",
                                    }).format(new Date(item.date))}
                                  </td>
                                  <td>
                                    <span
                                      className={`adm-status-pill ${item.status.toLowerCase()}`}
                                    >
                                      {statusLabel[item.status] ?? item.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </article>
                  </section>
                  <p className="adm-footnote">
                    Valores calculados a partir dos agendamentos salvos. A
                    expectativa considera receita concluída e agenda futura
                    pendente ou confirmada; cancelamentos não entram nos
                    indicadores.
                  </p>
                </>
              )}
            </>
          ) : nav === "Agendamentos" ? (
            <>
              <div className="adm-welcome-row">
                <div>
                  <p className="adm-eyebrow">AGENDA · NAILS BY SAMARA</p>
                  <h1>
                    Seus <em>agendamentos.</em>
                  </h1>
                  <p className="adm-subtitle">
                    Acompanhe os próximos horários, os pedidos pendentes e os
                    detalhes de cada cliente.
                  </p>
                </div>
                <button
                  className="adm-date-chip"
                  onClick={() => void loadBookings()}
                  disabled={bookingsLoading}
                >
                  ↻ Atualizar agenda
                </button>
              </div>
              {bookingsError && (
                <div className="adm-error-banner">
                  {bookingsError}
                  <button onClick={() => void loadBookings()}>
                    Tentar novamente
                  </button>
                </div>
              )}
              <div className="adm-list-toolbar">
                <label>
                  Buscar cliente ou WhatsApp
                  <input
                    value={bookingSearch}
                    onChange={(event) => setBookingSearch(event.target.value)}
                    placeholder="Nome ou telefone"
                  />
                </label>
                <label>
                  Filtrar status
                  <select
                    value={bookingFilter}
                    onChange={(event) => setBookingFilter(event.target.value)}
                  >
                    <option value="ALL">Todos os status</option>
                    <option value="PENDING">Pendentes</option>
                    <option value="CONFIRMED">Confirmados</option>
                    <option value="COMPLETED">Concluídos</option>
                    <option value="CANCELLED">Cancelados</option>
                  </select>
                </label>
              </div>
              {bookingsLoading ? (
                <div className="adm-loading">Carregando agenda…</div>
              ) : (
                <div className="adm-panel adm-list-panel">
                  <div className="adm-panel-heading">
                    <div>
                      <span className="adm-panel-overline">
                        CALENDÁRIO DO SALÃO
                      </span>
                      <h2>Agenda completa</h2>
                      <p>
                        {
                          bookings.filter(
                            (item) =>
                              item.status === "PENDING" ||
                              item.status === "CONFIRMED",
                          ).length
                        }{" "}
                        horários pendentes ou confirmados
                      </p>
                    </div>
                    <span className="adm-panel-tag">
                      {bookings.length} registros
                    </span>
                  </div>
                  {(() => {
                    const rows = bookings.filter(
                      (item) =>
                        (bookingFilter === "ALL" ||
                          item.status === bookingFilter) &&
                        (item.customerName
                          .toLowerCase()
                          .includes(bookingSearch.toLowerCase()) ||
                          item.whatsapp.includes(bookingSearch)),
                    );
                    return rows.length ? (
                      <div className="adm-table-wrap">
                        <table className="adm-table adm-wide-table">
                          <thead>
                            <tr>
                              <th>Cliente</th>
                              <th>Serviço</th>
                              <th>Data e hora</th>
                              <th>Local</th>
                              <th>Valor</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((item) => (
                              <tr key={item.id}>
                                <td>
                                  <strong>{item.customerName}</strong>
                                  <small>{item.whatsapp}</small>
                                  {item.address && (
                                    <small>{item.address}</small>
                                  )}
                                </td>
                                <td>
                                  {
                                    {
                                      HAND: "Mão",
                                      FOOT: "Pé",
                                      BOTH: "Mão + pé",
                                    }[item.service]
                                  }
                                </td>
                                <td>
                                  {new Intl.DateTimeFormat("pt-BR", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    timeZone: "America/Sao_Paulo",
                                  }).format(new Date(item.startAt))}
                                </td>
                                <td>
                                  {item.location === "HOME"
                                    ? "Domicílio"
                                    : "Salão"}
                                </td>
                                <td>{currency(item.totalPrice / 100)}</td>
                                <td>
                                  <span
                                    className={`adm-status-pill ${item.status.toLowerCase()}`}
                                  >
                                    {statusLabel[item.status]}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="adm-empty">
                        Nenhum agendamento corresponde aos filtros.
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="adm-welcome-row">
                <div>
                  <p className="adm-eyebrow">
                    RELACIONAMENTO · NAILS BY SAMARA
                  </p>
                  <h1>
                    Fidelidade das <em>clientes.</em>
                  </h1>
                  <p className="adm-subtitle">
                    Histórico de serviços concluídos e frequência de retorno de
                    cada cliente.
                  </p>
                </div>
                <button
                  className="adm-date-chip"
                  onClick={() => void loadBookings()}
                  disabled={bookingsLoading}
                >
                  ↻ Atualizar dados
                </button>
              </div>
              {bookingsError && (
                <div className="adm-error-banner">
                  {bookingsError}
                  <button onClick={() => void loadBookings()}>
                    Tentar novamente
                  </button>
                </div>
              )}
              {(() => {
                const done = bookings.filter(
                  (item) => item.status === "COMPLETED",
                );
                const customers = new Map<
                  string,
                  {
                    name: string;
                    whatsapp: string;
                    count: number;
                    total: number;
                    last: string;
                    services: string[];
                  }
                >();
                done.forEach((item) => {
                  const key =
                    item.whatsapp.replace(/\D/g, "") ||
                    item.customerName.trim().toLowerCase();
                  const entry = customers.get(key) ?? {
                    name: item.customerName,
                    whatsapp: item.whatsapp,
                    count: 0,
                    total: 0,
                    last: item.startAt,
                    services: [],
                  };
                  entry.count++;
                  entry.total += item.totalPrice;
                  entry.services.push(
                    { HAND: "Mão", FOOT: "Pé", BOTH: "Mão + pé" }[item.service],
                  );
                  if (item.startAt > entry.last) entry.last = item.startAt;
                  customers.set(key, entry);
                });
                const ordered = [...customers.values()].sort(
                  (a, b) => b.count - a.count || b.last.localeCompare(a.last),
                );
                const totalDone = done.length;
                const average = ordered.length ? totalDone / ordered.length : 0;
                return (
                  <>
                    <section className="adm-kpis adm-loyalty-kpis">
                      <article className="adm-kpi">
                        <div className="adm-kpi-top">
                          <span>Clientes atendidas</span>
                          <span className="adm-kpi-icon">♡</span>
                        </div>
                        <strong>{number(ordered.length)}</strong>
                        <small>Com pelo menos um serviço concluído</small>
                      </article>
                      <article className="adm-kpi">
                        <div className="adm-kpi-top">
                          <span>Serviços concluídos</span>
                          <span className="adm-kpi-icon">✦</span>
                        </div>
                        <strong>{number(totalDone)}</strong>
                        <small>Registros finalizados no histórico</small>
                      </article>
                      <article className="adm-kpi">
                        <div className="adm-kpi-top">
                          <span>Média por cliente</span>
                          <span className="adm-kpi-icon">↻</span>
                        </div>
                        <strong>
                          {average.toLocaleString("pt-BR", {
                            maximumFractionDigits: 1,
                          })}
                        </strong>
                        <small>Serviços concluídos por cliente</small>
                      </article>
                      <article className="adm-kpi adm-kpi-highlight">
                        <div className="adm-kpi-top">
                          <span>Clientes recorrentes</span>
                          <span className="adm-kpi-icon">♥</span>
                        </div>
                        <strong>
                          {number(
                            ordered.filter((item) => item.count > 1).length,
                          )}
                        </strong>
                        <small>Voltaram para mais de um atendimento</small>
                      </article>
                    </section>
                    <div className="adm-list-toolbar">
                      <label>
                        Buscar cliente ou WhatsApp
                        <input
                          value={bookingSearch}
                          onChange={(event) =>
                            setBookingSearch(event.target.value)
                          }
                          placeholder="Nome ou telefone"
                        />
                      </label>
                    </div>
                    <section className="adm-panel adm-list-panel">
                      <div className="adm-panel-heading">
                        <div>
                          <span className="adm-panel-overline">
                            CARTEIRA DE CLIENTES
                          </span>
                          <h2>Histórico de fidelidade</h2>
                          <p>Ordenado por número de atendimentos concluídos</p>
                        </div>
                      </div>
                      {bookingsLoading ? (
                        <div className="adm-loading">Carregando histórico…</div>
                      ) : ordered.filter(
                          (item) =>
                            item.name
                              .toLowerCase()
                              .includes(bookingSearch.toLowerCase()) ||
                            item.whatsapp.includes(bookingSearch),
                        ).length ? (
                        <div className="adm-table-wrap">
                          <table className="adm-table adm-wide-table">
                            <thead>
                              <tr>
                                <th>Cliente</th>
                                <th>Atendimentos</th>
                                <th>Serviços realizados</th>
                                <th>Último atendimento</th>
                                <th>Total histórico</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ordered
                                .filter(
                                  (item) =>
                                    item.name
                                      .toLowerCase()
                                      .includes(bookingSearch.toLowerCase()) ||
                                    item.whatsapp.includes(bookingSearch),
                                )
                                .map((item) => (
                                  <tr key={item.whatsapp}>
                                    <td>
                                      <strong>{item.name}</strong>
                                      <small>{item.whatsapp}</small>
                                    </td>
                                    <td>
                                      <span className="adm-loyalty-count">
                                        {item.count}{" "}
                                        {item.count === 1
                                          ? "visita"
                                          : "visitas"}
                                      </span>
                                      <small>
                                        {item.count > 1
                                          ? "Cliente recorrente"
                                          : "Primeiro atendimento concluído"}
                                      </small>
                                    </td>
                                    <td>{item.services.join(", ")}</td>
                                    <td>
                                      {new Intl.DateTimeFormat("pt-BR", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                        timeZone: "America/Sao_Paulo",
                                      }).format(new Date(item.last))}
                                    </td>
                                    <td>{currency(item.total / 100)}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="adm-empty">
                          Ainda não existem atendimentos concluídos para
                          mostrar.
                        </div>
                      )}
                    </section>
                    <section className="adm-panel adm-list-panel">
                      <div className="adm-panel-heading">
                        <div>
                          <span className="adm-panel-overline">
                            HISTÓRICO DETALHADO
                          </span>
                          <h2>Atendimentos concluídos</h2>
                          <p>Registro individual de cada serviço finalizado</p>
                        </div>
                      </div>
                      {done.length ? (
                        <div className="adm-table-wrap">
                          <table className="adm-table adm-wide-table">
                            <thead>
                              <tr>
                                <th>Cliente</th>
                                <th>Serviço</th>
                                <th>Data</th>
                                <th>Local</th>
                                <th>Valor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...done]
                                .sort((a, b) =>
                                  b.startAt.localeCompare(a.startAt),
                                )
                                .map((item) => (
                                  <tr key={item.id}>
                                    <td>
                                      <strong>{item.customerName}</strong>
                                      <small>{item.whatsapp}</small>
                                    </td>
                                    <td>
                                      {
                                        {
                                          HAND: "Mão",
                                          FOOT: "Pé",
                                          BOTH: "Mão + pé",
                                        }[item.service]
                                      }
                                    </td>
                                    <td>
                                      {new Intl.DateTimeFormat("pt-BR", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        timeZone: "America/Sao_Paulo",
                                      }).format(new Date(item.startAt))}
                                    </td>
                                    <td>
                                      {item.location === "HOME"
                                        ? "Domicílio"
                                        : "Salão"}
                                    </td>
                                    <td>{currency(item.totalPrice / 100)}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="adm-empty">
                          Nenhum atendimento concluído até agora.
                        </div>
                      )}
                    </section>
                  </>
                );
              })()}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
