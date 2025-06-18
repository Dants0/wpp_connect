import fastify from "fastify";
import cors from "@fastify/cors";
import { wppRoutes } from "./src/routes/whatsapp";
import dotenv from "dotenv";
import { client } from "./src/services/whatsappClient"; // IMPORTANTE
import { registerWhatsappEvents } from "./src/routes/webhook";

dotenv.config();

const app = fastify();
app.register(cors, {
  origin: "*",
  methods: ["GET", "POST"],
});

wppRoutes(app);

registerWhatsappEvents();
client.initialize();

app
  .listen({ port: 8080, host: "0.0.0.0" })
  .then(() => {
    console.log("🚀 Server rodando em http://localhost:8080");
  })
  .catch((err) => {
    console.error("Erro ao iniciar o servidor:", err);
  });
