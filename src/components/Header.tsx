import Link from "next/link";

const navigation = [
  { label: "Início", href: "/#inicio" },
  { label: "Serviços", href: "/#servicos" },
  { label: "Portfólio", href: "/#portfolio" },
  { label: "Contato", href: "/#contato" },
];

export default function Header() {
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
          <Link className="header-account" href="/login">Entrar</Link>
          <Link className="header-signup" href="/cadastro">Criar conta</Link>
          <Link className="header-cta" href="/agendamento">Agendar horário <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </header>
  );
}
