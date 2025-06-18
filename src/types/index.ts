export interface BotConfig {
  maxMessageLength: number;
  rateLimitWindow: number;
  rateLimitMax: number;
  allowedChats?: string[] | any;
  blockedUsers?: string[] | any;
}

export interface UserSession {
  lastCommand: number;
  commandCount: number;
  context?: string[];
}