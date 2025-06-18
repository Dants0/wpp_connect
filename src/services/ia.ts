import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { ContextManager } from './contextManager';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.VERIFY_TOKEN_OPENAI,
});

const contextManager = new ContextManager();

export async function createMessageBot(
  data: string, 
  chatId: string,
  useContext: boolean = true
): Promise<string> {
  
  let prompt = `Você é um assistente útil no WhatsApp. Responda de forma breve e útil:\n\n`;
  
  if (useContext) {
    const context = contextManager.getContext(chatId);
    if (context.length > 0) {
      prompt += `Contexto das últimas mensagens:\n${context.join('\n')}\n\n`;
    }
  }
  
  prompt += `Pergunta atual: ${data}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500, // Limitar resposta
    });

    const botResponse = response.choices[0]?.message.content ?? "❌ Não consegui gerar uma resposta.";
    
    if (useContext) {
      contextManager.addMessage(chatId, `Usuário: ${data}`);
      contextManager.addMessage(chatId, `Bot: ${botResponse}`);
    }

    return botResponse;
  } catch (err: any) {
    console.error("❌ Erro ao gerar resposta:", err.message);
    
    if (err.code === 'insufficient_quota') {
      return "❌ Cota da API esgotada. Tente novamente mais tarde.";
    }
    
    if (err.code === 'rate_limit_exceeded') {
      return "❌ Muitas requisições. Aguarde um momento.";
    }
    
    return "❌ Houve um erro ao tentar pensar na resposta.";
  }
}

export { contextManager };