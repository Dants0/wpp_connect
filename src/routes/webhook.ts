import { createMessageBot, contextManager } from "../services/ia";
import { client } from "../services/whatsappClient";
import { RateLimiter } from "../services/rateLimit";
import { validateMessage } from "../utils/messageValidator";
import * as qrcode from "qrcode-terminal";
import { statsManager, handleStatsCommand } from "../command/statisticCommands";

const rateLimiter = new RateLimiter();

export function registerWhatsappEvents() {
  client.on("qr", (qr) => {
    console.log("📱 Escaneie o QR Code:");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    console.log("✅ WhatsApp conectado com sucesso.");
  });

  client.on("disconnected", (reason) => {
    console.log("📱 WhatsApp desconectado:", reason);
    // Salvar estatísticas antes de desconectar
    statsManager.saveAllStats();
  });

  client.on("auth_failure", (msg) => {
    console.error("❌ Falha na autenticação:", msg);
  });

  client.on("message_create", async (msg) => {
    // Ignorar mensagens do próprio bot
    // if (msg.fromMe) return;

    const fromUser = msg.author || msg.from;
    const chatId = msg.from;

    // IMPORTANTE: Registrar mensagem para estatísticas (apenas em grupos)
    if (chatId.endsWith('@g.us') && !msg.body.startsWith('/') && !msg.body.startsWith('!')) {
      try {
        const chat = await msg.getChat();
        const contact = await msg.getContact();

        await statsManager.recordMessage(
          chatId,
          fromUser,
          contact.pushname || contact.name || 'Usuário',
          msg.body,
          chat.name || 'Grupo'
        );
      } catch (error) {
        console.error('Erro ao registrar estatística:', error);
      }
    }

    // Comando ping simples
    if (msg.body === "!ping") {
      await client.sendMessage(chatId, "🏓 pong!");
      return;
    }

    // Comando para limpar contexto
    if (msg.body === "/limpar") {
      contextManager.clearContext(chatId);
      await client.sendMessage(chatId, "🧹 Contexto da conversa limpo!");
      return;
    }

    // Comandos de estatísticas
    if (msg.body.startsWith("/stats")) {
      await handleStatsCommand(msg.body, msg, client);
      return;
    }

    // Comando de ajuda
    if (msg.body === "/help" || msg.body === "/ajuda") {
      const helpText = `🤖 *COMANDOS DISPONÍVEIS*

🧠 *Bot IA:*
/bot <pergunta> - Fazer pergunta ao ChatGPT
/limpar - Limpar contexto da conversa

📊 *Estatísticas (apenas grupos):*
/stats geral - Estatísticas gerais
/stats ranking - Top 10 mais ativos  
/stats atividade - Atividade por horário
/stats palavras - Palavras mais usadas
/stats meu - Suas estatísticas pessoais

🔧 *Outros:*
!ping - Testar se o bot está online
/help - Mostrar esta ajuda

*Exemplos:*
\`/bot qual a capital do Brasil?\`
\`/stats ranking\``;

      await client.sendMessage(chatId, helpText);
      return;
    }

    // Comando principal do bot
    if (msg.body.startsWith("/bot ")) {
      const context = msg.body.slice(5).trim();

      if (!context) {
        await client.sendMessage(chatId, "❌ Por favor, forneça um comando válido após /bot.\n\nExemplo: `/bot qual a capital do Brasil?`");
        return;
      }

      // Validar mensagem
      const validation = validateMessage(msg.body, fromUser, chatId);
      if (!validation.isValid) {
        await client.sendMessage(chatId, `❌ ${validation.error}`);
        return;
      }

      // Verificar rate limit
      if (!rateLimiter.isAllowed(fromUser)) {
        const timeLeft = rateLimiter.getTimeUntilReset(fromUser);
        await client.sendMessage(chatId, `⏰ Você está enviando comandos muito rápido. Aguarde ${timeLeft} segundos.`);
        return;
      }

      // Enviar mensagem de "digitando"
      await client.sendMessage(chatId, "🤖 Pensando...");

      try {
        const resposta = await createMessageBot(context, chatId);
        let finalResponse = resposta;
        let mentions: string[] = [];

        // Se for grupo, mencionar quem enviou
        if (chatId.endsWith("@g.us") && msg.author) {
          const authorNumber = msg.author.split("@")[0];
          finalResponse = `@${authorNumber} ${resposta}`;
          mentions = [msg.author];
        }

        await client.sendMessage(chatId, finalResponse, { mentions });

      } catch (err: any) {
        console.error("Erro no comando /bot:", err);
        await client.sendMessage(chatId, "❌ Erro interno. Tente novamente em alguns instantes.");
      }
    }
  });

  // Tratamento de erros globais
  client.on("error", (error) => {
    console.error("❌ Erro no cliente WhatsApp:", error);
  });

  // Salvar estatísticas periodicamente (a cada 5 minutos)
  setInterval(async () => {
    try {
      await statsManager.saveAllStats();
      console.log("📊 Estatísticas salvas automaticamente");
    } catch (error) {
      console.error("Erro ao salvar estatísticas:", error);
    }
  }, 5 * 60 * 1000); // 5 minutos
}

// Função para salvar estatísticas no shutdown
export async function gracefulShutdown() {
  console.log("💾 Salvando estatísticas...");
  await statsManager.saveAllStats();
  console.log("✅ Estatísticas salvas com sucesso!");
}
