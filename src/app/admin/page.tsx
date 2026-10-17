"use client";

import { FormEvent, useEffect, useState } from "react";

export default function AdminPage() {
  const [email, setEmail] = useState("adm@adm.com");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/me", { cache: "no-store" })
      .then((response) => { if (active && response.ok) setAuthenticated(true); })
      .catch(() => {})
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível entrar.");
      setAuthenticated(true);
      setPassword("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao entrar. Tente novamente.");
    } finally { setSending(false); }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setPassword("");
  }

  if (checking) return <main className="admin-page"><section className="admin-card"><p>Verificando acesso…</p></section></main>;

  return (
    <main className="admin-page">
      <section className="admin-card">
        <div className="admin-mark">S</div>
        <p className="admin-eyebrow">NAILS BY SAMARA · ÁREA RESTRITA</p>
        {authenticated ? (
          <>
            <h1>Painel <em>administrativo</em></h1>
            <p className="admin-description">Você entrou na área administrativa. A autenticação está pronta para receber o gerenciamento de agendamentos, clientes e serviços.</p>
            <div className="admin-status"><span /> Sessão administrativa ativa</div>
            <button className="admin-button" onClick={logout} type="button">Sair do painel</button>
          </>
        ) : (
          <>
            <h1>Bem-vinda de <em>volta.</em></h1>
            <p className="admin-description">Entre com as credenciais administrativas para continuar.</p>
            <form className="admin-form" onSubmit={submit}>
              <label>E-mail administrativo
                <input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="adm@adm.com" />
              </label>
              <label>Senha
                <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Digite sua senha" />
              </label>
              {error && <p className="admin-error" role="alert">{error}</p>}
              <button className="admin-button" type="submit" disabled={sending}>{sending ? "Entrando…" : "Entrar no painel"} <span>↗</span></button>
            </form>
          </>
        )}
        <a className="admin-back" href="/">← Voltar ao site</a>
      </section>
    </main>
  );
}
