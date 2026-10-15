"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function CadastroPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirmPassword")) {
      setMessage("As senhas não coincidem. Confira os campos e tente novamente.");
      return;
    }
    setMessage("A criação de contas ainda não está ativada. Seus dados não foram enviados nem salvos.");
  }

  return (
    <main className="login-page">
      <section className="login-card auth-card auth-card--signup">
        <Link className="booking-back" href="/">← Voltar ao início</Link>
        <div className="login-monogram" aria-hidden="true">S</div>
        <p className="eyebrow">NAILS BY SAMARA</p>
        <h1>Seu cuidado,<br /><em>em um só lugar.</em></h1>
        <p className="login-description">Crie sua conta para ter seus dados prontos e acompanhar seus agendamentos.</p>
        <form className="login-form" onSubmit={submit}>
          <label className="booking-field">Nome completo
            <input name="name" type="text" required minLength={2} placeholder="Como podemos te chamar?" autoComplete="name" />
          </label>
          <label className="booking-field">E-mail
            <input name="email" type="email" required placeholder="voce@email.com" autoComplete="email" />
          </label>
          <label className="booking-field">WhatsApp
            <input name="whatsapp" type="tel" required minLength={8} placeholder="(11) 99999-9999" autoComplete="tel" />
          </label>
          <label className="booking-field">Senha
            <span className="auth-password-wrap">
              <input name="password" type={showPassword ? "text" : "password"} required minLength={8} placeholder="Crie uma senha (mín. 8 caracteres)" autoComplete="new-password" />
              <button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? "Ocultar" : "Mostrar"}</button>
            </span>
          </label>
          <label className="booking-field">Confirmar senha
            <input name="confirmPassword" type={showPassword ? "text" : "password"} required minLength={8} placeholder="Digite a senha novamente" autoComplete="new-password" />
          </label>
          <button className="button button--primary booking-submit" type="submit">Criar minha conta <span aria-hidden="true">↗</span></button>
          {message && <p className="booking-feedback" role="status">{message}</p>}
        </form>
        <p className="auth-switch">Já tem uma conta? <Link href="/login">Entrar</Link></p>
        <p className="login-note">O cadastro ainda não está ativado. Os dados preenchidos não serão armazenados.</p>
      </section>
    </main>
  );
}
