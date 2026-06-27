# Relatório de Diagnóstico — Nutribela AI
**Data:** 2026-06-26  
**Investigador:** Claude Code (modo somente-leitura)  
**Base analisada:** `data/receitas_v1_app_LIMPA.json` — 2.027 receitas, 17 módulos

---

## SEÇÃO A — Busca e Módulo Exibido

### A1 — Como `buscarReceitas()` funciona (`lib/receitas.ts`)

A função aplica os filtros nesta ordem:

1. **Filtro `q` (texto livre):** tokeniza a query por espaços, descarta tokens com ≤ 2 caracteres, e mantém receitas onde **qualquer** token aparece em `nome`, `ingredientes[]`, `tags[]` ou `modulo`. Depois **reordena** por score (quantos tokens batem em `nome` ou `modulo`).

2. **Filtro `ingredientes`:** mantém receitas onde qualquer ingrediente da lista aparece como substring em qualquer `ingredientes[]` da receita. **Não há reordenação por score** — a ordem do array JSON é preservada.

3. **Filtro `objetivo`:** usa um mapeamento fixo de objetivo → lista de módulos e filtra por `r.modulo.includes(t)`. Para `geral` a lista é vazia e nenhum filtro é aplicado.

4. **Filtro `modulo`:** substring em `r.modulo`.

5. **Filtros de classificação:** `tipo_geral`, `estilo`, `tipo_prato` (comparação exata).

6. **Filtros de restrições:** regex contra ingredientes.

7. **Slice por limit** (padrão 20).

**Campos buscados em `q`:** `nome`, `ingredientes[]`, `tags[]`, `modulo`.  
**Não há filtro que exclua módulos** — qualquer módulo pode aparecer.

---

### A2 — Como os parâmetros chegam (`app/api/receitas/route.ts`)

O endpoint GET lê:
- `q` → string livre → passa para `buscarReceitas({ q })`
- `ingredientes` → string separada por vírgulas → `split(",")` → array → `buscarReceitas({ ingredientes })`
- `objetivo`, `modulo`, `restricoes`, `tipo_geral`, `estilo`, `tipo_prato`, `limit`

Não há pré-processamento ou validação extra. O parâmetro `ingredientes` e o parâmetro `q` são **caminhos distintos** — não há sobreposição.

---

### A3 — Como o Agente exibe o módulo (`app/agente/page.tsx`)

O agente busca **exclusivamente via `?ingredientes=`** (linha 132):
```ts
const params = new URLSearchParams({
  ingredientes: ingredientesValidos.join(","),
  objetivo,
  limit: "12",
});
```

**Não há campo `q`** no agente. A busca do agente nunca usa tokenização nem reordenação por score.

O `ReceitaCard` exibe `receita.modulo` diretamente (linha 35 do componente) — sem nenhuma inferência. O que aparece no badge é exatamente o campo `modulo` de cada receita.

---

### A4 — Distribuição de módulos nos primeiros 300 itens do JSON

```
Posição 0..218    → Ovos (219 receitas)
Posição 219..535  → Whey (parcial)
```

**Resultado da análise Node:**

| Módulo | Primeiros 300 itens | Global |
|--------|--------------------:|-------:|
| Ovos   | 219 (73%)           | 329 (16,2%) |
| Whey   | 81 (27%)            | 319 (15,7%) |

O JSON está **ordenado em blocos**: os 219 Ovos ocupam as posições 0–218, Whey vem a seguir (219–535), depois Airfryer (536–573), Low Carb (574–946), Pudim (947+). O módulo maior (Low Carb, 435 receitas) só começa no índice 574.

**Isso explica o viés:** toda busca por ingredientes que não usa `q` (e portanto não reordena por score) retorna os resultados na ordem natural do JSON. Se o ingrediente buscado aparecer em receitas do módulo Ovos (que começa no índice 0), essas receitas chegam primeiro.

---

### A5 — Busca simulada por "leite condensado"

**ATENÇÃO:** O agente usa `?ingredientes=`, não `?q=`. As duas buscas têm comportamento diferente.

**Busca via `?ingredientes=leite condensado` (o que o agente faz):**
- Total encontrado: **198 receitas**
- Ordem dos primeiros 12: 10 do módulo **Ovos**, depois Low Carb

```
1  Ovos | PAVÊ DE CHOCOLATE
2  Ovos | MANJAR BRANCO
3  Ovos | Distribua em taças   ← receita malformada (nome é instrução de preparo)
4  Ovos | PUDIM DE LEITE NINHO
5  Ovos | PUDIM DE CHOCOLATE
6  Ovos | PUDIM DE COCO
7  Ovos | PUDIM DE CAFÉ
8  Ovos | PUDIM DE MILHO
9  Ovos | PUDIM DE AMEIXA
10 Ovos | PUDIM ROMEU E JULIETA
11 Low Carb para Diabéticos | Bolo de Chocolate e Limão
12 Low Carb para Diabéticos | Pudim de Leite Condensado
```

Distribuição por módulo nos 198 resultados:

| Módulo | Resultados |
|--------|----------:|
| Pudim  | 144 (73%) |
| Brigadeiros | 20 |
| Ovos   | 19 |
| Doces e Sobremesas | 7 |
| Low Carb | 6 |
| Airfryer | 2 |

O módulo Pudim tem **144 de 198** receitas com leite condensado. Porém, os 19 do módulo Ovos aparecem **antes** no JSON (índices 186–245) enquanto as 144 do módulo Pudim começam no índice 947. O `slice(0, 12)` corta antes de chegar ao módulo Pudim.

**Por que aparece "ovo e low carb"?** As receitas de Ovos com leite condensado são, na realidade, pudins e doces (Pavê, Manjar, Pudim de Chocolate, Pudim de Coco) **incorretamente categorizados no módulo Ovos** na base. O módulo Pudim verdadeiro está depois no JSON e é cortado pelo limit.

**Busca via `?q=leite condensado` (não é o que o agente usa):**
- Tokens: `['leite', 'condensado']` (ambos > 2 chars)
- Total: 888 receitas (muito mais amplo — bate em qualquer receita com "leite" em qualquer campo)
- O score reordena: receitas com "leite condensado" no nome ficam no topo
- Primeiros resultados: 3 receitas Low Carb, depois módulo Pudim

---

### A6 — "leite condensado" no `ingredientes_base.json`

`leite condensado` **está presente** no arquivo de autocomplete (posição exata confirmada).

```json
["leite", "leite condensado", "leite de amêndoa", "leite de coco", "leite em pó"]
```

Total de ingredientes no autocomplete: **229 itens**.

---

## SEÇÃO B — Nutrição Zerada

### B7 — Receita "Ovos Pochê Clássicos"

Existem **duas** entradas com esse nome na base:

**`nb-0075` — OVOS POCHÊ CLSSICOS (nome sem acento, sem emoji)**
```json
"ingredientes": [
  "4 ovos frescos",
  "2 litros de água 2 colheres de sopa de vinagre branco",
  "Sal"
]
"nutricao": { "kcal_porcao": 0, "proteina_g": 0, "disponivel": true }
```
> O segundo ingrediente é **duas instruções fundidas em uma linha** ("2 litros de água" + "2 colheres de sopa de vinagre branco"). O parser trata como um único ingrediente de nomeBruto = "água 2 colheres de sopa de vinagre branco" → encontra agua (0 kcal) no TACO → `tem_calculavel = true` com soma de 0 kcal.

**`nb-2294` — OVOS POCHÊ CLÁSSICOS (com emoji 💧)**
```json
"ingredientes": [
  "4 ovos frescos",
  "2 litros de água",
  "2 colheres de sopa de vinagre branco",
  "Sal"
]
"nutricao": { "kcal_porcao": 1, "proteina_g": 0, "disponivel": true }
```
> "2 litros de água" → 2000g de agua (0 kcal) → `tem_calculavel = true`. "2 colheres de sopa de vinagre branco" → 30g de vinagre (4 kcal/100g) → 1,2 kcal. Total: 1 kcal / 2 porções = **1 kcal/porção**.

**Por que "4 ovos frescos" não é calculado?**

O arquivo `conversao_medidas.json` registra `"ovos" → 50` como **unidade de medida** (50g por unidade). Quando o parser encontra "4 ovos frescos":
1. `qty = 4`
2. `unitFound = "ovos"` (unitGrams = 50) ← `ovos` é interpretado como unidade, não ingrediente
3. `resto = "frescos"` (o que sobrou após remover "ovos")
4. `nomeBruto = "frescos"` ← nome inválido
5. `buscarTaco("frescos")` → não encontrado → `nao_calculados`

O ingrediente "4 ovos frescos" falha porque `"frescos"` não é um sufixo previsto na regex de limpeza (`peneirado|picado|cozido|ralado...` mas **não `fresco`**), e `"ovos"` está registrado tanto no `conversao_medidas.json` (como unidade de peso) quanto no `map_ingredientes_taco.json` (como ingrediente). O parser prioriza o match de unidade.

---

### B8 — Receitas com `disponivel=true` e `kcal_porcao < 5`

**Total: 41 receitas** (17 com kcal = 1, 14 com kcal = 0, resto com 2–4)

Padrão dominante: o `tem_calculavel` é ativado por um ingrediente de **caloria nula ou mínima** (água, vinagre, fermento em pó, xícara de alecrim) enquanto o ingrediente principal (ovos, gemas, claras, açúcar, frango) falha no parser por razões diversas.

Exemplos representativos dos primeiros 10:

| Nome | kcal/porção | Ingrediente principal falhando |
|------|:-----------:|-------------------------------|
| OVOS POCHÊ CLSSICOS (nb-0075) | 0 | "4 ovos frescos" → nomeBruto="frescos" |
| PAPO DE ANJO | 1 | "6 gemas" → gema não é unidade, mas falta fração → qty=null; "1/2 xícara de açúcar" → bug regex |
| Frango Assado | 0 | "1 Frango inteiro de 1,5Kg limpo" → qty ambíguo |
| Purê de Couve Flor | 4 | "1 Couve flor" → peso padrão não previsto |
| Pasta de Amendoim | 0 | "500 Gramas de amendoim" → "Gramas" com G maiúsculo não casa regex |
| Chá de Hibisco | 0 | flores de hibisco não mapeadas |

---

### B9 — Receitas com `kcal_porcao === 0` e `disponivel === true`

**Total: 30 receitas** — estado inconsistente confirmado.

Esses 30 casos passaram pelo critério `tem_calculavel = true` porque **pelo menos um ingrediente** foi calculado com êxito (geralmente água ou vinagre, que têm kcal ≈ 0 na TACO), mas o ingrediente energético principal falhou.

---

### B10 — Fluxo de decisão `disponivel` no `calcular_nutricao_r6.js`

O script usa a flag booleana `tem_calculavel`, inicializada em `false`:

```js
let tem_calculavel = false;
// ...
for (const ing of receita.ingredientes) {
  const parsed = parseIngrediente(ing);
  if (!parsed) { nao_calculados.push(ing); continue; }
  const tacoItem = buscarTaco(parsed.nomeBruto);
  if (!tacoItem) { nao_calculados.push(ing); continue; }
  // ... calcula gramas ...
  if (gramas <= 0 || gramas > 2000) { nao_calculados.push(ing); continue; }
  // Chega aqui: ingrediente válido
  kcal_total += tacoItem.kcal * fator;
  // ...
  tem_calculavel = true;  // ← basta UM ingrediente chegar aqui
}
```

**Bug de lógica:** `tem_calculavel = true` é ativado tão logo **um único ingrediente** seja calculado com sucesso — mesmo que esse ingrediente contribua com 0 kcal (água, vinagre). O resultado é `disponivel = true` com `kcal_porcao = 0` ou `= 1`.

**Condição em que isso acontece:**
- A receita tem ingrediente de baixíssima caloria (água, vinagre) que o parser resolve com sucesso
- O ingrediente energético principal (ovos, frango, açúcar, claras, gemas) falha por um dos bugs listados abaixo

**Bugs identificados no parser:**

1. **Bug da fração sem espaço** (`1/2 x`, `1/3 x`, `1/4 x`): A regex de captura de quantidade usa alternância onde `[\d]+(?:[.,]\d+)?` (que captura só `"1"`) vem **antes** de `[\d]+\/[\d]+` (que captura `"1/2"`). JavaScript avalia da esquerda para direita e para no primeiro match. "1/2 xícara" → `qty = 1`, `resto = "/2 xícara de açúcar"` → falha total. **1.079 ingredientes** afetados em **633 receitas**.

2. **Bug do adjetivo "frescos"**: `"ovos"` está em `conversao_medidas.json` como unidade (50g/unidade). Em "4 ovos frescos", o parser interpreta `"ovos"` como unidade e sobra `"frescos"` como nomeBruto — inválido. A lista de sufixos a remover (`peneirado|picado|cozido|ralado...`) não inclui `fresco/frescos`.

3. **Bug de linha fundida**: "2 litros de água 2 colheres de sopa de vinagre branco" (linha única com duas medidas) é tratada como um único ingrediente, gerando `nomeBruto = "água 2 colheres de sopa de vinagre branco"`. O prefixo "água" é encontrado no mapa TACO (0 kcal) → `tem_calculavel = true` com caloria zero.

4. **Bug de maiúscula em unidade**: "500 Gramas de amendoim" — a regex de pesos usa `/^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l)\b/i` (case-insensitive), mas a lógica de peso solto usa `/^(g|kg|ml|l)\b/i`. "Gramas" (palavra completa) não está em nenhuma das duas ramificações. Sobra nomeBruto = "gramas de amendoim" → não encontrado.

5. **Bug de "Calda:"**: Ingredientes prefixados com "Calda: " (seção de calda incorporada na lista) → matchNum não captura nada (começa com "C") → `qty = null`, `unitGrams = null` → `nao_calculados`.

---

## SEÇÃO C — Causa Raiz e Propostas de Correção

### C11 — Causa raiz por sintoma

#### Sintoma 1: Viés "Ovos"

**Causa raiz:** O JSON da base de dados está **ordenado em blocos por módulo**, com o módulo "Ovos" (329 receitas) nos índices 0–218. A busca por ingredientes (`?ingredientes=`) não aplica nenhuma reordenação por relevância — retorna na ordem do array. O `slice(0, limit)` corta depois de ~12 resultados, todos do início do array. Qualquer ingrediente que apareça em receitas do módulo Ovos (que vêm primeiro) retornará Ovos no topo.

Agravante: 55 receitas no módulo Ovos têm nomes de sobremesas/doces (Pudim de Coco, Bolo de Coco, Manjar, Pavê, Arroz Doce, Tiramisu, Crème Brûlée), pois foram categorizadas no módulo errado na curadoria da base.

#### Sintoma 2: Busca por "leite condensado" não retorna Pudins

**Causa raiz:** Dupla:
1. O modo de busca do agente é `?ingredientes=`, que não reordena por relevância. Das 198 receitas com "leite condensado" como ingrediente, as 19 do módulo Ovos estão nos índices 186–245 (chegam primeiro) enquanto as 144 do módulo Pudim estão nos índices 947+ (ficam de fora do slice de 12).
2. A busca `?q=leite condensado` (com tokenização e score) funcionaria melhor — encontra 888 receitas e reordena por relevância — mas o agente não a usa.

#### Sintoma 3: Nutrição zerada/errada

**Causa raiz:** Três bugs independentes no script `calcular_nutricao_r6.js`:

1. **Bug principal — regex de fração:** A alternância na regex de `matchNum` captura "1" de "1/2 xícara" em vez de "1/2". Afeta **1.079 ingredientes** em **633 receitas** (31% da base). Quantidades como `1/2 xícara de açúcar`, `1/3 de leite`, `1/4 de manteiga` são descartadas.

2. **Bug secundário — "ovos frescos":** `"ovos"` em `conversao_medidas.json` como unidade consome o token, deixando "frescos" como nomeBruto inválido. O adjetivo "frescos" não está na lista de sufixos removíveis.

3. **Bug de lógica — `tem_calculavel`:** Basta 1 ingrediente com 0 kcal (água, vinagre) ser calculado com sucesso para `disponivel = true`. Isso gera 30 receitas com `disponivel = true` e `kcal_porcao = 0` — estado logicamente inconsistente exibido ao usuário.

---

### C12 — Correções propostas (apenas descrição)

#### Para o Viés "Ovos"

**Correção A (imediata, no backend):** Embaralhar ou reordenar a base por módulo de forma equilibrada antes do slice. Alternativa: após o filtro, aplicar um sort secundário que misture os módulos (ex: interleaving round-robin) quando nenhum score específico é pedido.

**Correção B (na busca):** Quando o usuário digita texto no agente, usar `?q=` em vez de `?ingredientes=` para ativar a reordenação por score.

**Correção C (na base):** Reclassificar as ~55 receitas de sobremesas/doces que estão no módulo Ovos. Pudim de Coco, Manjar Branco, Pavê, Arroz Doce, Tiramisu, Crème Brûlée e similares pertencem a módulos como Pudim, Doces e Sobremesas sem Fogo, ou Bolos.

#### Para a busca "leite condensado"

**Correção A:** Adicionar campo de busca de texto livre (`q`) no agente, paralelo ao modo de ingredientes. Isso ativa o score e retorna resultados relevantes independente da posição no JSON.

**Correção B:** No filtro por ingredientes, aplicar uma reordenação por "número de ingredientes coincidentes" antes do slice, e dentro de empates, preferir módulos semanticamente mais específicos (ex: Pudim antes de Ovos quando a query for "leite condensado").

**Correção C (na base):** Garantir que as 19 receitas do módulo Ovos que contêm leite condensado (Pavê, Manjar, Pudim de Leite Ninho, Pudim de Chocolate, Pudim de Coco, etc.) sejam reclassificadas para seus módulos corretos — o que resolve ao mesmo tempo o viés "Ovos".

#### Para a Nutrição zerada

**Correção 1 — regex de fração (crítico, 633 receitas afetadas):**
Reordenar a alternância na regex de `matchNum` para testar `[\d]+\/[\d]+` **antes** de `[\d]+(?:[.,]\d+)?`:
```js
// Antes (bugado):
/^([\d]+(?:[.,]\d+)?(?:\s+[\d]+\/[\d]+)?|[\d]+\/[\d]+|...)/
// Depois (correto):
/^([\d]+\/[\d]+|[\d]+(?:[.,]\d+)?(?:\s+[\d]+\/[\d]+)?|...)/
```

**Correção 2 — sufixo "frescos":**
Adicionar `fresco|frescos|fresca|frescas` na regex de limpeza de sufixos do `nomeBruto`:
```js
nomeBruto.replace(/\s+(fresco|frescos|fresca|frescas|peneirado|...)/, '')
```

**Correção 3 — lógica `tem_calculavel`:**
Adicionar um threshold mínimo: `disponivel = true` apenas se `kcal_total >= 5` (ou um valor razoável). Alternativamente, exigir que o ingrediente calculado contribua com caloria significativa (não apenas água/vinagre).
```js
disponivel: tem_calculavel && kcal_total >= 5
```
Isso evita os 30 casos de `disponivel=true` com `kcal_porcao=0`.

**Correção 4 — unidade ambígua "ovo/ovos":**
Remover `"ovo"` e `"ovos"` de `conversao_medidas.json` como unidades de medida (eles já estão em `map_ingredientes_taco.json` como ingredientes). Quando a unidade não é encontrada e o token é um alimento conhecido em `PESO_UNIDADE`, o caminho correto já funciona: `pesoUnidade("ovos") = 55` e `temPesoConhecido = true`. Manter apenas em `PESO_UNIDADE`.

**Correção 5 — re-rodar o script:**
Após as correções 1–4, re-rodar `calcular_nutricao_r6.js` para regerar `receitas_v1_app_LIMPA.json`. As 633 receitas afetadas pela fração e as 30+ com kcal zerada devem ser recalculadas.

---

## APÊNDICE — Dados Quantitativos

### Base de dados
| Métrica | Valor |
|---------|------:|
| Total de receitas | 2.027 |
| Módulo com mais receitas | Low Carb para Diabéticos (435, 21,5%) |
| Módulo Ovos (2º maior) | 329 (16,2%) |
| Posição do módulo Ovos no JSON | Índices 0–218 (primeiro bloco) |
| Receitas no módulo Ovos com nome de sobremesa/doce | 55 |
| Receitas no módulo Ovos sem ovo nos ingredientes | 15 |

### Nutrição
| Métrica | Valor |
|---------|------:|
| Receitas com `disponivel = true` | 1.685 (83%) |
| Receitas com `disponivel = false` | 342 (17%) |
| Receitas com `disponivel=true` e `kcal_porcao = 0` (inconsistente) | 30 |
| Receitas com `disponivel=true` e `kcal_porcao < 5` (quase zerado) | 41 |
| Ingredientes com fração sem espaço (ex: `1/2 xícara`) | 1.079 |
| Receitas afetadas pelo bug da fração | 633 (31% da base) |

### Autocomplete
| Métrica | Valor |
|---------|------:|
| Total de ingredientes no autocomplete | 229 |
| "leite condensado" presente | Sim |

### Busca por "leite condensado" via `?ingredientes=`
| Métrica | Valor |
|---------|------:|
| Total de resultados | 198 |
| Módulo Pudim nos resultados | 144 (73%) |
| Módulo Ovos nos resultados | 19 (10%) |
| Posição dos primeiros resultados Ovos no JSON | Índices 186–245 |
| Posição dos primeiros resultados Pudim no JSON | Índice 947+ |
| Resultados do módulo Pudim visíveis no limit=12 | 0 (todos cortados) |
