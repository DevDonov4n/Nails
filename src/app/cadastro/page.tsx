"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CadastroPage() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirmPassword") ?? "")) {
      setMessage("As senhas não coincidem. Confira os dois campos de senha e tente novamente.");
      return;
    }
    setSending(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), email: form.get("email"), whatsapp: form.get("whatsapp"), password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível criar a conta.");
      router.replace("/minha-conta");
      router.refresh();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Não foi possível criar a conta. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card auth-card auth-card--signup">
        <Link className="booking-back" href="/">← Voltar ao início</Link>
        <div className="login-monogram" aria-hidden="true">S</div>
        <p className="eyebrow">NAILS BY SAMARA</p>
        <h1>Seu cuidado,<br /><em>em um só lugar.</em></h1>
        <p className="login-description">Faça seu cadastro para facilitar o preenchimento dos próximos agendamentos e acompanhar seus cuidados. É rapidinho: informe seus dados e escolha uma senha para sua conta.</p>
        <form className="login-form" onSubmit={submit}>
          <label className="booking-field">Nome completo
            <input name="name" type="text" required minLength={2} placeholder="Digite seu nome e sobrenome" autoComplete="name" />
          </label>
          <label className="booking-field">E-mail
            <input name="email" type="email" required placeholder="voce@email.com" autoComplete="email" />
          </label>
          <label className="booking-field">WhatsApp com DDD
            <input name="whatsapp" type="tel" required minLength={8} placeholder="Informe seu telefone com DDD" autoComplete="tel" />
          </label>
          <label className="booking-field">Senha
            <span className="auth-password-wrap">
              <input name="password" type={showPassword ? "text" : "password"} required minLength={8} placeholder="Crie uma senha com 8 caracteres ou mais" autoComplete="new-password" />
              <button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? "Ocultar" : "Mostrar"}</button>
            </span>
          </label>
          <label className="booking-field">Confirmar senha
            <input name="confirmPassword" type={showPassword ? "text" : "password"} required minLength={8} placeholder="Digite novamente a mesma senha" autoComplete="new-password" />
          </label>
          <button className="button button--primary booking-submit" type="submit" disabled={sending}>{sending ? "Criando conta…" : "Criar minha conta"} <span aria-hidden="true">↗</span></button>
          {message && <p className="booking-feedback" role="status">{message}</p>}
        </form>
        <p className="auth-switch">Já tem uma conta? <Link href="/login">Entrar</Link></p>
        <p className="login-note">Sua senha será armazenada de forma protegida. Ao criar a conta, você poderá consultar os agendamentos feitos enquanto estiver autenticado.</p>
      </section>
    </main>
  );
}
