export class ContextManager {
  private contexts = new Map<string, string[]>();
  private readonly maxContextSize = 5;

  addMessage(chatId: string, message: string) {
    if (!this.contexts.has(chatId)) {
      this.contexts.set(chatId, []);
    }

    const context = this.contexts.get(chatId)!;
    context.push(message);

    // Manter apenas as últimas mensagens
    if (context.length > this.maxContextSize) {
      context.shift();
    }
  }

  getContext(chatId: string): string[] {
    return this.contexts.get(chatId) || [];
  }

  clearContext(chatId: string) {
    this.contexts.delete(chatId);
  }
}