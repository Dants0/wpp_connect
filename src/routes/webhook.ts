import { createMessageBot } from "../services/ia";
import { client } from "../services/whatsappClient";
import * as qrcode from "qrcode-terminal";


export function registerWhatsappEvents() {
  client.on("qr", (qr) => qrcode.generate(qr, { small: true }));

  client.on("ready", () => {
    console.log("✅ WhatsApp conectado com sucesso.");
  });

  client.on("disconnected", () => {
    console.log("Wpp disconectado com sucesso!")
  })

  client.on("message_create", async (msg) => {
    const body = msg.body.trim();

    if (body === "!ping") {
      await client.sendMessage(msg.from, "pong");
    }


    if (body.startsWith("/bot ")) {
      const context = body.slice(5).trim();
      if (!context) {
        await client.sendMessage(msg.from, "❌ Por favor, forneça um comando válido após /bot.");
        return;
      }

      await client.sendMessage(msg.from, "🤖 Pensando...");

      try {
        const resposta = await createMessageBot(context);
        let finalResponse = resposta;
        let mentions: string[] = [];

        if (msg.from.endsWith("@g.us") && msg.author) {
          const authorNumber = msg.author.split("@")[0];
          finalResponse = `@${authorNumber} ${resposta}`;
          mentions = [msg.author];
        }

        await client.sendMessage(msg.from, finalResponse, { mentions });

      } catch (err: any) {
        await client.sendMessage(msg.from, "❌ Erro ao gerar resposta.");
      }
    }

  });
}
