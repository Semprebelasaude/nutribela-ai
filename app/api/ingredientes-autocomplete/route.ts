import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

let _cache: string[] | null = null;

function carregarIngredientes(): string[] {
  if (_cache) return _cache;
  const filePath = path.join(process.cwd(), "data", "ingredientes_base.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  _cache = JSON.parse(raw) as string[];
  return _cache;
}

export async function GET() {
  const ingredientes = carregarIngredientes();
  return NextResponse.json(ingredientes);
}
