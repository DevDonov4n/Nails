"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.jpg";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  { label: "Início", href: "/#inicio" },
  { label: "Serviços", href: "/#servicos" },
  { label: "Contato", href: "/#contato" },
];
type HeaderUser = { name: string; email: string };

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sequenceFinished, setSequenceFinished] = useState(false);
  const isHome = pathname === "/";

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (active) { setUser(data.user ?? null); setSessionChecked(true); } })
      .catch(() => { if (active) { setUser(null); setSessionChecked(true); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isHome) { setSequenceFinished(true); return; }
    const update = () => setSequenceFinished(window.scrollY >= window.innerHeight * 3.8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [isHome]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
    router.push("/");
  }

  return (
    <header className={`site-header ${isHome ? "site-header--home" : ""} ${isHome && !sequenceFinished ? "site-header--transparent" : "site-header--visible"}`}>
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label="Nails by Samara — início" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark"><Image src={logo} alt="" aria-hidden="true" sizes="40px" /></span>
          <span className="brand-copy"><span className="brand-name">Nails by Samara</span><span className="brand-caption">BELEZA EM CADA DETALHE</span></span>
        </Link>
        <nav id="mobile-navigation" className={`main-nav ${menuOpen ? "main-nav--open" : ""}`} aria-label="Navegação principal">
          {navigation.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>)}
          <div className="mobile-nav-account">
            {!sessionChecked ? null : user ? <><Link href="/minha-conta" onClick={() => setMenuOpen(false)}>Olá, {user.name.split(" ")[0]}</Link><button type="button" onClick={logout}>Sair</button></> : <><Link href="/login" onClick={() => setMenuOpen(false)}>Entrar</Link><Link href="/cadastro" onClick={() => setMenuOpen(false)}>Criar conta</Link></>}
            <Link className="mobile-booking-cta" href="/agendamento" onClick={() => setMenuOpen(false)}>Agendar horário ↗</Link>
          </div>
        </nav>
        <div className="header-actions">
          {!sessionChecked ? <span className="header-session-placeholder" aria-hidden="true" /> : user ? (
            <div className="header-user-actions"><Link className="header-account" href="/minha-conta">Olá, {user.name.split(" ")[0]}</Link><button className="header-signup header-logout" type="button" onClick={logout}>Sair</button></div>
          ) : <><Link className="header-account" href="/login">Entrar</Link><Link className="header-signup" href="/cadastro">Criar conta</Link></>}
          <Link className="header-cta" href="/agendamento">Agendar horário <span aria-hidden="true">↗</span></Link>
        </div>
        <button className={`header-menu-toggle ${menuOpen ? "is-open" : ""}`} type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(value => !value)}>
          <span/><span/><span/>
        </button>
      </div>
    </header>
  );
}