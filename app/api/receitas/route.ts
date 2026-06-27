import { NextRequest, NextResponse } from "next/server";
import { buscarReceitas, receitaAleatoria, buscarPorId, carregarReceitas, obterClassificacoes } from "@/lib/receitas";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const ingredientesRaw = searchParams.get("ingredientes");
  const objetivo = searchParams.get("objetivo") || undefined;
  const modulo = searchParams.get("modulo") || undefined;
  const restricoesRaw = searchParams.get("restricoes");
  const tipoGeral = searchParams.get("tipo_geral") || undefined;
  const estilo = searchParams.get("estilo") || undefined;
  const tipoPrato = searchParams.get("tipo_prato") || undefined;
  const id = searchParams.get("id");
  const aleatorio = searchParams.get("aleatorio");
  const modulosCount = searchParams.get("modulosCount");
  const classificacoes = searchParams.get("classificacoes");
  const limit = parseInt(searchParams.get("limit") || "20");

  if (id) {
    const receita = buscarPorId(id);
    if (!receita) return NextResponse.json({ erro: "Receita não encontrada" }, { status: 404 });
    return NextResponse.json(receita);
  }

  if (aleatorio === "1") {
    return NextResponse.json(receitaAleatoria());
  }

  if (classificacoes === "1") {
    return NextResponse.json(obterClassificacoes());
  }

  if (modulosCount === "1") {
    const todas = carregarReceitas();
    const contagem = todas.reduce((acc, r) => {
      acc[r.modulo] = (acc[r.modulo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const lista = Object.entries(contagem)
      .map(([nome, count]) => ({ nome, count }))
      .sort((a, b) => b.count - a.count);
    return NextResponse.json({ modulos: lista });
  }

  const ingredientes = ingredientesRaw
    ? ingredientesRaw.split(",").map((i) => i.trim()).filter(Boolean)
    : undefined;

  const restricoes = restricoesRaw
    ? restricoesRaw.split(",").map((r) => r.trim()).filter(Boolean)
    : undefined;

  const receitas = buscarReceitas({ q, ingredientes, objetivo, modulo, restricoes, tipo_geral: tipoGeral, estilo, tipo_prato: tipoPrato, limit });
  return NextResponse.json({ total: receitas.length, receitas });
}
