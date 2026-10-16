"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível entrar.");
      router.replace("/minha-conta");
      router.refresh();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card auth-card">
        <Link className="booking-back" href="/">← Voltar ao início</Link>
        <div className="login-monogram" aria-hidden="true">S</div>
        <p className="eyebrow">NAILS BY SAMARA</p>
        <h1>Que bom ter<br /><em>você por aqui.</em></h1>
        <p className="login-description">Acesse sua conta para consultar seus agendamentos e deixar seus próximos atendimentos mais práticos. Preencha seus dados abaixo para continuar.</p>
        <form className="login-form" onSubmit={submit}>
          <label className="booking-field">E-mail
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" autoComplete="email" />
          </label>
          <label className="booking-field">Senha
            <span className="auth-password-wrap">
              <input type={showPassword ? "text" : "password"} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Digite sua senha" autoComplete="current-password" />
              <button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? "Ocultar" : "Mostrar"}</button>
            </span>
          </label>
          <button className="button button--primary booking-submit" type="submit" disabled={sending}>{sending ? "Entrando…" : "Entrar"} <span aria-hidden="true">↗</span></button>
          {message && <p className="booking-feedback" role="status">{message}</p>}
        </form>
        <p className="auth-switch">Ainda não tem uma conta? <Link href="/cadastro">Criar conta</Link></p>
        <div className="login-divider"><span>ou</span></div>
        <Link className="button button--secondary booking-submit" href="/agendamento">Agendar sem cadastro</Link>
        <p className="login-note">Acesse sua conta para consultar seus agendamentos e acompanhar sua fidelidade. Você também pode agendar sem cadastro.</p>
      </section>
    </main>
  );
}
