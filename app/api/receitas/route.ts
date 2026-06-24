import { NextRequest, NextResponse } from "next/server";
import { buscarReceitas, receitaAleatoria, buscarPorId } from "@/lib/receitas";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const ingredientesRaw = searchParams.get("ingredientes");
  const objetivo = searchParams.get("objetivo") || undefined;
  const modulo = searchParams.get("modulo") || undefined;
  const id = searchParams.get("id");
  const aleatorio = searchParams.get("aleatorio");
  const limit = parseInt(searchParams.get("limit") || "20");

  if (id) {
    const receita = buscarPorId(id);
    if (!receita) return NextResponse.json({ erro: "Receita não encontrada" }, { status: 404 });
    return NextResponse.json(receita);
  }

  if (aleatorio === "1") {
    return NextResponse.json(receitaAleatoria());
  }

  const ingredientes = ingredientesRaw
    ? ingredientesRaw.split(",").map((i) => i.trim()).filter(Boolean)
    : undefined;

  const receitas = buscarReceitas({ q, ingredientes, objetivo, modulo, limit });
  return NextResponse.json({ total: receitas.length, receitas });
}
