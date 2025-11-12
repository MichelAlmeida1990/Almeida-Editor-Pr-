import type { NextRequest } from "next/server";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const MODEL_NAME = process.env.OLLAMA_MODEL ?? "llama3.1";

export async function POST(request: NextRequest) {
  try {
    const { text } = (await request.json()) as { text?: string };
    if (!text || !text.trim()) {
      return new Response(
        JSON.stringify({ error: "Texto vazio para correção." }),
        { status: 400 }
      );
    }

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: "system",
            content:
              "Você é um assistente que corrige ortografia e gramática em português brasileiro. Responda apenas com o texto corrigido, sem explicações adicionais.",
          },
          {
            role: "user",
            content: text,
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return new Response(
        JSON.stringify({ error: "Falha ao se comunicar com o Ollama", details: body }),
        { status: 502 }
      );
    }

    const payload = (await response.json()) as {
      message?: { content?: string };
    };

    const corrected = payload.message?.content?.trim();
    if (!corrected) {
      return new Response(
        JSON.stringify({ error: "Resposta inválida do Ollama." }),
        { status: 502 }
      );
    }

    return new Response(JSON.stringify({ corrected }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Spellcheck error", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar correção." }),
      { status: 500 }
    );
  }
}

