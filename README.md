# CC Lion's Simulator

Cópia-base do simulador para a CC Lion's. A identidade visual e as informações comerciais do cliente serão ajustadas após o recebimento dos dados.

## Status da configuração

- Projeto Lovable: ainda não conectado a este repositório.
- Destino de leads no CRM: ainda não configurado.
- Meta Pixel: instalado (ID `1392365026017528`).
- Meta CAPI: Worker publicado; token guardado como secret `META_CAPI_ACCESS_TOKEN` no Cloudflare.
- Deploy: GitHub Pages, automático a cada atualização na branch `main`.
- O formulário registra `Lead` no Pixel e na CAPI e abre o WhatsApp com as respostas preenchidas.
- Destino de CRM/webhook: não configurado.

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

O workflow `.github/workflows/main.yml` publica automaticamente no GitHub Pages quando há uma atualização na branch `main`.

O site estático chama `https://cc-lions-conversions-api.marcosviniicius-fs.workers.dev/events`. O Worker fica em `cloudflare/cc-lions-conversions-api/` e usa o secret `META_CAPI_ACCESS_TOKEN`; o ID do Pixel e a lista de origens permitidas ficam em `wrangler.jsonc`.

Para atualizar o secret, execute `npx wrangler secret put META_CAPI_ACCESS_TOKEN --config cloudflare/cc-lions-conversions-api/wrangler.jsonc`. Não coloque tokens ou chaves privadas no front-end nem em arquivos versionados. Use `.env.example` e `.dev.vars.example` como modelos sem valores reais.
