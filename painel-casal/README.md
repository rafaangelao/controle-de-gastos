# 📒 Painel Financeiro do Casal

Um livro-caixa digital para duas pessoas administrarem o dinheiro juntas —
sem planilha, sem "quem atualizou por último", sem dado que some quando
alguém fecha o navegador.

Vocês registram entradas e gastos pelo celular ou computador, escolhem o
mês que querem ver, e o painel calcula sozinho quanto entrou, quanto saiu,
quanto sobrou e pra onde o dinheiro está indo — em tempo real, para os
dois, no mesmo lugar.

---

## ✨ Funcionalidades

- **Lançamento rápido** de entradas (salário, freela, presente…) e gastos,
  já com categoria.
- **Seletor de mês/ano** — veja o resumo de qualquer período lançado, sem
  precisar rolar uma planilha gigante.
- **Resumo automático** do mês: total entrada, total gasto, saldo, e uma
  mensagem de status (ex: *"⚠️ vocês já comprometeram 85% das entradas"*).
- **Para onde foi o dinheiro** — ranking de categorias do mês, com barra e
  percentual sobre o total gasto.
- **Histórico de lançamentos** do mês, com opção de excluir.
- **Visão geral** somando tudo que já foi lançado, desde o início.
- **Dados compartilhados** — o que um lança, o outro vê ao atualizar a
  página. Não é armazenamento local do navegador: é um banco de dados real
  na nuvem.
- **Acesso protegido por PIN** — só quem tem a senha combinada entre vocês
  entra no painel.

## 🧱 Stack tecnológica

| Camada         | Tecnologia                                   |
|----------------|-----------------------------------------------|
| Framework      | [Next.js](https://nextjs.org) (App Router, TypeScript) |
| Banco de dados | PostgreSQL (Vercel Postgres, Neon ou Supabase) |
| Hospedagem     | [Vercel](https://vercel.com)                  |
| Autenticação   | PIN compartilhado, via cookie `httpOnly`      |
| Estilo         | CSS puro — sem framework de UI                |

Sem dependências pesadas: só `next`, `react` e `pg` (driver do Postgres).

## 📂 Estrutura do projeto

```
painel-casal/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx              # página principal (dashboard)
│  │  ├─ layout.tsx            # layout raiz
│  │  ├─ globals.css           # estilo do painel
│  │  ├─ entrar/page.tsx       # tela de login (PIN)
│  │  └─ api/
│  │     ├─ auth/route.ts             # valida o PIN e seta o cookie
│  │     └─ lancamentos/
│  │        ├─ route.ts               # GET (listar) e POST (criar)
│  │        └─ [id]/route.ts          # DELETE (remover)
│  ├─ components/
│  │  └─ Dashboard.tsx         # toda a lógica e UI do painel
│  ├─ lib/
│  │  └─ db.ts                 # conexão com o Postgres + criação da tabela
│  └─ proxy.ts                 # protege as rotas, redireciona pra /entrar
├─ .env.local.example          # modelo das variáveis de ambiente
└─ README.md
```

A tabela `lancamentos` é criada automaticamente no banco na primeira
requisição — não precisa rodar nenhum SQL manualmente.

## 🚀 Rodando localmente

```bash
npm install
cp .env.local.example .env.local   # preencha POSTGRES_URL e PAINEL_PIN
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) — vai pedir o PIN
configurado em `.env.local`.

Para testar sem criar um banco na nuvem ainda, você pode subir um Postgres
local (`docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres`) e
apontar `POSTGRES_URL` pra ele.

## ☁️ Deploy no Vercel

1. Suba este projeto para um repositório no GitHub.
2. No Vercel, **Add New Project** → importe o repositório (o framework é
   detectado automaticamente, nenhuma configuração extra é necessária).
3. Na aba **Storage** do projeto, **Create Database** → Postgres. O Vercel
   já conecta a variável `POSTGRES_URL` sozinho.
4. Em **Settings → Environment Variables**, adicione `PAINEL_PIN` com a
   senha que vocês vão usar para entrar.
5. **Deploy**. Em ~1 minuto vocês têm uma URL (`seu-projeto.vercel.app`)
   pronta para os dois acessarem.

## 🔐 Sobre a segurança

O PIN é uma barreira simples para impedir que alguém com o link acesse os
dados de vocês — não é um sistema de contas com senha individual nem
criptografia de ponta a ponta. Ideal para uso privado entre duas pessoas
que confiam uma na outra. Se um dia quiserem contas separadas (login por
e-mail, por exemplo), essa é a próxima evolução natural do projeto.

## 🗺️ Possíveis próximos passos

- Editar um lançamento existente (hoje só dá pra excluir e lançar de novo).
- Gráfico de evolução mês a mês.
- Exportar os lançamentos do mês em CSV/PDF.
- Metas de gasto por categoria.

---

Feito para simplificar a vida financeira de duas pessoas que dividem
contas — sem planilha, sem "me manda o print aí".
