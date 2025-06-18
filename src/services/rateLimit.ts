import { botConfig } from "../config/bot";
import { UserSession } from "../types";

export class RateLimiter {
  private users = new Map<string, UserSession>();

  isAllowed(userId: string): boolean {
    const now = Date.now();
    const user = this.users.get(userId);

    if (!user) {
      this.users.set(userId, {
        lastCommand: now,
        commandCount: 1
      });
      return true;
    }

    if (now - user.lastCommand > botConfig.rateLimitWindow) {
      user.commandCount = 1;
      user.lastCommand = now;
      return true;
    }

    if (user.commandCount >= botConfig.rateLimitMax) {
      return false;
    }

    user.commandCount++;
    user.lastCommand = now;
    return true;
  }

  getTimeUntilReset(userId: string): number {
    const user = this.users.get(userId);
    if (!user) return 0;
    
    const timeLeft = botConfig.rateLimitWindow - (Date.now() - user.lastCommand);
    return Math.max(0, Math.ceil(timeLeft / 1000));
  }
}