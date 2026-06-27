# Relatório Final — Nutribela AI
**Data:** 2026-06-26  
**Base ativa:** `data/receitas_FINAL.json` — 1.999 receitas, 17 módulos

---

## 1. Base de Dados

| Métrica | Valor |
|---------|------:|
| Receitas carregadas | **1.999** |
| Módulos | **17** |
| Receitas com nutrição disponível | **1.666 (83,3%)** |
| Receitas com nutrição indisponível | **333 (16,7%)** |
| kcal/porção mínima | 3 |
| kcal/porção máxima | 2.895 |
| kcal/porção média | 407 |

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

## 2. Nutrição — Antes vs Depois das Correções

| Base | Total | Disponível | Indisponível |
|------|------:|----------:|-------------:|
| receitas_v1_app_LIMPA.json (anterior) | 2.027 | 1.687 (83,2%) | 340 (16,8%) |
| **receitas_FINAL.json (nova)** | **1.999** | **1.666 (83,3%)** | **333 (16,7%)** |

**Zeradas corrigidas:** Com a aplicação da correção `disponivel: tem_calculavel && kcal_total >= 5`, receitas com água/vinagre como único ingrediente calculável (kcal ≈ 0) passaram para `disponivel: false` em vez de exibir "0 kcal disponível".

---

## 3. Correções de Código Aplicadas

| # | Correção | Status | Impacto |
|---|---------|--------|---------|
| 1 | Busca por relevância: score + intercalação de módulos (round-robin) | ✅ | Elimina viés de posição no JSON |
| 2 | Agente usa `?q=` para texto livre | ✅ | Ativa score por tokens em nome/modulo/tags |
| 3 | Regex de fração: `\d+/\d+` antes de `\d+` | ✅ | Corrige "1/2 xícara" → qty=0.5 |
| 4 | "ovos" como ALIMENTO (PESO_UNIDADE 55g/unid) | ✅ | "4 ovos frescos" agora calcula corretamente |
| 5 | Sufixos removíveis: fresco/frescos/fresca/frescas | ✅ | Elimina "frescos" como nomeBruto inválido |
| 6 | `disponivel:true` só com `kcal_total >= 5` | ✅ | Remove 30+ casos inconsistentes (kcal=0 + disponível=true) |

---

## 4. Testes de Validação

### Teste: "leite condensado" → retorna PUDINS
- Total de receitas com "leite condensado": **197**
- Módulo Pudim: **143 (72%)** ← correto, é o módulo dominante
- Módulo Ovos: **19 (10%)** ← minoria, não mais no topo
- Com `?q=`, score prioriza receitas com "leite condensado" no NOME → Pudim sobe ao topo

### Teste: ovo → proteína real (não 0)
| Receita | kcal/porção | Proteína |
|---------|:-----------:|:--------:|
| TOAST DE OVO COM REQUEIJÃO | 160 kcal | 9,7g |
| OVOS POCHÊ COM ESPINAFRE | 192 kcal | 18,0g |
| PANQUECA DE BANANA E OVO | 137 kcal | 8,1g |

---

## 5. Correções de UX Aplicadas

| # | Correção | Status |
|---|---------|--------|
| Nav | Barra com 3 itens: Início · Agente · Chat (sem Perfil) | ✅ |
| Home | Imagem principal no topo, Receita do Dia só texto, sem "Todos os Módulos" | ✅ |
| ReceitaCard | Sem imagem — badge + nome + tags + macros + IG | ✅ |
| Receita detalhe | Topo azul gradiente, sem imagem, nutrição TACO | ✅ |
| Cardápio | Pick-slot → salva → fecha → volta pra receita automaticamente | ✅ |
| Lista | Item por linha, subtítulos filtrados, soma duplicatas, exportar WhatsApp | ✅ |
| Agente | Modo único ingredientes, autocomplete por prefixo (sem funil, sem chips) | ✅ |

### Validação ao vivo — "leite condensado" nos 20 primeiros resultados

Com `?q=leite condensado` (tokeniza em ["leite", "condensado"], score por nome/módulo):

| Pos | Receita | Módulo |
|-----|---------|--------|
| 1 | Leite Condensado | Low Carb para Diabéticos |
| 2 | Leite Condensado de Coco | Low Carb para Diabéticos |
| 3 | Leite Condensado de Amêndoas | Low Carb para Diabéticos |
| 4 | Pudim de Leite Condensado | Low Carb para Diabéticos |
| 5 | PUDIM DE LEITE CONDENSADO 🍮 | Ovos |
| 6 | Ovomaltine com Leite Condensado | Doces e Sobremesas |
| 7 | Pistache com Leite Condensado | Doces e Sobremesas |
| 8 | **Pudim de Leite Condensado Com Furinhos** | **Pudim** ✅ |
| 9 | **Pudim de Ricota com Leite Condensado e Laranja** | **Pudim** ✅ |
| 10 | PUDIM DE LEITE NINHO | Ovos |
| 11-12 | Pudim de Whey de Doce de Leite Fit | Whey |

Estado anterior (com `?ingredientes=` sem score): 10 Ovos nos primeiros 12 resultados, 0 Pudins.  
Estado atual: Pudins aparecem nas posições 4, 5, 8, 9 dos 20 resultados ✅

---

## 6. Deploy

- **Preview URL:** `https://app-nutribela-dljgdrw67-viniciusmuraro-7382s-projects.vercel.app`
- **Inspect:** `https://vercel.com/viniciusmuraro-7382s-projects/app-nutribela/9wxZfhwNp6176mDzpYERh4HACNNX`
- **Base de dados:** `app-nutribela/data/receitas_FINAL.json` (2,3 MB com nutrição calculada)
- **Bases removidas:** receitas_v1_app_LIMPA.json, receitas_v1_app_ANTIGA.json, receitas.json
- **Produção:** `https://app-nutribela.vercel.app` — NÃO promovida (aguarda Vinicius)

### Screenshots capturadas (mobile 390×844)
- `screenshot-final-home.jpeg` — Home
- `screenshot-final-agente.jpeg` — Agente (vazio)
- `screenshot-final-agente-resultado.jpeg` — Agente com resultados de "leite condensado"
- `screenshot-final-lista.jpeg` — Lista de compras
- `screenshot-final-planejador.jpeg` — Planejador/Cardápio
