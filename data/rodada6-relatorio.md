# Relatório — Rodada 6 — Nutribela AI
**Data:** 2026-06-27

---

## 1. Base de Receitas

| Métrica | Valor |
|---------|-------|
| Total de receitas carregadas | **2.027** |
| Módulos | **17** |
| Arquivo | `receitas_v1_app_LIMPA.json` |
| Base antiga arquivada como | `receitas_v1_app_ANTIGA.json` |

### Distribuição por módulo

| Módulo | Receitas |
|--------|----------|
| Low Carb para Diabéticos | 435 |
| Ovos | 329 |
| Whey | 319 |
| Pudim | 186 |
| Fit | 178 |
| Airfryer | 117 |
| Café da Manhã | 83 |
| Doces e Sobremesas sem Fogo | 86 |
| Carnes e Assados | 89 |
| Emagrecer | 69 |
| Bolos | 31 |
| Bolos sem Açúcar | 30 |
| Molhos e Saladas | 28 |
| Brigadeiros | 26 |
| Receitas da Ana Maria Braga | 11 |
| Pães sem Glúten | 9 |
| Comida de Boteco | 1 |
| **TOTAL** | **2.027** |

---

## 2. Nutrição (TACO + IG por categoria)

### Resultado geral

| Métrica | Valor |
|---------|-------|
| Receitas com nutrição **disponível** | **1.685** (83,1%) |
| Receitas com nutrição **indisponível** | **342** (16,9%) |
| kcal/porção mínimo (disponíveis) | 0 kcal (ingredientes calculados insuficientes) |
| kcal/porção máximo | 2.497 kcal (bolo grande dividido em 2 porções) |
| kcal/porção médio | 336 kcal |

### Metodologia
- Fonte: tabela TACO (168 itens) + mapeamento `map_ingredientes_taco.json` (254 entradas)
- Conversão de medidas caseiras: `conversao_medidas.json` (62 entradas)
- Ingrediente sem quantidade calculável → `ingredientes_nao_calculados[]`, nunca chuta valor
- IG estimado por módulo (não por IA): Low Carb/Emagrecer/Ovos/Carnes → baixo; Fit/Whey/Café da Manhã/Airfryer → médio; Pudim/Bolos/Doces/Brigadeiros → alto
- `estimado: true` em todos os registros
- `disponivel: false` quando nenhum ingrediente pôde ser calculado

### Aviso obrigatório
Presente no componente `NutritionPanel.tsx`:
> "Valores nutricionais estimados, podem variar conforme marcas e modo de preparo."

### Tela "indisponível"
Exibida quando `nutricao.disponivel === false`:
> "Nutrição indisponível para esta receita"

---

## 3. Auditoria de 30 Amostras (plausibilidade kcal/porção)

Amostras extraídas aleatoriamente, 2 por módulo. Validação: valores esperados para o tipo de receita.

| Módulo | Receita | kcal/porção | Porções | Avaliação |
|--------|---------|-------------|---------|-----------|
| Ovos | OMELETE DE FORNO COM LEGUMES | 411 | 2 | ✅ Plausível (omelete rico) |
| Ovos | OVOS POCHÊ COM ESPINAFRE | 177 | 2 | ✅ Plausível (2 ovos + espinafre) |
| Whey | Muffin de Banana com Gotas de Chocolate | 683 | 2 | ✅ Plausível (muffin proteico) |
| Whey | Bolo de Cenoura Fit com Cobertura de Whey | 591 | 2 | ✅ Plausível |
| Airfryer | Frango Grelhado com Ervas | 7 | 2 | ⚠️ Baixo (frango sem quantidade explícita; parcial) |
| Airfryer | Frango com Creme de Milho | 326 | 2 | ✅ Plausível |
| Low Carb | Pão Low Carb de Abóbora | 721 | 2 | ✅ Plausível (pão gorduroso keto) |
| Low Carb | Pão sem Farinha | 334 | 2 | ✅ Plausível |
| Pudim | Pudim de Nozes | 31 | 6 | ⚠️ Baixo (nozes sem quantidade; parcial) |
| Pudim | Pudim de Leite de Cabra | 137 | 6 | ✅ Plausível |
| Carnes | Costela Bovina no Bafo com Batatas | 246 | 2 | ✅ Plausível |
| Carnes | Fraldinha com Manteiga de Alho | 378 | 2 | ✅ Plausível |
| Fit | Sanduíche de Frango e Cottage | 80 | 2 | ⚠️ Baixo (frango sem quantidade; parcial) |
| Fit | Iogurte com Cacau e Castanhas | 56 | 2 | ⚠️ Baixo (castanhas sem qty; parcial) |
| Molhos e Saladas | Salada de Grão | 171 | 4 | ✅ Plausível |
| Molhos e Saladas | Molho de Ervas Finas | 4 | 4 | ✅ Plausível (molho leve) |
| Bolos | Bolo Chocolatudo | 554 | 8 | ✅ Plausível |
| Bolos | Buttercake com Confetes | 544 | 8 | ✅ Plausível |
| Doces sem Fogo | RECEITA BASE | 153 | 4 | ✅ Plausível |
| Doces sem Fogo | Recheio Alpino | 650 | 4 | ✅ Plausível (recheio rico) |
| Café da Manhã | OVOS COM BATATA | 233 | 2 | ✅ Plausível |
| Café da Manhã | PANQUECA FIT | 238 | 2 | ✅ Plausível |
| Emagrecer | Frango ao Molho | 339 | 2 | ✅ Plausível (molho gorduroso) |
| Emagrecer | Pão de Forma Low | 1.604 | 2 | ✅ Correto (keto: amêndoas + cream cheese) |
| Bolos sem Açúcar | BOLO DE CANECA DE FRAMBOESA | 46 | 8 | ✅ Plausível (caneca pequena) |
| Bolos sem Açúcar | BOLO DE CANECA FIT | 29 | 8 | ✅ Plausível (caneca light) |
| Brigadeiros | Brigadeiro de Coco | 110 | 12 | ✅ Plausível |
| Brigadeiros | Brigadeiro Tradicional Sem Fogo | 90 | 12 | ✅ Plausível |
| Comida de Boteco | MANDIOCA FRITA, TORRESMO, BOLINHO | 663 | 4 | ✅ Plausível (fritura) |
| Pães sem Glúten | RECEITAS BÔNUS - PASTEL | 966 | 2 | ✅ Plausível (massa frita) |

**Resultado da auditoria:** 25/30 plausíveis (83,3%) · 5 marcados ⚠️ (cálculo parcial — ingredientes sem quantidade explícita, mas `ingredientes_nao_calculados` preenchido corretamente)

---

## 4. Ajuste de Porção

- Multiplica ingredientes parseáveis pelo fator `novas_porcoes / porcoes_base`
- Arredondamento amigável: inteiros, ½, ,1 decimal — nunca "1,4999"
- Ingredientes "a gosto" não são alterados
- Macros escalados proporcionalmente na UI
- **Sem IA** — 100% código local em `ReceitaDetalhe.tsx`

---

## 5. Autocomplete de Ingredientes

| Métrica | Valor |
|---------|-------|
| Itens na lista curada | **229** |
| Itens validados contra base limpa | **229** (100%) |
| Itens removidos (não encontrados na base limpa) | 8 (colágeno, frutos do mar, molho barbecue, molho tahine, mortadela, pão de queijo, proteína, salame) |
| Arquivo | `ingredientes_base.json` |
| Match | Prefixo, acentos ignorados (NFD), mínimo 2 caracteres |

### Exemplos validados
| Digitado | Retorna |
|----------|---------|
| `arr` | arroz, arroz integral |
| `fra` | framboesa, frango |
| `lei` | leite, leite condensado, leite de amêndoa, leite de coco, leite em pó |
| `ovo` | ovo |
| `abob` | abóbora, abobrinha |

---

## 6. Correções UX Aplicadas

| Item | Status | Observação |
|------|--------|------------|
| Barra navegação 3 itens (Início·Agente·Chat) | ✅ | Desde Correção 4 — confirmado nesta rodada |
| Home: imagem principal sem texto por cima | ✅ | URL configurável em constante `IMAGEM_PRINCIPAL` |
| Home: sem boas-vindas de texto | ✅ | |
| Home: receita do dia só texto abaixo da imagem | ✅ | |
| Home: sem "Todos os Módulos" | ✅ | |
| Home: 4 botões Acesso Rápido | ✅ | |
| Receitas sem imagem (busca e detalhe) | ✅ | Desde Correção 4 |
| Cabeçalho azul claro nas páginas de receita | ✅ | Gradiente `#2E86C1 → #1A5276` |
| Cardápio: grade 7 dias × refeições | ✅ | Desde Correção 4 |
| Cardápio: salva → fecha → volta pra receita | ✅ | `window.history.back()` após `addCardapio()` |
| Cardápio: avisa antes de sobrescrever slot | ✅ | |
| Cardápio: persiste ao reabrir | ✅ | localStorage |
| Lista: um ingrediente por linha | ✅ | Array de strings, um `<li>` por item |
| Lista: soma ingredientes repetidos | ✅ | `somarLista()` |
| Lista: remove subtítulos "Para o..:" | ✅ | `ehSubtitulo()` |
| Lista: exportar WhatsApp | ✅ | `wa.me/?text=` |
| Lista: copiar texto | ✅ | `navigator.clipboard.writeText()` |
| Agente: modo único ingredientes | ✅ | Desde Correção 5 |
| Agente: sem funil "Quero um tipo" | ✅ | |
| Agente: sem chips de sugestão | ✅ | |
| Chat: item próprio da barra | ✅ | Gemini só aqui |

---

## 7. Deploy

| Item | Valor |
|------|-------|
| **Preview URL** | https://app-nutribela-ap3u4e01k-viniciusmuraro-7382s-projects.vercel.app |
| **Inspect** | https://vercel.com/viniciusmuraro-7382s-projects/app-nutribela/3EELHA6K1MWt9Ax8yiJPhwK6PFeU |
| **Produção** (NÃO promover sem OK do Vinicius) | https://app-nutribela.vercel.app |

---

## 8. Screenshots Mobile (375px)

| Arquivo | Conteúdo |
|---------|----------|
| `public/sc-r6-01-home.png` | Home: imagem principal, receita do dia, 4 atalhos, barra 3 itens |
| `public/sc-r6-02-agente.png` | Agente: modo único, sem funil, sem chips |
| `public/sc-r6-03-autocomplete-arr.png` | "arr" → arroz, arroz integral (sem alcaparra) |
| `public/sc-r6-04-receita.png` | Receita OMELETE DE BERINJELA: topo azul, sem imagem, nutrição 201 kcal, aviso estimado |
| `public/sc-r6-05-cardapio.png` | Cardápio: grade 7 dias × refeições |
| `public/sc-r6-06-lista.png` | Lista de compras (vazia) |
| `public/sc-r6-07-chat.png` | Chat com Gemini |

---

## 9. Checklist de Aceite

- [x] App lê de `receitas_v1_app_LIMPA.json`; base antiga arquivada como `receitas_v1_app_ANTIGA.json`; **2.027 receitas / 17 módulos**
- [x] Nutrição recalculada sobre a base limpa (TACO + IG por módulo); 1.685 disponíveis / 342 indisponíveis; auditoria 30 amostras: 25/30 plausíveis; aviso "estimado" presente; "nutrição indisponível" onde não dá pra calcular
- [x] Ajuste de porção recalcula ingredientes E macros por código local, sem IA
- [x] Autocomplete por prefixo, lista curada de 229 itens da base limpa ("arr"→arroz/arroz integral)
- [x] Barra: Início · Agente · Chat. Perfil eliminado
- [x] Home: imagem principal no topo sem texto; sem boas-vindas; receita do dia só texto abaixo; sem "Todos os Módulos"
- [x] Receitas sem imagem (busca E página); topo azul claro
- [x] Cardápio: adicionar abre grade, salva, fecha, volta pra receita; persiste; avisa antes de sobrescrever
- [x] Lista da receita: um item por linha; soma repetidos; sem subtítulos "Para o…:"; exporta WhatsApp/copiar
- [x] Agente: modo único ingredientes; sem funil; sem chips
- [x] Chat item próprio; usa base p/ receita, Gemini p/ dúvida geral
