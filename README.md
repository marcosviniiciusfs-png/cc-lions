# CC Lion's Simulator

Cópia-base do simulador para a CC Lion's. A identidade visual e as informações comerciais do cliente serão ajustadas após o recebimento dos dados.

## Status da configuração

- Projeto Lovable: ainda não conectado a este repositório.
- Destino de leads no CRM: webhook Kairoz armazenado como secret no Cloudflare Worker.
- Meta Pixel: instalado (ID `1392365026017528`).
- Meta CAPI: Worker publicado; token guardado como secret `META_CAPI_ACCESS_TOKEN` no Cloudflare.
- Leads: gravados no banco privado Cloudflare D1 `cc-lions-leads`.
- Deploy: GitHub Pages, automático a cada atualização na branch `main`.
- O formulário registra `Lead` no Pixel e na CAPI e abre o WhatsApp com as respostas preenchidas.
- Cada novo lead é enviado ao webhook do Kairoz em segundo plano, depois de ser gravado no D1.

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

O site estático chama `https://cc-lions-conversions-api.marcosviniicius-fs.workers.dev/events`. O Worker fica em `cloudflare/cc-lions-conversions-api/` e usa os secrets `META_CAPI_ACCESS_TOKEN` e `LEAD_DESTINATION_WEBHOOK_URL`; o ID do Pixel e a lista de origens permitidas ficam em `wrangler.jsonc`. A URL do CRM deve permanecer apenas no secret do Cloudflare, nunca no front-end ou no Git.

Para configurar ou atualizar os secrets, execute `npx wrangler secret put META_CAPI_ACCESS_TOKEN --config cloudflare/cc-lions-conversions-api/wrangler.jsonc` e `npx wrangler secret put LEAD_DESTINATION_WEBHOOK_URL --config cloudflare/cc-lions-conversions-api/wrangler.jsonc`. Não coloque tokens, URLs privadas ou chaves no front-end nem em arquivos versionados. Use `.env.example` e `.dev.vars.example` como modelos sem valores reais.

## Leads no Cloudflare D1

O Worker grava o lead em `cc-lions-leads` antes de responder ao formulário; só depois agenda o envio à Meta. O evento do Pixel é disparado após a confirmação da gravação. O mesmo `event_id` é usado no Pixel e na CAPI para deduplicação.

O banco guarda data, nome, telefone normalizado, atendimento, bem, faixas de crédito e parcela, informação de entrada, observação imobiliária e status de envio à Meta (`meta_status`) e ao CRM (`crm_status`). Não há rota pública para consultar esses dados nem limpeza automática configurada. Consulte os registros pelo painel Cloudflare em **D1 > cc-lions-leads** ou com:

```sh
npx wrangler d1 execute cc-lions-leads --remote \
  --config cloudflare/cc-lions-conversions-api/wrangler.jsonc \
  --command "SELECT created_at, full_name, phone, service_type, asset_type, credit_range, has_entry, entry_amount, monthly_range, notes, meta_status, crm_status FROM leads ORDER BY created_at DESC"
```

A Cloudflare provisionou o banco na região `ENAM` (EWR). A migração da tabela está versionada em `cloudflare/cc-lions-conversions-api/migrations/`.
