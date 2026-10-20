

# Plano: Remover Acentos do Campo de Interesse/Tipo

## Problema

O CRM Convex não identifica acentos. Valores como "Imóvel", "Veículo", "Caminhão", "Maquinário" chegam com acento e não são reconhecidos corretamente.

## Solução

Criar uma função para remover acentos e aplicá-la nos campos `tipo` e `interesse` do payload CRM antes do envio.

### Arquivo: `src/components/Simulator.tsx`

1. Adicionar função auxiliar para remover acentos:
```typescript
const removeAccents = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
```

2. Aplicar nos campos `tipo` e `interesse` do `payloadCRM`:
```typescript
tipo: removeAccents(formData.propertyType),
interesse: removeAccents(formData.propertyType),
```

Isso transformará:
- "Imóvel" → "Imovel"
- "Veículo" → "Veiculo"  
- "Caminhão" → "Caminhao"
- "Maquinário" → "Maquinario"
- "Moto" → "Moto" (sem mudança)

O payload do Make.com permanece inalterado (com acentos), pois não foi reportado problema lá.

