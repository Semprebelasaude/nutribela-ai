# Relatório — Correção Rodada 5 — Nutribela AI
**Data:** 2026-06-26

---

## 1. Funil removido da interface

O modo "Quero um tipo" (funil Doce/Salgado → Estilo → Tipo de prato) foi **completamente removido** do Agente.

**Motivo registrado (conforme briefing):** o funil exibia contagem de receitas e conduzia a listas grandes, expondo o tamanho do acervo e entregando receitas demais de graça — o que canibaliza a venda do acesso à área de membros/comunidade.

**O que foi removido de `app/agente/page.tsx`:**
- Tabs "Tenho ingredientes" / "Quero um tipo"
- Constantes `ESTILOS_OPCOES`, `TIPOS_PRATO_DOCE`, `TIPOS_PRATO_SALGADO`
- Todo o estado do funil (`funilPasso`, `funilTipoGeral`, `funilEstilo`, `funilTipoPrato`, `classificacoes`)
- Fetch de `/api/receitas?classificacoes=1`
- Funções de contagem e navegação do funil
- Todo JSX dos 3 passos do funil

**O que permanece na base:** os campos `tipo_geral`, `estilos`, `tipo_prato` gravados na Correção 4 continuam no JSON da base — não foram apagados (não atrapalham, podem ser úteis futuramente). Apenas a interface não os expõe mais.

**Resultado:** o Agente tem agora **modo único** — "Adicione seus ingredientes" — sem abas, sem contagens, sem funil.

---

## 2. Autocomplete: nova fonte e novo match

### 2.1 Lista curada `data/ingredientes_base.json`

**Script:** `scripts/gerar_ingredientes_base.js`

| Métrica | Valor |
|---------|-------|
| Itens curados (entrada) | 243 |
| Itens validados na base (saída) | **237** |
| Removidos (não encontrados em nenhuma receita) | 6 |
| Itens removidos | lombo de porco, caqui, tempero completo, feijão carioca, massa para lasanha, crepe |
| Redução em relação à lista anterior | de 3.510 → **237** (redução de 93%) |

Todos os 237 ingredientes da lista têm garantia: aparecem em pelo menos 1 receita da base de 3.263. O autocomplete nunca levará a resultado vazio.

A lista cobre: proteínas animais, ovos, laticínios, legumes e verduras, frutas, farinhas e grãos, proteínas em pó, gorduras, temperos e ervas, doces e adoçantes, bebidas e líquidos de cozinha, leguminosas.

### 2.2 Correção do match: prefixo com normalização de acentos

**Antes (bugado):**
```
.filter(item => item.toLowerCase().includes(lower))
```
→ "arr" trazia alcaparra, alfarroba, "arroz para servir" (qualquer posição)

**Depois (correto):**
```
function normalizar(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
.filter(item => normalizar(item).startsWith(normalizar(q)))
```
→ Apenas prefixo exato, sem acentos, mínimo 2 caracteres

---

## 3. Exemplos de teste do autocomplete (validados na interface live)

| Digitado | Sugestões retornadas | Observação |
|----------|----------------------|------------|
| `arr` | arroz, arroz integral | ✅ Nenhuma alcaparra/alfarroba |
| `fra` | framboesa, frango | ✅ Só ingredientes que começam com "fra" |
| `lei` | leite, leite condensado, leite de amêndoa, leite de coco, leite em pó | ✅ 5 variações corretas |
| `ovo` | ovo | ✅ Direto ao ponto |
| `bat` | batata, batata-doce | ✅ Distinção clara entre os dois |
| `man` | mandioca, manga, manteiga, manteiga de amendoim | ✅ Variações reais |
| `cho` | chocolate ao leite, chocolate em pó, chocolate 70% | ✅ Distinções culinária corretas |
| `ab` | abacate, abacaxi, abóbora, abobrinha | ✅ "ab" → ingredientes reais (acentos ignorados) |
| `abob` | abóbora, abobrinha | ✅ Digitado sem acento, encontrou com acento |

---

## 4. Checklist de aceite

- [x] Modo "Quero um tipo" (funil) removido — nenhuma contagem de receitas exposta
- [x] Agente com modo único "Tenho ingredientes" (sem abas)
- [x] `data/ingredientes_base.json` curado: 237 itens, todos validados contra a base
- [x] Autocomplete prioriza prefixo — "arr" retorna arroz/arroz integral, NÃO alcaparra
- [x] Acentos ignorados no match (abob → abóbora)
- [x] Mínimo 2 caracteres para ativar sugestões
- [x] Linhas abrindo em sequência ao selecionar ingrediente
- [x] Busca por ingredientes retorna receitas ranqueadas

---

## 5. Deploy

- **Preview URL:** https://app-nutribela-3164w0dbb-viniciusmuraro-7382s-projects.vercel.app
- **Inspect:** https://vercel.com/viniciusmuraro-7382s-projects/app-nutribela/8yJQf358MVie9oRhJpGegJJZZrLN
- **Produção (NÃO promover sem OK do Vinicius):** https://app-nutribela.vercel.app

## 6. Screenshots Mobile (375px)

| Arquivo | Conteúdo |
|---------|----------|
| `public/sc-c5-01-agente-modo-unico.png` | Agente modo único sem abas/funil |
| `public/sc-c5-02-autocomplete-arr.png` | "arr" → arroz, arroz integral (sem alcaparra) |
| `public/sc-c5-03-autocomplete-fra.png` | "fra" → framboesa, frango |
| `public/sc-c5-04-autocomplete-lei.png` | "lei" → 5 variações de leite |
| `public/sc-c5-05-resultado-frango.png` | Resultado de busca por "frango" (12 receitas, sem imagem) |
