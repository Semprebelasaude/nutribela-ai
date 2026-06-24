import fs from "fs";
import path from "path";
import { Receita } from "./types";

let _cache: Receita[] | null = null;

export function carregarReceitas(): Receita[] {
  if (_cache) return _cache;
  const filePath = path.join(process.cwd(), "data", "receitas.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  _cache = JSON.parse(raw) as Receita[];
  return _cache;
}

export function buscarReceitas(params: {
  q?: string;
  ingredientes?: string[];
  objetivo?: string;
  modulo?: string;
  limit?: number;
}): Receita[] {
  const todas = carregarReceitas();
  let resultado = todas;

  if (params.q) {
    const termo = params.q.toLowerCase();
    resultado = resultado.filter(
      (r) =>
        r.nome.toLowerCase().includes(termo) ||
        r.ingredientes.some((i) => i.toLowerCase().includes(termo)) ||
        (r.tags || []).some((t) => t.toLowerCase().includes(termo))
    );
  }

  if (params.ingredientes && params.ingredientes.length > 0) {
    const ingreds = params.ingredientes.map((i) => i.toLowerCase().trim());
    resultado = resultado.filter((r) =>
      ingreds.some((ing) =>
        r.ingredientes.some((ri) => ri.toLowerCase().includes(ing))
      )
    );
  }

  if (params.objetivo) {
    const obj = params.objetivo.toLowerCase();
    const mapeamento: Record<string, string[]> = {
      low_carb: ["low carb", "diabetico", "fit", "emagrecer"],
      diabetico: ["diabetico", "low carb", "sem açucar", "diet"],
      desinchar: ["desinchar", "detox", "cha", "salada"],
      emagrecer: ["emagrecer", "fit", "light", "detox"],
      ganho_massa: ["whey", "proteina", "fitness"],
      geral: [],
    };
    const termos = mapeamento[obj] || [];
    if (termos.length > 0) {
      const filtrados = resultado.filter(
        (r) =>
          termos.some(
            (t) =>
              r.nome.toLowerCase().includes(t) ||
              r.modulo.toLowerCase().includes(t) ||
              (r.tags || []).some((tag) => tag.toLowerCase().includes(t))
          )
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
