import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buscarReceitas } from "@/lib/receitas";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { mensagem } = await req.json() as { mensagem: string };
    if (!mensagem?.trim()) return NextResponse.json({ erro: "Mensagem vazia" }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Detectar se é pedido de receita
    const ehPedidoReceita = /receita|ingrediente|como\s+fazer|fazer\s+um|como\s+preparo|tenho\s+em\s+casa/i.test(mensagem);

    let prompt: string;
    if (ehPedidoReceita) {
      // Buscar receitas relevantes na base
      const receitas = buscarReceitas({ q: mensagem, limit: 5 });
      const receitasTexto = receitas.map(r =>
        `- ${r.nome} (${r.modulo}): ${r.ingredientes.slice(0, 5).join(", ")}...`
      ).join("\n");

      prompt = `Você é a assistente de culinária do app Nutribela AI.
Quando perguntarem sobre receitas, use APENAS as receitas do nosso acervo. NUNCA invente uma receita atribuindo à Nutribela.

Receitas encontradas para "${mensagem}":
${receitasTexto.length > 0 ? receitasTexto : "Nenhuma receita encontrada para esta busca."}

Responda a mensagem do usuário usando APENAS essas receitas. Se não há receitas adequadas, diga que não temos essa receita no acervo e sugira alternativas dentro do que temos.

Mensagem do usuário: "${mensagem}"`;
    } else {
      prompt = `Você é a assistente de culinária e nutrição do app Nutribela AI. Responda dúvidas gerais de cozinha e nutrição de forma clara, prática e amigável, em português.

Pergunta: "${mensagem}"`;
    }

    const result = await model.generateContent(prompt);
    return NextResponse.json({ resposta: result.response.text() });
  } catch (err) {
    console.error("Erro chat:", err);
    return NextResponse.json({ erro: "Erro ao processar" }, { status: 500 });
  }
}
