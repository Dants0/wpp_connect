import { botConfig } from '../config/bot';

export function validateMessage(body: string, fromUser: string, fromChat: string): {
  isValid: boolean;
  error?: string;
} {
  if (botConfig.blockedUsers.includes(fromUser)) {
    return { isValid: false, error: "Usuário bloqueado." };
  }

  if (botConfig.allowedChats.length > 0 && !botConfig.allowedChats.includes(fromChat)) {
    return { isValid: false, error: "Chat não autorizado." };
  }

  if (body.length > botConfig.maxMessageLength) {
    return { isValid: false, error: "Mensagem muito longa." };
  }

  return { isValid: true };
}
