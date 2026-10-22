# CC Lion's Simulator

Cópia-base do simulador para a CC Lion's. A identidade visual e as informações comerciais do cliente serão ajustadas após o recebimento dos dados.

## Status da configuração

- Projeto Lovable: ainda não conectado a este repositório.
- Destino de leads no CRM: ainda não configurado.
- Meta Pixel e token da CAPI: ainda não configurados.
- Deploy: GitHub Pages, automático a cada atualização na branch `main`.
- Envio de simulações: ainda indisponível até configurar o endpoint e o destino de leads.

## Rodar localmente

Requer Node.js e npm.

```sh
npm install
npm run dev
```

## Tecnologias

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Configuração e publicação

O workflow `.github/workflows/main.yml` publica automaticamente no GitHub Pages quando há uma atualização na branch `main`. A rota `/obrigado` é preservada para navegação do React.

O formulário só confirma uma simulação depois de configurar `VITE_META_CONVERSIONS_ENDPOINT` e um destino de leads em `src/components/Simulator.tsx`. O GitHub Pages publica apenas arquivos estáticos e não executa a função `functions/api/conversions.ts`; para usar essa função será necessário hospedar o projeto em Cloudflare Pages ou conectar uma API externa.

Mantenha o token da Meta como secret no ambiente server-side. Não coloque tokens ou chaves privadas no front-end nem em arquivos `.env` versionados. Use `.env.example` e `.dev.vars.example` como modelos sem valores reais.
