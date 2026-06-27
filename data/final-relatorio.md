# Relatório Final — Nutribela AI
**Data:** 2026-06-27  
**Base ativa:** `data/receitas_FINAL.json` — 1.999 receitas, 17 módulos  
**Preview:** `https://app-nutribela-4ezsqfem7-viniciusmuraro-7382s-projects.vercel.app`

---

## 1. Base de Dados

| Métrica | Valor |
|---------|------:|
| Receitas carregadas | **1.999** |
| Módulos | **17** |
| Com nutrição disponível | **1.666 (83,3%)** |
| Nutrição indisponível | **333 (16,7%)** |
| kcal/porção mín/máx/média | 3 / 2.895 / 407 |

### Distribuição de módulos

| Módulo | Receitas |
|--------|--------:|
| Low Carb para Diabéticos | 435 |
| Ovos | 329 |
| Whey | 319 |
| Pudim | 185 |
| Fit | 159 |
| Airfryer | 116 |
| Carnes e Assados | 87 |
| Doces e Sobremesas sem Fogo | 86 |
| Café da Manhã | 83 |
| Emagrecer | 69 |
| Bolos | 30 |
| Bolos sem Açúcar | 30 |
| Brigadeiros | 26 |
| Molhos e Saladas | 25 |
| Receitas da Ana Maria Braga | 10 |
| Pães sem Glúten | 9 |
| Comida de Boteco | 1 |

---

## 2. Correções de Código Aplicadas

| # | Correção | Arquivo | Status |
|---|---------|---------|--------|
| 1 | Busca por relevância: score + intercalação round-robin | `lib/receitas.ts` | ✅ |
| 2 | Agente usa `?q=` para texto livre (ingredientes joinados com espaço) | `app/agente/page.tsx` | ✅ |
| 3 | Regex de fração: `\d+/\d+` antes de `\d+` | `scripts/calcular_nutricao_r6.js` | ✅ |
| 4 | "ovos" como ALIMENTO (PESO_UNIDADE 55g/unid); sufixos fresco/frescos | `scripts/calcular_nutricao_r6.js` | ✅ |
| 5 | `disponivel:true` só com `kcal_total >= 5` | `scripts/calcular_nutricao_r6.js` | ✅ |
| 6 | Nutrição reprocessada na nova base | gerado pelo script | ✅ |
| + | **Limite 20 → 500** (varredura de toda a base) | `app/api/receitas/route.ts` | ✅ |
| + | **Scoring bônus**: frase exata no nome (+20) e ingredientes (+15) | `lib/receitas.ts` | ✅ |

---

## 3. Testes de Validação — Ao Vivo no Preview

### Teste A: "whey" — retorna 300+?

```
Resultado: 361 receitas encontradas ✅
(Whey: 319, Airfryer: 28, Brigadeiros: 3, Pudim: 3, Emagrecer: 3, outros: 5)
```

**Antes** (limit=20): apenas 20 resultados cortados.  
**Depois** (limit=500): 361 receitas varrendo toda a base.

---

### Teste B: "leite condensado" — retorna Pudim?

**Top 12 resultados ao vivo:**

| Pos | Receita | Módulo | Score |
|-----|---------|--------|------:|
| 1 | Pudim de Leite Condensado | Low Carb para Diabéticos | 55 |
| 2 | PUDIM DE LEITE CONDENSADO 🍮 | Ovos | 55 |
| 3 | Ovomaltine com Leite Condensado | Doces e Sobremesas | 55 |
| 4 | Pistache com Leite Condensado | Doces e Sobremesas | 55 |
| **5** | **Pudim de Leite Condensado Com Furinhos** | **Pudim** | **55** |
| **6** | **Pudim de Ricota com Leite Condensado e Laranja** | **Pudim** | **55** |
| 7 | Leite Condensado | Low Carb para Diabéticos | 40 |
| 8 | Leite Condensado de Coco | Low Carb para Diabéticos | 40 |
| 9 | Leite Condensado de Amêndoas | Low Carb para Diabéticos | 40 |
| 10 | PUDIM DE LEITE NINHO 🍼 | Ovos | 25 |
| **11** | **Pudim de Leite de Cabra (Sem Lactose)** | **Pudim** | **25** |
| 12 | DOCE DE LEITE COM OVOS 🍯 | Ovos | 25 |

**Total: 500 receitas encontradas, com 148 do módulo Pudim**

**Por que o score funciona agora:**
- Receitas que têm "leite condensado" no NOME + como INGREDIENTE → score 55
- Substitutos Low Carb (têm "leite condensado" no nome mas NÃO usam o ingrediente) → score 40
- Resultado: Pudim aparece nas posições 1, 2, 5, 6, 11 dos top-12

**Antes:** Low Carb substitutos nas posições 1-3, zero Pudim nos primeiros 8 resultados.

---

### Teste C: "ovo" — proteína real (não 0)?

| Receita | kcal/porção | Proteína |
|---------|:-----------:|:--------:|
| TOAST DE OVO COM REQUEIJÃO | 160 kcal | 9,7g ✅ |
| OVOS POCHÊ COM ESPINAFRE 🌿 | 192 kcal | 18,0g ✅ |
| PANQUECA DE BANANA E OVO 🍌 | 137 kcal | 8,1g ✅ |

**Antes** (bug "frescos" + "ovos" como unidade): kcal ≈ 0, proteína = 0.  
**Depois**: proteína real calculada via TACO (ovo = 55g/unidade em PESO_UNIDADE).

---

## 4. Correções de UX Aplicadas

| # | Correção | Status |
|---|---------|--------|
| Nav | Barra com 3 itens: Início · Agente · Chat (sem Perfil) | ✅ |
| Home | Imagem principal no topo, Receita do Dia só texto, sem "Todos os Módulos" | ✅ |
| ReceitaCard | Sem imagem — badge + nome + tags + macros + IG | ✅ |
| Topo | Azul claro gradiente em todas as páginas | ✅ |
| Cardápio | Pick-slot → salva → fecha → volta para receita automaticamente | ✅ |
| Lista | Item por linha, subtítulos filtrados, soma duplicatas, exportar WhatsApp | ✅ |
| Agente | Modo único ingredientes, autocomplete por prefixo min 2 chars (sem funil, sem chips) | ✅ |

---

## 5. Deploy

- **Preview:** `https://app-nutribela-4ezsqfem7-viniciusmuraro-7382s-projects.vercel.app`
- **GitHub:** `https://github.com/Semprebelasaude/nutribela-ai`
- **Produção:** `https://app-nutribela.vercel.app` — **PRONTO PARA PROMOVER, aguardando confirmação do Vinicius**

### Screenshots capturadas (mobile 390px)
- `sc-final-01-home.jpeg` — Home
- `sc-final-02-agente.jpeg` — Agente (vazio)
- `sc-final-03-leite-condensado.jpeg` — Resultado "leite condensado"
- `sc-final-04-whey.jpeg` — Resultado "whey" (361 receitas)

---

## 6. Nutrição — Antes vs Depois

| Base | Total | Disponível | Indisponível |
|------|------:|----------:|-------------:|
| receitas_v1_app_LIMPA.json (anterior, 2.027 receitas) | 2.027 | 1.687 (83,2%) | 340 (16,8%) |
| **receitas_FINAL.json (nova, 1.999 receitas)** | **1.999** | **1.666 (83,3%)** | **333 (16,7%)** |

Zeradas eliminadas: receitas com água/vinagre como único ingrediente calculável não são mais marcadas como `disponivel:true` (threshold `kcal_total >= 5`).
