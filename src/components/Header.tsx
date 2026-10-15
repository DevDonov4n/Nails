import Link from "next/link";

const navigation = [
  { label: "Início", href: "#inicio" },
  { label: "Serviços", href: "#servicos" },
  { label: "Portfólio", href: "#portfolio" },
  { label: "Contato", href: "#contato" },
];

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="#inicio" aria-label="Nails by Samara — início">
          <span className="brand-mark" aria-hidden="true">S.</span>
          <span className="brand-copy">
            <span className="brand-name">Nails by Samara</span>
            <span className="brand-caption">BELEZA EM CADA DETALHE</span>
          </span>
        </Link>

        <nav className="main-nav" aria-label="Navegação principal">
          {navigation.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a className="header-cta" href="#contato">
          Agendar horário <span aria-hidden="true">↗</span>
        </a>
      </div>
    </header>
  );
}
