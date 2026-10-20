# CC Lion's Simulator

Cópia-base do simulador para a CC Lion's. A identidade visual e as informações comerciais do cliente serão ajustadas após o recebimento dos dados.

## Status da configuração

- Projeto Lovable: ainda não conectado a este repositório.
- Destino de leads no CRM: ainda não configurado.
- Meta Pixel e token da CAPI: ainda não configurados.
- Deploy: workflow manual, disponível depois de configurar o endpoint do cliente.

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

O workflow `.github/workflows/main.yml` só roda manualmente e exige a variável de repositório `VITE_META_CONVERSIONS_ENDPOINT`. Configure-a com o endpoint da CC Lion's quando a API estiver pronta.

Mantenha o token da Meta como secret no ambiente server-side. Não coloque tokens ou chaves privadas no front-end nem em arquivos `.env` versionados. Use `.env.example` e `.dev.vars.example` como modelos sem valores reais.
