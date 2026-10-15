"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("O acesso por conta ainda não foi ativado. Você já pode agendar sem cadastro.");
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <Link className="booking-back" href="/">← Voltar ao início</Link>
        <div className="login-monogram" aria-hidden="true">S</div>
        <p className="eyebrow">NAILS BY SAMARA</p>
        <h1>Que bom ter<br /><em>você por aqui.</em></h1>
        <p className="login-description">Entre na sua conta para acompanhar seus cuidados e agendamentos.</p>
        <form className="login-form" onSubmit={submit}>
          <label className="booking-field">E-mail<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" autoComplete="email" /></label>
          <label className="booking-field">Senha<input type="password" required minLength={6} placeholder="Sua senha" autoComplete="current-password" /></label>
          <button className="button button--primary booking-submit" type="submit">Entrar ↗</button>
          {message && <p className="booking-feedback" role="status">{message}</p>}
        </form>
        <div className="login-divider"><span>ou</span></div>
        <Link className="button button--secondary booking-submit" href="/agendamento">Agendar sem cadastro</Link>
        <p className="login-note">A autenticação de clientes será ativada em uma próxima etapa. Por enquanto, reserve seu horário sem criar conta.</p>
      </section>
    </main>
  );
}
