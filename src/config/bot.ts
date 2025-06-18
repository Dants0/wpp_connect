import { BotConfig } from "../types";

export const botConfig: BotConfig = {
  maxMessageLength: 4000,
  rateLimitWindow: 60000, // 1 minuto
  rateLimitMax: 5, // 5 comandos por minuto
  allowedChats: [], // vazio = todos permitidos
  blockedUsers: []
};