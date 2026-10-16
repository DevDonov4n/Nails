"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  { label: "Início", href: "/#inicio" },
  { label: "Serviços", href: "/#servicos" },
  { label: "Portfólio", href: "/#portfolio" },
  { label: "Contato", href: "/#contato" },
];

type HeaderUser = { name: string; email: string };

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (active) { setUser(data.user ?? null); setSessionChecked(true); } })
      .catch(() => { if (active) { setUser(null); setSessionChecked(true); } });
    return () => { active = false; };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label="Nails by Samara — início">
          <span className="brand-mark" aria-hidden="true">S.</span>
          <span className="brand-copy">
            <span className="brand-name">Nails by Samara</span>
            <span className="brand-caption">BELEZA EM CADA DETALHE</span>
          </span>
        </Link>
        <nav className="main-nav" aria-label="Navegação principal">
          {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <div className="header-actions">
          {!sessionChecked ? <span className="header-session-placeholder" aria-hidden="true" /> : user ? (
            <div className="header-user-actions">
              <Link className="header-account" href="/minha-conta">Olá, {user.name.split(" ")[0]}</Link>
              <button className="header-signup header-logout" type="button" onClick={logout}>Sair</button>
            </div>
          ) : (
            <>
              <Link className="header-account" href="/login">Entrar</Link>
              <Link className="header-signup" href="/cadastro">Criar conta</Link>
            </>
          )}
          <Link className="header-cta" href="/agendamento">Agendar horário <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </header>
  );
}
