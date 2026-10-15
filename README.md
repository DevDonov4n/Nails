# Nails by Samara

Site institucional responsivo para um estúdio de unhas, desenvolvido com Next.js, React e TypeScript.

## Tecnologias
- Next.js App Router
- React
- TypeScript
- CSS responsivo com variáveis de tema
- GSAP + ScrollTrigger para animações de entrada e rolagem

## Executar localmente

Requisitos: Node.js e npm instalados.

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Para validar a compilação de produção:

```bash
npm run build
```

## Estrutura principal

- `src/app/page.tsx`: seções da página inicial
- `src/app/layout.tsx`: layout global, fontes e metadados
- `src/app/globals.css`: identidade visual e regras responsivas
- `src/components/`: componentes reutilizáveis de navegação, rodapé e botão
- `src/components/animations/PageAnimations.tsx`: animações da página inicial com GSAP
- `src/data/services.ts`: conteúdo inicial dos serviços

## Antes de publicar

Revise os serviços, duração e valores em `src/data/services.ts`; substitua as ilustrações de demonstração do portfólio por fotos reais; e atualize o link de contato na seção final. O e-mail exibido atualmente é provisório e não deve ser tratado como canal oficial.
