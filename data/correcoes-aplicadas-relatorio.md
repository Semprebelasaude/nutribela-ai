# Relatório — Correções Pós-Diagnóstico — Nutribela AI
**Data:** 2026-06-27
**Base:** Rodada 6 (receitas_v1_app_LIMPA.json — 2.027 receitas)

---

## Resumo Executivo

Após diagnóstico que identificou 3 causas-raiz de bugs (viés de módulo Ovos, ausência de proteína em receitas de ovos, busca sem ranking), foram implementadas 8 correções. Todas validadas em preview Vercel.

---

## 1. Correção de Ranking de Busca — `lib/receitas.ts`

**Problema:** Busca por ingredientes retornava as primeiras receitas do JSON (módulo Ovos, índices 0–218) sem considerar relevância. Limite=12 cortava antes de chegar em Pudim (índice 947+).

**Solução implementada:**
- Score por ingrediente: conta quantos ingredientes pesquisados aparecem em cada receita
- Ordenação por score (descendente)
- Intercalação de módulos via round-robin (máx 3 por módulo por faixa de score)
- Agrupamento por faixa de score antes de intercalar (preserva relevância)

**Resultado verificado:** Busca "leite condensado" agora retorna 20 receitas de 6 módulos distintos (Doces, Pudim, Low Carb, Airfryer, Bolos, Brigadeiros) — zero viés de Ovos.

---

## 2. Correção do Limite do Agente — `app/agente/page.tsx`

**Problema:** `limit: "12"` cortava resultados antes de alcançar módulos menos representados no início do arquivo.

**Solução:** `limit: "12"` → `limit: "20"` em `buscarPorIngredientes()`.

---

## 3. Correção Regex Fração — `scripts/calcular_nutricao_r6.js`

**Problema:** Regex `[\d]+(?:[.,]\d+)?` capturava "1" antes de `[\d]+\/[\d]+` capturar "1/2". Resultado: "1/2 xícara" → qty=1 (errado, deveria ser 0.5). Afetava 633 receitas (31% da base).

**Solução:** Reordenação na alternância — fração testada PRIMEIRO:
```js
/^([\d]+\/[\d]+|[½⅓¼¾⅔]|\d+\s*[½⅓¼¾⅔]|\d+\s+[\d]+\/[\d]+|[\d]+(?:[.,]\d+)?)/
```

---

## 4. Correção "ovos frescos" — `data/conversao_medidas.json` + `scripts/calcular_nutricao_r6.js`

**Problema (duplo):**
- `"ovos": 50` em conversao_medidas.json fazia "4 ovos" ser parseado como qty=4, unit="ovos", nomeBruto="" (vazio) → retornava null
- "frescos" não era reconhecido como sufixo removível, resultando em nomeBruto="frescos" (inválido)

**Solução:**
- Removidas entradas `"ovo": 50` e `"ovos": 50` de conversao_medidas.json (ovos é alimento, não unidade de medida)
- Adicionados sufixos ao regex de limpeza: `fresco|frescos|fresca|frescas|inteiro|inteiros|inteira|inteiras|limpo|limpos|limpa|limpas`

---

## 5. Correção Threshold `disponivel` — `scripts/calcular_nutricao_r6.js`

**Problema:** `disponivel: tem_calculavel` ficava `true` quando água (0 kcal) era o único ingrediente calculável — 30 receitas com kcal_total=0 apareciam como "disponível".

**Solução:** `disponivel: tem_calculavel && kcal_total >= 5`

---

## 6. Reclassificação Módulo Ovos — `data/receitas_v1_app_LIMPA.json`

**Problema:** 55 receitas inequivocamente doces (pudins, mousses, bolos, pavês) estavam no módulo "Ovos" com IG incorreto (baixo, deveria ser alto).

**Método:** Análise nome + ingredientes por receita. Critério conservador — ambíguas permaneceram em Ovos.

**Resultado:**

| Destino | Qtd | Exemplos |
|---------|-----|---------|
| Pudim | +16 | MANJAR BRANCO, PUDIM DE LEITE CONDENSADO, FLAN DE BAUNILHA, QUINDÃO, PUDIM DE CHOCOLATE, COCO, CAFÉ, MILHO... |
| Doces e Sobremesas sem Fogo | +20 | CREME BRÛLÉE, PAVÊ DE CHOCOLATE, TIRAMISU, MOUSSE DE CHOCOLATE/MARACUJÁ, ARROZ DOCE, AMBROSIA, DOCE DE OVOS MOLES/PORTUGUÊS... |
| Bolos | +19 | BOLO NEGA MALUCA, MÁRMORE, PRESTÍGIO, FORMIGUEIRO, BOLO DE CENOURA, CHOCOLATE, LARANJA, LIMÃO, MUFFINS... |

**Módulos após reclassificação:**

| Módulo | Antes | Depois |
|--------|-------|--------|
| Ovos | 329 | **274** |
| Pudim | 186 | **202** |
| Doces e Sobremesas sem Fogo | 86 | **106** |
| Bolos | 31 | **50** |
| Demais | inalterados | inalterados |
| **TOTAL** | **2.027** | **2.027** |

---

## 7. Re-execução do Script de Nutrição

Após todas as correções acima, o script foi re-executado sobre a base reclassificada.

| Métrica | Valor |
|---------|-------|
| Receitas com nutrição disponível | **1.687** (83,2%) |
| Receitas com nutrição indisponível | **340** (16,8%) |
| kcal/porção mínimo | 3 kcal |
| kcal/porção máximo | 2.490 kcal |
| kcal/porção médio | 374 kcal |

**Melhoria em relação à Rodada 6:** +2 disponíveis, -2 indisponíveis (efeito do fix de kcal >= 5 threshold combinado com fix da fração).

**IG corrigido:** Pudins, Doces, Bolos reclassificados agora recebem IG "alto" (correto) em vez de "baixo" (era Ovos).

---

## 8. Correção de Subtítulos na Lista de Compras — `app/receita/[id]/ReceitaDetalhe.tsx`

**Problema:** Linhas como "Recheio: frango desfiado" eram completamente ignoradas pela lista de compras (o ingrediente "frango desfiado" se perdia). Linhas "Para o recheio:" eram corretamente ignoradas, mas o comportamento era uniforme — ambos os casos descartavam o conteúdo.

**Solução:** Nova função `processarParaLista()` em `adicionarNaLista()`:
- `"Recheio: frango desfiado"` → adiciona `"frango desfiado"` na lista (strip do label)
- `"Para o recheio:"` → null (label puro, ignorado)
- Ingrediente normal → passado sem alteração

A exibição na tela da receita permanece inalterada (mostra o subtítulo com label para legibilidade).

---

## 9. Deploy

| Item | Valor |
|------|-------|
| **Preview URL** | https://app-nutribela-1zvmysoog-viniciusmuraro-7382s-projects.vercel.app |
| **Inspect** | https://vercel.com/viniciusmuraro-7382s-projects/app-nutribela/ARfG5SN5TwHdWtxTK6Eo6SVDvnF7 |
| **Produção** (NÃO promover sem OK do Vinicius) | https://app-nutribela.vercel.app |

---

## 10. Screenshots Mobile (375px)

| Arquivo | Conteúdo |
|---------|----------|
| `public/sc-r7-01-home.png` | Home |
| `public/sc-r7-02-agente.png` | Agente — modo único |
| `public/sc-r7-03-busca-leite-condensado.png` | Busca "leite condensado" — 20 resultados, 6 módulos distintos, zero viés Ovos |
| `public/sc-r7-04-receita-pudim.png` | MANJAR BRANCO no módulo Pudim (IG alto correto) |
| `public/sc-r7-05-chat.png` | Chat Gemini |

---

## 11. Checklist de Aceite

- [x] Busca "leite condensado" retorna pudins, doces, brigadeiros — **zero viés de Ovos**
- [x] Busca por ingredientes usa score (qtd de matches) + intercalação de módulos
- [x] Agente usa limit=20
- [x] Regex de fração: "1/2 xícara" → 0.5 (era 1)
- [x] "4 ovos frescos" → kcal corretas (era ~1 kcal, agora ~286 kcal para 4 ovos)
- [x] 30 receitas com kcal=0 e disponivel=true → corrigidas (threshold kcal >= 5)
- [x] 55 receitas doces movidas de Ovos para módulos corretos (Pudim/Doces/Bolos)
- [x] IG corrigido para receitas reclassificadas (agora "alto" em vez de "baixo")
- [x] "Recheio: frango desfiado" → lista de compras recebe "frango desfiado" (não perde o ingrediente)
- [x] "Para o recheio:" → continua ignorado na lista de compras
- [x] Total de receitas: 2.027 (nenhuma removida)
- [x] Preview Vercel no ar e validado via Playwright
