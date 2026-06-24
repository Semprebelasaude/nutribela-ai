import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Receita } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { receitas, pedido, porcoes = 2 } = body as {
      receitas: Receita[];
      pedido: string;
      porcoes: number;
    };

    if (!receitas || receitas.length === 0) {
      return NextResponse.json({ erro: "Nenhuma receita para processar" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const receitasTexto = receitas
      .slice(0, 5)
      .map(
        (r, i) =>
          `RECEITA ${i + 1}: ${r.nome}\nIngredientes: ${r.ingredientes.join(", ")}\nPreparo: ${r.modo_preparo.slice(0, 300)}...\nRende: ${r.rende || "não informado"}`
      )
      .join("\n\n---\n\n");

    const prompt = `Você é um assistente nutricional especializado. Você tem acesso APENAS às seguintes receitas reais e não pode inventar novas.

PEDIDO DA USUÁRIA: "${pedido}" (para ${porcoes} pessoas)

RECEITAS DISPONÍVEIS:
${receitasTexto}

Sua tarefa:
1. Escolha as 3 melhores receitas para o pedido (ou menos se houver poucas)
2. Para cada receita selecionada, ajuste os ingredientes proporcionalmente para ${porcoes} pessoas
3. Estime calorias, proteínas (g), carboidratos (g) e gorduras (g) por porção
4. Classifique o índice glicêmico como "Baixo", "Médio" ou "Alto"
5. Adicione tags relevantes (ex: low carb, proteico, sem gluten, etc)

Responda APENAS em JSON válido no formato:
{
  "receitas": [
    {
      "nome": "Nome da receita",
      "ingredientes_ajustados": ["ingrediente ajustado 1", "ingrediente ajustado 2"],
      "modo_preparo": "texto completo do preparo",
      "porcoes": ${porcoes},
      "rende": "X porções",
      "calorias": 350,
      "proteina": 25,
      "carboidrato": 30,
      "gordura": 10,
      "indice_glicemico": "Baixo",
      "tags": ["tag1", "tag2"],
      "motivo": "Por que esta receita combina com o pedido"
    }
  ],
  "dica": "Uma dica nutricional curta sobre as receitas selecionadas"
}

IMPORTANTE: Calcule os valores nutricionais com base nos ingredientes reais listados. Os valores são estimativas — informe isso. Não invente receitas que não estejam na lista acima.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ erro: "Resposta inválida do Gemini", raw: text }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Enriquecer com os IDs originais
    const enriquecidas = parsed.receitas.map((r: Record<string, unknown>, i: number) => ({
      ...receitas[i],
      ...r,
      id: receitas[i]?.id || `gemini-${i}`,
    }));

    return NextResponse.json({ receitas: enriquecidas, dica: parsed.dica });
  } catch (err) {
    console.error("Erro Gemini:", err);
    return NextResponse.json({ erro: "Erro ao processar com Gemini" }, { status: 500 });
  }
}
