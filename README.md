# Nails by Samara 💅

<p align="center"><strong>Uma experiência digital de beleza, autocuidado e gestão para um estúdio de unhas.</strong></p>

<p align="center">
  <a href="https://github.com/DevDonov4n/Nails">Repositório</a> ·
  <a href="https://github.com/DevDonov4n/Nails/issues">Reportar problema</a>
</p>

---

## 📖 Sobre o projeto

**Nails by Samara** é uma aplicação web desenvolvida para apresentar os serviços de um estúdio de unhas, permitir que clientes solicitem agendamentos on-line e oferecer uma área administrativa para gerenciar a operação do negócio.

O projeto reúne uma vitrine institucional com identidade visual própria, uma experiência de navegação com animações, fluxo de agendamento com validações no servidor, contas de clientes, programa de fidelidade, campanhas promocionais e um painel administrativo chamado **Diva**.

A aplicação foi construída com foco em:

- **Experiência da cliente:** navegação responsiva, apresentação dos serviços e acesso simplificado ao agendamento.
- **Organização operacional:** consulta de horários, prevenção de conflitos e controle do ciclo de vida dos agendamentos.
- **Relacionamento:** conta da cliente, histórico de atendimentos e recompensas de fidelidade.
- **Gestão:** visão administrativa de agenda, atendimentos, indicadores financeiros, despesas e campanhas.
- **Integridade dos dados:** validações e regras comerciais aplicadas também no backend, sem depender dos valores enviados pelo navegador.

> O repositório representa um projeto em evolução. Recursos identificados como “em preparação” ainda não devem ser considerados disponíveis para uso em produção.

## 🌐 Aplicação e páginas

| Página | Rota | Descrição |
|---|---|---|
| Página inicial | / | Apresentação do estúdio, serviços, marcas e contato |
| Agendamento | /agendamento | Solicitação de horário e consulta de disponibilidade |
| Cadastro | /cadastro | Criação de conta de cliente |
| Login | /login | Autenticação de cliente |
| Minha conta | /minha-conta | Histórico, status dos agendamentos e fidelidade |
| Painel administrativo | /admin | Área restrita de gestão — Diva |

- **Repositório:** https://github.com/DevDonov4n/Nails

## ✨ Funcionalidades

### 1. Site institucional

A página inicial apresenta a marca Nails by Samara e organiza as principais informações do estúdio em seções:

- Hero com chamada para ação e identidade visual da marca.
- Sequência visual de imagens relacionada ao universo de nail design.
- Apresentação dos serviços em componentes interativos.
- Exibição de marcas de esmaltes e produtos utilizados no estúdio.
- Seção de contato com acesso direto ao WhatsApp.
- Navegação global com cabeçalho e rodapé.
- Layout adaptável a telas desktop e dispositivos móveis.

### 2. Experiência visual e animações

A interface utiliza componentes dedicados para criar uma navegação mais expressiva:

- Animações de entrada e rolagem com **GSAP**.
- Integração com **@gsap/react**.
- Sequências visuais controladas pela rolagem.
- Componentes de apresentação de serviços e marcas.
- Estilização com CSS global e CSS Modules.

As animações complementam a navegação: o conteúdo e as ações principais continuam organizados como páginas e componentes da aplicação.

### 3. Serviços e preços

Os serviços disponíveis no código são centralizados em src/data/services.ts e possuem identificadores utilizados pelo fluxo de agendamento.

| Serviço | Identificador | Preço cadastrado |
|---|---|---:|
| Mão | HAND | R$ 30,00 |
| Pé | FOOT | R$ 35,00 |
| Pé + mão | BOTH | R$ 60,00 |

Regras comerciais implementadas no backend:

- Os valores são calculados no servidor; o frontend não é a fonte definitiva do preço.
- A taxa de deslocamento para atendimento em domicílio é de **R$ 5,00**.
- O mecanismo de agendamento reserva blocos de **2 horas** por atendimento.
- O valor do deslocamento é separado do valor dos serviços.
- Descontos promocionais e de fidelidade incidem sobre os serviços, sem reduzir a taxa de deslocamento.

> Para alterar preços e descrições exibidos no site, revise src/data/services.ts. Revise também src/lib/booking.ts, que contém os valores utilizados pelo backend. Mantenha as duas fontes sincronizadas.

### 4. Agendamento on-line

A rota /agendamento permite solicitar um horário sem precisar entrar em contato manualmente para iniciar o processo.

O fluxo contempla:

1. Seleção do serviço.
2. Escolha do local: salão ou domicílio.
3. Preenchimento dos dados da cliente quando não há sessão autenticada.
4. Informações de endereço para atendimento em domicílio.
5. Seleção da data e consulta dos horários disponíveis.
6. Envio da solicitação para o backend.
7. Registro do agendamento com status inicial **Pendente**.

Validações e regras de agenda:

- A data precisa ser válida e o horário precisa estar no futuro.
- Os horários são interpretados considerando o fuso de São Paulo (America/Sao_Paulo).
- Expediente configurado no backend:
  - **Segunda a sexta:** das 16h às 20h.
  - **Sábados e domingos:** das 9h às 18h.
- Cada atendimento ocupa um intervalo de duas horas.
- O sistema consulta conflitos com agendamentos pendentes ou confirmados.
- O backend verifica novamente a disponibilidade antes de gravar a solicitação, reduzindo o risco de duas clientes ocuparem o mesmo horário.
- Agendamentos começam como PENDING e aguardam análise administrativa.

### 5. Cadastro, autenticação e área da cliente

A aplicação possui fluxo próprio de autenticação para clientes:

- Cadastro de conta com dados pessoais e credenciais.
- Login e logout.
- Sessão persistida por cookie HTTP-only.
- Consulta da sessão autenticada.
- Área /minha-conta para consultar agendamentos associados à conta.
- Visualização do status, serviço, local, data, valores e descontos aplicados.
- Acompanhamento do progresso do programa de fidelidade.

As senhas são armazenadas como hash com **scrypt** e salt aleatório. Os tokens de sessão são assinados com HMAC-SHA256 e possuem validade definida no backend.

**Importante sobre agendamentos antigos:** a aplicação não associa automaticamente registros históricos a uma conta apenas pelo número de WhatsApp. A rota de reivindicação informa que a vinculação depende de uma futura verificação de posse do número, evitando expor dados de outra pessoa.

### 6. Programa de fidelidade

O programa de fidelidade está associado às contas das clientes.

Regra implementada:

- A cada **5 atendimentos concluídos** vinculados à conta, a cliente recebe uma recompensa.
- A recompensa concede **50% de desconto** no valor dos serviços de um próximo agendamento elegível.
- O saldo de recompensas disponíveis é controlado no banco.
- Ao utilizar uma recompensa, o desconto é registrado no agendamento e a quantidade disponível é atualizada.
- Se um agendamento que consumiu uma recompensa for cancelado, a recompensa é devolvida.
- O painel administrativo permite ativar ou suspender a funcionalidade.
- A área da cliente e os avisos do site consultam o estado atual do recurso.

A aplicação registra o desconto aplicado em cada agendamento, preservando o histórico financeiro mesmo que a configuração do programa seja alterada posteriormente.

### 7. Eventos e funcionalidades

O painel **Eventos e Funcionalidades** permite administrar recursos da plataforma e campanhas temporárias.

Recursos gerenciáveis:

- **Programa de fidelidade:** ativação ou suspensão.
- **Descontos promocionais:** ativação ou suspensão.
- **Indique e Ganhe:** exibido como recurso em preparação; não pode ser ativado nesta versão.

Gestão de eventos:

- Cadastro de campanhas promocionais.
- Definição de título, descrição, tipo, percentual e período de validade.
- Listagem de campanhas futuras, em andamento, encerradas ou pausadas.
- Pausar e reativar eventos cadastrados.
- Consulta pública do estado da plataforma para exibir avisos e campanhas aplicáveis.

#### Campanha de inauguração

A migração de eventos inclui uma campanha inicial:

- **Nome:** Campanha de inauguração.
- **Desconto:** 10%.
- **Período:** de 01/12/2026 a 25/12/2026.
- **Aplicação:** desconto sobre o valor dos serviços em agendamentos elegíveis criados durante a campanha.
- **Deslocamento:** a taxa de atendimento em domicílio não recebe desconto.

O backend calcula e persiste o desconto no momento da criação do agendamento. A estimativa apresentada na interface não substitui o cálculo do servidor.

### 8. Painel administrativo — Diva

A rota /admin disponibiliza uma área restrita para a administração do estúdio.

Seções principais:

- **Visão geral:** indicadores e resumo do negócio.
- **Agendamentos:** consulta de solicitações, filtros e ações administrativas.
- **Atendimentos e fidelidade:** acompanhamento dos serviços confirmados, conclusão dos atendimentos e histórico de clientes.
- **Financeiro:** indicadores de receitas, despesas, resultado e meta anual.
- **Eventos e Funcionalidades:** gerenciamento dos recursos e campanhas da plataforma.

Operações administrativas implementadas:

- Consultar agendamentos e seus dados.
- Confirmar ou recusar solicitações pendentes.
- Verificar conflitos antes de confirmar um horário.
- Concluir atendimentos confirmados.
- Exigir a seleção da forma de pagamento ao concluir:
  - Pix (PIX)
  - Dinheiro (CASH)
  - Cartão (CARD)
  - Outro (OTHER)
- Registrar despesas com valor, categoria, descrição e data.
- Consultar gráficos e indicadores do painel.
- Definir a meta anual.
- Gerenciar eventos e funcionalidades.

O acesso administrativo utiliza sessão própria e cookie separado da autenticação das clientes.

## 🧰 Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| [Next.js 16](https://nextjs.org/) | Framework web, App Router, páginas e Route Handlers |
| [React 19](https://react.dev/) | Construção de interfaces e componentes |
| [TypeScript 5](https://www.typescriptlang.org/) | Tipagem estática |
| [Prisma 6](https://www.prisma.io/) | ORM, schema e acesso aos dados |
| [Turso](https://turso.tech/) | Banco de dados SQLite distribuído/libSQL em nuvem |
| [SQLite](https://www.sqlite.org/) | Banco local e base compatível com o schema Prisma |
| [GSAP](https://gsap.com/) | Animações e interações de rolagem |
| [@gsap/react](https://www.npmjs.com/package/@gsap/react) | Integração do GSAP com React |
| [Anime.js](https://animejs.com/) | Biblioteca de animação incluída nas dependências |
| [Tailwind CSS 4](https://tailwindcss.com/) | Integração de estilos via Turbopack |
| [ESLint 9](https://eslint.org/) | Análise estática e padronização |
| [Node.js](https://nodejs.org/) | Ambiente de execução |

### Dependências principais

- next
- react e react-dom
- @prisma/client
- @prisma/adapter-libsql
- gsap e @gsap/react
- animejs

As versões exatas e os scripts disponíveis estão definidos em package.json e package-lock.json.

## 🏗️ Arquitetura e organização

O projeto utiliza o **App Router** do Next.js. As páginas ficam em src/app, os componentes reutilizáveis em src/components, as regras de domínio em src/lib e os modelos de dados em prisma/schema.prisma.

Estrutura principal:

    Nails/
    ├── prisma/
    │   ├── migrations/
    │   ├── schema.prisma
    │   ├── init-turso.sql
    │   ├── loyalty-migration.sql
    │   └── events-features-migration.sql
    ├── public/
    ├── scripts/
    │   ├── apply-turso.cjs
    │   ├── migrate-customer-accounts.cjs
    │   ├── seed-admin.cjs
    │   ├── seed-demo-bookings.cjs
    │   └── test-prisma-turso.cjs
    ├── src/
    │   ├── app/
    │   │   ├── admin/
    │   │   ├── agendamento/
    │   │   ├── api/
    │   │   │   ├── admin/
    │   │   │   ├── auth/
    │   │   │   ├── availability/
    │   │   │   ├── bookings/
    │   │   │   ├── customer/
    │   │   │   └── platform-status/
    │   │   ├── cadastro/
    │   │   ├── login/
    │   │   ├── minha-conta/
    │   │   ├── globals.css
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── components/
    │   │   ├── admin/
    │   │   ├── animations/
    │   │   ├── services/
    │   │   ├── BrandPolishes.tsx
    │   │   ├── Header.tsx
    │   │   ├── Footer.tsx
    │   │   └── ...
    │   ├── data/
    │   │   └── services.ts
    │   ├── lib/
    │   │   ├── auth.ts
    │   │   ├── booking.ts
    │   │   └── prisma.ts
    │   └── assets/
    ├── .env.example
    ├── next.config.ts
    ├── package.json
    └── README.md

### Responsabilidade dos principais módulos

| Caminho | Responsabilidade |
|---|---|
| src/app/page.tsx | Página inicial e composição das seções públicas |
| src/app/layout.tsx | Layout global, fontes, metadados, cabeçalho e rodapé |
| src/app/globals.css | Estilos globais e responsividade |
| src/app/agendamento/page.tsx | Interface de solicitação de agendamento |
| src/app/admin/page.tsx | Painel administrativo Diva |
| src/app/minha-conta/ | Área autenticada da cliente |
| src/components/ | Componentes reutilizáveis da interface |
| src/components/animations/ | Experiências animadas e sequências visuais |
| src/components/services/ | Apresentação interativa dos serviços |
| src/components/admin/ | Gráficos e gerenciamento de eventos/funcionalidades |
| src/data/services.ts | Catálogo e conteúdo dos serviços |
| src/lib/booking.ts | Regras de agenda, disponibilidade e cálculo de valores |
| src/lib/auth.ts | Hash de senha, assinatura e leitura da sessão da cliente |
| src/lib/prisma.ts | Instância Prisma e conexão com Turso/libSQL |
| prisma/schema.prisma | Modelos, enums e relacionamentos do banco |
| scripts/ | Inicialização, migrações auxiliares e dados administrativos/de demonstração |

## 🗃️ Modelo de dados

O schema Prisma define os seguintes modelos principais:

### User

Armazena a conta da cliente: identificador, nome, e-mail único, WhatsApp, hash da senha, datas de criação/atualização, recompensas disponíveis e relacionamento com agendamentos.

### Booking

Representa uma solicitação ou atendimento:

- Dados da cliente e WhatsApp.
- Endereço opcional.
- Serviço (HAND, FOOT, BOTH).
- Local (SALON, HOME).
- Data e hora inicial/final.
- Status (PENDING, CONFIRMED, CANCELLED, COMPLETED).
- Forma de pagamento.
- Preço dos serviços, taxa de deslocamento e total.
- Descontos de fidelidade e promocionais.
- Referência à campanha promocional.
- Vínculo opcional com uma conta de cliente.

### AdminUser

Armazena as credenciais administrativas e a meta anual.

### Expense

Armazena despesas com valor, categoria, descrição e data de ocorrência.

### PlatformFeature

Controla a ativação de funcionalidades por chave, com estado e data de atualização.

### PlatformEvent

Armazena campanhas e eventos com título, descrição, tipo, percentual de desconto, período de validade e estado de ativação.

**Valores monetários:** os campos de preço e desconto são armazenados como inteiros em centavos. Por exemplo, R$ 30,00 é armazenado como 3000.

## 🔌 API — principais rotas

As rotas abaixo são implementadas como Route Handlers do Next.js.

| Método | Endpoint | Finalidade |
|---|---|---|
| GET | /api/availability?date=AAAA-MM-DD | Consultar horários livres em uma data |
| POST | /api/bookings | Criar solicitação de agendamento |
| POST | /api/auth/register | Cadastrar cliente |
| POST | /api/auth/login | Autenticar cliente |
| POST | /api/auth/logout | Encerrar sessão da cliente |
| GET | /api/auth/me | Consultar sessão da cliente |
| GET | /api/customer/bookings | Consultar agendamentos e fidelidade da cliente autenticada |
| POST | /api/customer/claim-bookings | Endpoint de reivindicação; não vincula histórico sem verificação |
| GET | /api/platform-status | Consultar avisos, campanha e estado público de funcionalidades |
| GET | /api/admin/me | Verificar sessão administrativa |
| POST | /api/admin/login | Autenticar administradora |
| POST | /api/admin/logout | Encerrar sessão administrativa |
| GET | /api/admin/bookings | Listar agendamentos no painel |
| PATCH | /api/admin/bookings/:id | Confirmar, recusar ou concluir agendamento |
| GET / PATCH | /api/admin/dashboard | Consultar indicadores e atualizar meta anual |
| POST | /api/admin/expenses | Registrar despesa |
| GET / POST / PATCH | /api/admin/platform-settings | Consultar e gerenciar recursos e eventos |

As rotas administrativas exigem sessão válida. Respostas com dados de sessão e agenda utilizam cabeçalhos para evitar cache indevido.

## ⚙️ Configuração do ambiente

### Requisitos

- **Node.js** compatível com Next.js 16.
- **npm**.
- Conta e banco de dados no [Turso](https://turso.tech/) para ambiente hospedado.
- Credenciais de acesso ao banco e segredos de sessão.

### 1. Clonar o repositório

    git clone https://github.com/DevDonov4n/Nails.git
    cd Nails

### 2. Instalar as dependências

    npm install

### 3. Configurar as variáveis de ambiente

Crie um arquivo .env na raiz do projeto usando .env.example como referência:

    # Banco local SQLite usado pelo Prisma CLI e fallback local
    DATABASE_URL="file:./dev.db"

    # Banco Turso/libSQL
    TURSO_DATABASE_URL="libsql://SEU-BANCO-SUA-ORGANIZACAO.turso.io"
    TURSO_AUTH_TOKEN="SEU_TOKEN_TURSO"

    # Segredo para assinar sessões (mínimo de 32 caracteres)
    SESSION_SECRET="GERE_UM_SEGREDO_FORTE_COM_PELO_MENOS_32_CARACTERES"

    # Credenciais iniciais da administradora
    ADMIN_EMAIL="admin@seudominio.com"
    ADMIN_PASSWORD="UMA_SENHA_FORTE_COM_PELO_MENOS_12_CARACTERES"

Gere valores próprios para os segredos. Não reutilize os exemplos acima e **nunca envie o arquivo .env para o GitHub**.

O código de conexão utiliza Turso quando TURSO_DATABASE_URL está configurada. Nesse caso, TURSO_AUTH_TOKEN também é obrigatório. Sem a URL do Turso, o cliente Prisma utiliza o banco local configurado em DATABASE_URL.

### 4. Preparar o banco Turso

O schema possui migrações SQL auxiliares para preparar as tabelas e evoluir o banco. Em um banco novo, siga a sequência abaixo e execute cada migração apenas uma vez, verificando antes se as tabelas/colunas já existem:

1. Inicialize a tabela base de agendamentos:

       node scripts/apply-turso.cjs

   Esse script aplica prisma/init-turso.sql.

2. Crie a estrutura de contas de clientes e o vínculo opcional com agendamentos:

       npm run db:migrate:customers

3. Execute o conteúdo de prisma/loyalty-migration.sql no console SQL do banco Turso. Essa migração adiciona os campos de fidelidade e calcula recompensas históricas a partir dos atendimentos concluídos vinculados às contas.

4. Execute o conteúdo de prisma/events-features-migration.sql no console SQL do Turso. Essa migração cria as tabelas de funcionalidades/eventos, adiciona os campos de desconto promocional e registra a campanha inaugural configurada no arquivo.

5. Gere/atualize o Prisma Client:

       npm run db:generate

6. Cadastre ou atualize a conta administrativa:

       npm run db:seed:admin

   O script utiliza ADMIN_EMAIL e ADMIN_PASSWORD do arquivo de ambiente. A senha deve possuir pelo menos 12 caracteres.

> **Atenção:** as migrações SQL são operações de banco e não devem ser executadas repetidamente sem conferir o estado atual. Faça backup antes de aplicar alterações em um banco que já contenha dados. Não rode prisma db push contra o banco de produção sem revisar o impacto.

### 5. Executar em desenvolvimento

    npm run dev

Acesse [http://localhost:3000](http://localhost:3000).

## 📜 Scripts disponíveis

| Comando | Descrição |
|---|---|
| npm run dev | Inicia o servidor Next.js em desenvolvimento |
| npm run build | Gera a compilação de produção |
| npm run start | Inicia a aplicação compilada |
| npm run lint | Executa o ESLint |
| npm run db:generate | Gera o Prisma Client |
| npm run db:push | Sincroniza o schema Prisma com o banco configurado no Prisma CLI; use com cautela |
| npm run db:migrate:customers | Aplica a migração auxiliar das contas de clientes no Turso |
| npm run db:seed:admin | Cria ou atualiza a conta administrativa no Turso |

Scripts auxiliares adicionais:

- scripts/apply-turso.cjs: aplica o SQL inicial do banco Turso.
- scripts/seed-demo-bookings.cjs: popula dados de demonstração de agendamentos.
- scripts/test-prisma-turso.cjs: script de verificação da conexão Prisma/Turso.

## 🚀 Build e publicação

Antes de publicar uma nova versão:

1. Configure as variáveis de ambiente no provedor de hospedagem.
2. Confirme que o banco Turso está acessível pela aplicação.
3. Aplique as migrações pendentes com backup e na ordem correta.
4. Execute npm run db:generate.
5. Execute npm run lint.
6. Execute npm run build.
7. Teste login de cliente, login administrativo, consulta de horários, criação de agendamento e atualização de status.
8. Verifique as configurações de domínio, HTTPS e cookies seguros no ambiente de produção.

O projeto é uma aplicação Next.js e deve ser publicado em uma plataforma que ofereça suporte ao runtime necessário para as rotas de servidor e ao acesso externo ao Turso/libSQL. Configure o comando de build como npm run build e o comando de inicialização conforme o provedor escolhido.

## 🔐 Segurança e boas práticas

- Não versione .env, tokens, senhas ou credenciais reais.
- Utilize SESSION_SECRET aleatório com no mínimo 32 caracteres.
- Utilize senha administrativa forte, com pelo menos 12 caracteres.
- Mantenha HTTPS em produção.
- Preserve cookies de sessão como HTTP-only e secure em produção.
- Não confie em valores monetários, descontos, horários ou status calculados somente no frontend.
- Mantenha validações de disponibilidade e conflitos no servidor.
- Não associe agendamentos históricos a contas apenas por telefone sem validar a titularidade.
- Faça backup do banco antes de executar migrações ou operações destrutivas.
- Restrinja o acesso às rotas administrativas por sessão.

## 🧪 Checklist de validação funcional

Após configurar o ambiente, valide os fluxos principais:

- [ ] A página inicial carrega em desktop e mobile.
- [ ] As animações e sequências visuais funcionam durante a rolagem.
- [ ] Os serviços e valores exibidos correspondem aos valores do backend.
- [ ] A consulta de horários retorna apenas horários disponíveis.
- [ ] Datas inválidas, horários passados e horários fora do expediente são recusados.
- [ ] O backend impede sobreposição entre agendamentos ativos.
- [ ] Uma solicitação nova é registrada como pendente.
- [ ] A administradora consegue entrar no painel Diva.
- [ ] A administradora consegue confirmar ou recusar solicitações pendentes.
- [ ] A conclusão exige uma forma de pagamento.
- [ ] Despesas e meta anual podem ser atualizadas.
- [ ] A cliente consegue criar conta, entrar e consultar seus próprios agendamentos.
- [ ] O progresso e as recompensas de fidelidade são calculados corretamente.
- [ ] Descontos promocionais são calculados e registrados no backend.
- [ ] Funcionalidades e campanhas podem ser gerenciadas no painel.
- [ ] O recurso Indique e Ganhe permanece identificado como em preparação.

## 🛣️ Próximas evoluções

Ideias e pontos de evolução coerentes com a estrutura atual:

- Implementar verificação de WhatsApp para vincular com segurança agendamentos antigos a contas.
- Desenvolver integralmente o programa Indique e Ganhe.
- Ampliar a cobertura de testes automatizados para regras de agenda, descontos e fidelidade.
- Evoluir o controle de permissões e auditoria das operações administrativas.
- Consolidar o fluxo de migrações em um processo versionado e automatizado.
- Aprimorar relatórios e indicadores para acompanhamento do negócio.

## 🤝 Contribuição

Contribuições, sugestões e relatos de problemas são bem-vindos.

1. Faça um fork do projeto.
2. Crie uma branch para sua alteração:

       git switch -c feature/minha-melhoria

3. Faça commits objetivos e mantenha o escopo da alteração organizado.
4. Execute lint e build antes de abrir um Pull Request.
5. Descreva o problema, a solução e os passos para testar.

Para reportar problemas, utilize a área de [Issues do GitHub](https://github.com/DevDonov4n/Nails/issues).

## 👨‍💻 Desenvolvimento

Projeto desenvolvido por **Donovan Bueno** para a operação digital da Nails by Samara.

- GitHub: [@DevDonov4n](https://github.com/DevDonov4n)
- Projeto: [Nails by Samara](https://github.com/DevDonov4n/Nails)

---

<p align="center">Feito com cuidado, tecnologia e 💗 para a Nails by Samara.</p>
