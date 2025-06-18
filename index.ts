import fastify from "fastify";
import cors from "@fastify/cors";
import { wppRoutes } from "./src/routes/whatsapp";
import dotenv from "dotenv";
import { client } from "./src/services/whatsappClient";
import { registerWhatsappEvents, gracefulShutdown } from "./src/routes/webhook";
import { Logger } from "./src/utils/Logger";

dotenv.config();

const app = fastify();

app.register(cors, {
  origin: "*",
  methods: ["GET", "POST"],
});

// Middleware de log
app.addHook('onRequest', async (request, reply) => {
  Logger.info(`${request.method} ${request.url}`);
});

// Tratamento de erros
app.setErrorHandler((error, request, reply) => {
  Logger.error('Erro no servidor:', error);
  reply.status(500).send({ error: 'Erro interno do servidor' });
});

wppRoutes(app);
registerWhatsappEvents();

// Inicializar WhatsApp com tratamento de erro
client.initialize().catch((err) => {
  Logger.error('Erro ao inicializar WhatsApp:', err);
  process.exit(1);
});

// Graceful shutdown ATUALIZADO
process.on('SIGTERM', async () => {
  Logger.info('Recebido SIGTERM, finalizando...');
  await gracefulShutdown();
  await client.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  Logger.info('Recebido SIGINT, finalizando...');
  await gracefulShutdown();
  await client.destroy();
  process.exit(0);
});

app
  .listen({ port: 8080, host: "0.0.0.0" })
  .then(() => {
    Logger.info("🚀 Server rodando em http://localhost:8080");
  })
  .catch((err) => {
    Logger.error("Erro ao iniciar o servidor:", err);
    process.exit(1);
  });
