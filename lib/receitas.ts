import fs from "fs";
import path from "path";
import { Receita } from "./types";

let _cache: Receita[] | null = null;

export function carregarReceitas(): Receita[] {
  if (_cache) return _cache;
  const filePath = path.join(process.cwd(), "data", "receitas_FINAL.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  _cache = JSON.parse(raw) as Receita[];
  return _cache;
}

export function obterClassificacoes(): { tipo_geral: string; estilos: string[]; tipo_prato: string }[] {
  const todas = carregarReceitas();
  return todas.map((r) => ({
    tipo_geral: r.tipo_geral || "",
    estilos: r.estilos || [],
    tipo_prato: r.tipo_prato || "",
  }));
}

export function buscarReceitas(params: {
  q?: string;
  ingredientes?: string[];
  objetivo?: string;
  modulo?: string;
  restricoes?: string[];
  tipo_geral?: string;
  estilo?: string;
  tipo_prato?: string;
  limit?: number;
}): Receita[] {
  const todas = carregarReceitas();
  let resultado = todas;

  if (params.q) {
    // Tokeniza a query e busca receitas que contenham QUALQUER um dos termos
    const termos = params.q.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    if (termos.length > 0) {
      resultado = resultado.filter((r) =>
        termos.some(
          (termo) =>
            r.nome.toLowerCase().includes(termo) ||
            r.ingredientes.some((i) => i.toLowerCase().includes(termo)) ||
            (r.tags || []).some((t) => t.toLowerCase().includes(termo)) ||
            r.modulo.toLowerCase().includes(termo)
        )
      );
      // Rankear: mais termos correspondentes = mais relevante
      resultado = resultado.sort((a, b) => {
        const scoreA = termos.filter(
          (t) =>
            a.nome.toLowerCase().includes(t) ||
            a.modulo.toLowerCase().includes(t)
        ).length;
        const scoreB = termos.filter(
          (t) =>
            b.nome.toLowerCase().includes(t) ||
            b.modulo.toLowerCase().includes(t)
        ).length;
        return scoreB - scoreA;
      });
    }
  }

  if (params.ingredientes && params.ingredientes.length > 0) {
    const ingreds = params.ingredientes.map((i) => i.toLowerCase().trim());

    // Filtrar: receita precisa ter ao menos 1 ingrediente correspondente
    resultado = resultado.filter((r) =>
      ingreds.some((ing) =>
        r.ingredientes.some((ri) => ri.toLowerCase().includes(ing))
      )
    );

    // Rankear por score (quantos ingredientes pesquisados aparecem na receita)
    const scored = resultado.map((r) => ({
      receita: r,
      score: ingreds.filter((ing) =>
        r.ingredientes.some((ri) => ri.toLowerCase().includes(ing))
      ).length,
    }));
    scored.sort((a, b) => b.score - a.score);

    // Intercalar módulos para evitar dominância de um único módulo
    // Agrupa por score primeiro, depois aplica round-robin por módulo dentro de cada grupo de score
    function intercalarModulos(lista: typeof scored, maxPorModulo = 3): Receita[] {
      const grupos: Record<string, Receita[]> = {};
      lista.forEach(({ receita }) => {
        const mod = receita.modulo;
        if (!grupos[mod]) grupos[mod] = [];
        grupos[mod].push(receita);
      });
      const resultado: Receita[] = [];
      let temMais = true;
      while (temMais) {
        temMais = false;
        for (const mod of Object.keys(grupos)) {
          const lote = grupos[mod].splice(0, maxPorModulo);
          if (lote.length) {
            resultado.push(...lote);
            temMais = true;
          }
        }
      }
      return resultado;
    }

    // Separar por faixa de score para preservar ordenação por relevância
    const maxScore = scored.length > 0 ? scored[0].score : 0;
    const grupos: Record<number, typeof scored> = {};
    scored.forEach((item) => {
      if (!grupos[item.score]) grupos[item.score] = [];
      grupos[item.score].push(item);
    });

    const intercalado: Receita[] = [];
    // Percorrer scores do maior para o menor
    for (let s = maxScore; s >= 1; s--) {
      if (grupos[s] && grupos[s].length > 0) {
        intercalado.push(...intercalarModulos(grupos[s]));
      }
    }

    resultado = intercalado;
  }

  if (params.objetivo) {
    const obj = params.objetivo.toLowerCase();
    const mapeamento: Record<string, string[]> = {
      low_carb: ["Low Carb", "Fit", "Emagrecer", "Bolos sem Açúcar", "Pães sem Glúten"],
      diabetico: ["Low Carb", "Bolos sem Açúcar"],
      desinchar: ["Emagrecer", "Molhos e Saladas"],
      emagrecer: ["Emagrecer", "Fit", "Low Carb", "Airfryer"],
      ganho_massa: ["Whey", "Ovos", "Fit"],
      geral: [],
    };
    const termos = mapeamento[obj] || [];
    if (termos.length > 0) {
      const filtrados = resultado.filter((r) =>
        termos.some((t) => r.modulo.toLowerCase().includes(t.toLowerCase()))
      );
      if (filtrados.length >= 5) resultado = filtrados;
    }
  }

  if (params.modulo) {
    const mod = params.modulo.toLowerCase();
    resultado = resultado.filter((r) =>
      r.modulo.toLowerCase().includes(mod)
    );
  }

  // Filtros de classificação (funil)
  if (params.tipo_geral) {
    resultado = resultado.filter((r) => r.tipo_geral === params.tipo_geral);
  }
  if (params.estilo) {
    resultado = resultado.filter((r) => (r.estilos || []).includes(params.estilo!));
  }
  if (params.tipo_prato) {
    resultado = resultado.filter((r) => r.tipo_prato === params.tipo_prato);
  }

  // Filtro de restrições alimentares
  if (params.restricoes && params.restricoes.length > 0) {
    for (const r of params.restricoes) {
      if (r === "Sem Glúten") {
        resultado = resultado.filter(rec =>
          !rec.ingredientes.some(i =>
            /farinha\s+de\s+trigo|trigo|glúten|macarrão|massa\s+de\s+trigo/i.test(i)
          ) && !/trigo|pão\s+branco/i.test(rec.nome)
        );
      } else if (r === "Sem Lactose") {
        resultado = resultado.filter(rec =>
          !rec.ingredientes.some(i =>
            /leite(?!\s+de\s+coco|vegetal)|queijo|iogurte|manteiga|creme\s+de\s+leite|requeijão/i.test(i)
          )
        );
      } else if (r === "Sem Açúcar") {
        resultado = resultado.filter(rec =>
          !rec.ingredientes.some(i => /\baçúcar\b/i.test(i))
        );
      } else if (r === "Vegano") {
        resultado = resultado.filter(rec =>
          !rec.ingredientes.some(i =>
            /\bovos?\b|ovo|frango|carne|peixe|atum|camarão|leite(?!\s+de\s+coco)|queijo|manteiga|mel\b|iogurte/i.test(i)
          )
        );
      } else if (r === "Vegetariano") {
        resultado = resultado.filter(rec =>
          !rec.ingredientes.some(i =>
            /\bfrango\b|carne\s+moída|carne\s+bovina|patinho|alcatra|costela|peixe\b|atum\b|camarão\b|bacon\b|linguiça/i.test(i)
          )
        );
      } else if (r === "Sem Frutos do Mar") {
        resultado = resultado.filter(rec =>
          !rec.ingredientes.some(i =>
            /camarão|peixe|atum|salmão|tilápia|bacalhau|frutos\s+do\s+mar|mariscos|mexilhão/i.test(i)
          )
        );
      }
    }
  }

  const limit = params.limit || 20;
  return resultado.slice(0, limit);
}

export function buscarPorId(id: string): Receita | undefined {
  return carregarReceitas().find((r) => r.id === id);
}

export function receitaAleatoria(): Receita {
  const todas = carregarReceitas();
  return todas[Math.floor(Math.random() * todas.length)];
}

export function modulos(): string[] {
  const todas = carregarReceitas();
  return [...new Set(todas.map((r) => r.modulo))];
}
