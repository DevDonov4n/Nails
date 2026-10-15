"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("O login ainda não está conectado a um sistema de autenticação. Você pode agendar sem cadastro.");
  }

  return (
    <main className="login-page">
      <section className="login-card auth-card">
        <Link className="booking-back" href="/">← Voltar ao início</Link>
        <div className="login-monogram" aria-hidden="true">S</div>
        <p className="eyebrow">NAILS BY SAMARA</p>
        <h1>Que bom ter<br /><em>você por aqui.</em></h1>
        <p className="login-description">Entre na sua conta para acompanhar seus cuidados e agendamentos.</p>
        <form className="login-form" onSubmit={submit}>
          <label className="booking-field">E-mail
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" autoComplete="email" />
          </label>
          <label className="booking-field">Senha
            <span className="auth-password-wrap">
              <input type={showPassword ? "text" : "password"} required minLength={6} placeholder="Digite sua senha" autoComplete="current-password" />
              <button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? "Ocultar" : "Mostrar"}</button>
            </span>
          </label>
          <button className="button button--primary booking-submit" type="submit">Entrar <span aria-hidden="true">↗</span></button>
          {message && <p className="booking-feedback" role="status">{message}</p>}
        </form>
        <p className="auth-switch">Ainda não tem uma conta? <Link href="/cadastro">Criar conta</Link></p>
        <div className="login-divider"><span>ou</span></div>
        <Link className="button button--secondary booking-submit" href="/agendamento">Agendar sem cadastro</Link>
        <p className="login-note">O acesso à conta ainda está em preparação. Por enquanto, você pode reservar seu horário sem cadastro.</p>
      </section>
    </main>
  );
}
