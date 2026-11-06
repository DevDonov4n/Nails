"use client";

import "./admin.css";
import Image from "next/image";
import logo from "@/assets/logo.jpg";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { BarChart, LineChart } from "@/components/admin/AdminCharts";
import EventsFeaturesPanel from "@/components/admin/EventsFeaturesPanel";

type MonthMetric = {
  month: string;
  revenue: number;
  expenses: number;
  netProfit: number;
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
  loyaltyDiscount: number;
  promotionalDiscount: number;
  userId: string | null;
  paymentMethod: string | null;
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
    expenses: number;
    netProfit: number;
    averageMonthlyProfit: number;
    projectedProfit: number;
    finishedToday: number;
  };
  months: MonthMetric[];
  recent: RecentBooking[];
  expenses: ExpenseRecord[];
};
type ExpenseRecord = { id: string; amount: number; category: string; description: string; occurredAt: string };

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
  const [paymentModalBooking, setPaymentModalBooking] = useState<AdminBooking | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("PIX");
  const [completingBooking, setCompletingBooking] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("MATERIAL_NOVO");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseMessage, setExpenseMessage] = useState("");

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

  async function updateBookingStatus(id: string, status: "CONFIRMED" | "CANCELLED" | "COMPLETED", paymentMethod?: string) {
    const action = status === "CONFIRMED" ? "confirmar" : status === "COMPLETED" ? "concluir este atendimento" : "recusar";
    const confirmed = window.confirm(`Deseja ${action} este agendamento?`);
    if (!confirmed) return;
    setBookingsError("");
    try {
      const response = await fetch(`/api/admin/bookings/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...(paymentMethod ? { paymentMethod } : {}) }),
      });
      const data = await response.json();
      if (response.status === 401) {
        setAuthenticated(false);
        setError("Sua sessão expirou. Entre novamente.");
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "Não foi possível atualizar o agendamento.");
      setPaymentModalBooking(null);
      await loadBookings();
      await loadDashboard();
    } catch (reason) {
      setBookingsError(reason instanceof Error ? reason.message : "Falha ao atualizar o agendamento.");
    }
  }

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

  async function saveExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (savingExpense) return;
    const amount = Number(expenseAmount.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) { setExpenseMessage("Informe um valor maior que zero."); return; }
    if (expenseDescription.trim().length < 5) { setExpenseMessage("Justifique a saída com pelo menos 5 caracteres."); return; }
    setSavingExpense(true); setExpenseMessage("");
    try {
      const response = await fetch("/api/admin/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount, category: expenseCategory, description: expenseDescription.trim() }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Não foi possível registrar a saída.");
      setExpenseAmount(""); setExpenseDescription(""); setExpenseMessage("Saída registrada com sucesso."); await loadDashboard();
    } catch (reason) { setExpenseMessage(reason instanceof Error ? reason.message : "Falha ao registrar a saída."); }
    finally { setSavingExpense(false); }
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
        {["Visão geral", "Agendamentos", "Atendimentos", "Financeiro", "Eventos e Funcionalidades"].map(
          (item, i) => (
            <button
              key={item}
              className={nav === item ? "adm-nav-item active" : "adm-nav-item"}
              onClick={() => {
                setNav(item);
              }}
              disabled={false}
            >
              <span className="adm-nav-icon">{["◫", "▦", "✦", "↗", "⚙"][i]}</span>
              {item}

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
        {paymentModalBooking && (
          <div className="adm-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !completingBooking) setPaymentModalBooking(null); }}>
            <section className="adm-payment-modal" role="dialog" aria-modal="true" aria-labelledby="adm-payment-title">
              <button type="button" className="adm-modal-close" aria-label="Fechar" disabled={completingBooking} onClick={() => setPaymentModalBooking(null)}>×</button>
              <span className="adm-panel-overline">FINALIZAR ATENDIMENTO</span>
              <h2 id="adm-payment-title">Como a cliente pagou?</h2>
              <p>Selecione a forma de pagamento de <strong>{paymentModalBooking.customerName}</strong> antes de concluir o serviço.</p>
              <div className="adm-payment-options">
                {([{value:"PIX",label:"Pix",icon:"◇"},{value:"CASH",label:"Dinheiro",icon:"＄"},{value:"CARD",label:"Cartão",icon:"▣"},{value:"OTHER",label:"Outro",icon:"＋"}]).map((option) => (
                  <button key={option.value} type="button" className={selectedPaymentMethod === option.value ? "adm-payment-option selected" : "adm-payment-option"} aria-pressed={selectedPaymentMethod === option.value} onClick={() => setSelectedPaymentMethod(option.value)}>
                    <span>{option.icon}</span>{option.label}{selectedPaymentMethod === option.value && <b>✓</b>}
                  </button>
                ))}
              </div>
              <div className="adm-payment-modal-actions">
                <button type="button" className="adm-secondary-btn" disabled={completingBooking} onClick={() => setPaymentModalBooking(null)}>Cancelar</button>
                <button type="button" className="adm-primary-btn" disabled={completingBooking || !selectedPaymentMethod} onClick={async () => { if (!paymentModalBooking) return; setCompletingBooking(true); try { await updateBookingStatus(paymentModalBooking.id, "COMPLETED", selectedPaymentMethod); } finally { setCompletingBooking(false); } }}>{completingBooking ? "Concluindo…" : "✓ Confirmar conclusão"}</button>
              </div>
            </section>
          </div>
        )}
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
          ) : nav === "Financeiro" ? (
            <>
              <div className="adm-welcome-row"><div><p className="adm-eyebrow">CONTROLE FINANCEIRO · NAILS BY SAMARA</p><h1>Seu <em>financeiro.</em></h1><p className="adm-subtitle">Acompanhe entradas, despesas e a evolução do lucro do salão.</p></div><button className="adm-date-chip" onClick={() => void loadDashboard()} disabled={loadingDashboard}>↻ Atualizar dados</button></div>
              {dashboardError && <div className="adm-error-banner">{dashboardError}<button onClick={() => void loadDashboard()}>Tentar novamente</button></div>}
              {dashboard && <>
                <section className="adm-kpis adm-finance-kpis">
                  <article className="adm-kpi"><div className="adm-kpi-top">Entradas recebidas</div><strong>{currency(dashboard.summary.revenue)}</strong><small>Atendimentos concluídos em {dashboard.year}</small></article>
                  <article className="adm-kpi"><div className="adm-kpi-top">Saídas registradas</div><strong>{currency(dashboard.summary.expenses)}</strong><small>Despesas lançadas no ano</small></article>
                  <article className="adm-kpi adm-kpi-highlight"><div className="adm-kpi-top">Lucro líquido atual</div><strong>{currency(dashboard.summary.netProfit)}</strong><small>Entradas menos saídas</small></article>
                  <article className="adm-kpi"><div className="adm-kpi-top">Projeção até dezembro</div><strong>{currency(dashboard.summary.projectedProfit)}</strong><small>Média mensal líquida: {currency(dashboard.summary.averageMonthlyProfit)}</small></article>
                </section>
                <section className="adm-chart-grid">
                  <article className="adm-panel"><div className="adm-panel-heading"><div><span className="adm-panel-overline">DESEMPENHO</span><h2>Entradas mensais</h2><p>Receita dos atendimentos concluídos</p></div></div><LineChart data={dashboard.months} valueKey="revenue" mode="money" /><div className="adm-panel-foot"><span>Total recebido</span><strong>{currency(dashboard.summary.revenue)}</strong></div></article>
                  <article className="adm-panel"><div className="adm-panel-heading"><div><span className="adm-panel-overline">DESPESAS</span><h2>Saídas mensais</h2><p>Despesas registradas ao longo do ano</p></div></div><LineChart data={dashboard.months} valueKey="expenses" mode="money" /><div className="adm-panel-foot"><span>Total de saídas</span><strong>{currency(dashboard.summary.expenses)}</strong></div></article>
                  <article className="adm-panel adm-panel-wide"><div className="adm-panel-heading"><div><span className="adm-panel-overline">RESULTADO</span><h2>Lucro líquido mensal</h2><p>Entradas menos despesas em cada mês</p></div></div><LineChart data={dashboard.months} valueKey="netProfit" mode="money" /><div className="adm-finance-projection"><span>Projeção de lucro líquido até dezembro</span><strong>{currency(dashboard.summary.projectedProfit)}</strong><small>Estimativa baseada na média mensal líquida acumulada até agora, mantendo o ritmo atual. Não inclui atendimentos futuros ainda não realizados.</small></div></article>
                </section>
                <section className="adm-finance-grid">
                  <article className="adm-panel"><div className="adm-panel-heading"><div><span className="adm-panel-overline">NOVO LANÇAMENTO</span><h2>Registrar saída</h2><p>Valor, categoria e justificativa são obrigatórios.</p></div></div>
                    <form className="adm-expense-form" onSubmit={saveExpense}>
                      <label>Valor da saída (R$)<input type="number" min="0.01" step="0.01" placeholder="Ex.: 85,00" value={expenseAmount} onChange={event => setExpenseAmount(event.target.value)} required /></label>
                      <label>Categoria<select value={expenseCategory} onChange={event => setExpenseCategory(event.target.value)}><option value="MATERIAL_NOVO">Compra de material novo</option><option value="REPOSICAO">Reposição</option><option value="URGENCIA">Urgência</option><option value="MANUTENCAO">Manutenção</option><option value="OUTROS">Outros</option></select></label>
                      <label>Justificativa obrigatória<textarea value={expenseDescription} onChange={event => setExpenseDescription(event.target.value)} minLength={5} maxLength={500} rows={4} placeholder="Descreva o motivo: compra de esmaltes, reposição de lixas…" required /></label>
                      <button className="adm-primary-btn" disabled={savingExpense}>{savingExpense ? "Registrando…" : "＋ Registrar saída"}</button>{expenseMessage && <p className="adm-goal-message" role="status">{expenseMessage}</p>}
                    </form>
                  </article>
                  <article className="adm-panel"><div className="adm-panel-heading"><div><span className="adm-panel-overline">HISTÓRICO DE DESPESAS</span><h2>Saídas registradas</h2><p>Consulte os gastos e justificativas.</p></div><span className="adm-panel-tag">{dashboard.expenses.length} lançamentos</span></div>
                    {dashboard.expenses.length ? <div className="adm-expense-list">{dashboard.expenses.map(item => <div className="adm-expense-item" key={item.id}><div><strong>{({ MATERIAL_NOVO: "Compra de material novo", REPOSICAO: "Reposição", URGENCIA: "Urgência", MANUTENCAO: "Manutenção", OUTROS: "Outros" } as Record<string,string>)[item.category] ?? item.category}</strong><p>{item.description}</p><small>{new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short",year:"numeric",timeZone:"America/Sao_Paulo"}).format(new Date(item.occurredAt))}</small></div><b>{currency(item.amount)}</b></div>)}</div> : <div className="adm-empty">Nenhuma saída registrada neste ano.</div>}
                  </article>
                </section>
              </>}
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
                              <th>Ações</th>
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
                                <td>{currency(item.totalPrice / 100)}{item.loyaltyDiscount > 0 && <small className="adm-discount-note">−{currency(item.loyaltyDiscount / 100)} fidelidade</small>}{item.promotionalDiscount > 0 && <small className="adm-discount-note">−{currency(item.promotionalDiscount / 100)} promoção</small>}</td>
                                <td>
                                  <span
                                    className={`adm-status-pill ${item.status.toLowerCase()}`}
                                  >
                                    {statusLabel[item.status]}
                                  </span>
                                </td>
                                <td>
                                  {item.status === "PENDING" ? (
                                    <div className="adm-booking-actions">
                                      <button type="button" className="adm-booking-action adm-booking-action--approve" onClick={() => void updateBookingStatus(item.id, "CONFIRMED")}>Aprovar</button>
                                      <button type="button" className="adm-booking-action adm-booking-action--reject" onClick={() => void updateBookingStatus(item.id, "CANCELLED")}>Recusar</button>
                                    </div>
                                  ) : item.status === "CONFIRMED" ? <a className="adm-booking-action adm-booking-action--approve" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${(item.whatsapp.replace(/\D/g, "").startsWith("55") ? item.whatsapp.replace(/\D/g, "") : `55${item.whatsapp.replace(/\D/g, "")}`)}?text=${encodeURIComponent(`Oi, ${item.customerName}! Tudo bem? Seu horário está confirmado. Passando para saber se está tudo certo e se você está preparada para o atendimento. 💗`)}`}>WhatsApp ↗</a> : <span className="adm-muted">—</span>}
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
              <section className="adm-panel adm-list-panel">
                <div className="adm-panel-heading">
                  <div>
                    <span className="adm-panel-overline">AGENDA CONFIRMADA</span>
                    <h2>Atendimentos a realizar</h2>
                    <p>Quando o serviço terminar, marque-o como concluído para atualizar o histórico e a fidelidade da cliente</p>
                  </div>
                  <span className="adm-panel-tag">{bookings.filter((item) => item.status === "CONFIRMED").length} confirmados</span>
                </div>
                {bookingsLoading ? (
                  <div className="adm-loading">Carregando atendimentos…</div>
                ) : bookings.filter((item) => item.status === "CONFIRMED").length ? (
                  <div className="adm-table-wrap">
                    <table className="adm-table adm-wide-table">
                      <thead><tr><th>Cliente</th><th>Serviço</th><th>Data e hora</th><th>Local</th><th>Valor</th><th>Ação</th></tr></thead>
                      <tbody>
                        {bookings.filter((item) => item.status === "CONFIRMED").sort((a, b) => a.startAt.localeCompare(b.startAt)).map((item) => (
                          <tr key={item.id}>
                            <td><strong>{item.customerName}</strong><small>{item.whatsapp}</small></td>
                            <td>{{ HAND: "Mão", FOOT: "Pé", BOTH: "Mão + pé" }[item.service]}</td>
                            <td>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(item.startAt))}</td>
                            <td>{item.location === "HOME" ? "Domicílio" : "Salão"}</td>
                            <td>{currency(item.totalPrice / 100)}</td>
                            <td>{item.status === "COMPLETED" ? <span className="adm-completed-mark" title="Atendimento concluído">✅ Concluído</span> : <button type="button" className="adm-booking-action adm-booking-action--approve adm-complete-trigger" aria-label={`Concluir atendimento de ${item.customerName}`} onClick={() => { setPaymentModalBooking(item); setSelectedPaymentMethod("PIX"); }}>☑️ <span>Concluir</span></button>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="adm-empty">Não há atendimentos confirmados aguardando conclusão.</div>
                )}
              </section>
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
                                <th>Pagamento</th>
                                <th>Valor</th>
                                <th>Status</th>
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
                                    <td>{item.paymentMethod ? ({ PIX: "Pix", CASH: "Dinheiro", CARD: "Cartão", OTHER: "Outro" }[item.paymentMethod] ?? item.paymentMethod) : "Não informado"}</td>
                                    <td>{currency(item.totalPrice / 100)}</td>
                                    <td><span className="adm-completed-mark">✅ Concluído</span></td>
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
          ) : nav === "Eventos e Funcionalidades" ? (
            <EventsFeaturesPanel />
          ) : null}
        </div>
      </section>
    </main>
  );
}
