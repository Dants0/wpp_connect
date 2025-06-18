import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.VERIFY_TOKEN_OPENAI,
});

export async function createMessageBot(data: string): Promise<string> {
  const prompt = `Você é um amigo no Whatsapp. Apenas responda o seguinte comando de forma breve e útil, sem contexto, sem interagir diretamente com os envolvidos, apennas cumpra como que foi pedido!:\n\n${data}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return response.choices[0]?.message.content ?? "❌ Não consegui gerar uma resposta.";
  } catch (err: any) {
    console.error("❌ Erro ao gerar resposta:", err.message);
    return "❌ Houve um erro ao tentar pensar na resposta.";
  }
}
