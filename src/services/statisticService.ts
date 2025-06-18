import fs from 'fs/promises';
import path from 'path';
import { GroupStats } from '../types/statistics';

export class StatisticsManager {
  private stats = new Map<string, GroupStats>();
  private readonly dataDir = './data';
  private readonly stopWords = new Set([
    'a', 'o', 'e', 'de', 'do', 'da', 'em', 'um', 'uma', 'para', 'com', 'não', 'na', 'por',
    'que', 'se', 'te', 'ao', 'os', 'as', 'dos', 'das', 'no', 'mas', 'ou', 'este', 'esta',
    'eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles', 'elas', 'meu', 'minha', 'seu', 'sua',
    'é', 'são', 'foi', 'tem', 'ter', 'só', 'já', 'mais', 'muito', 'bem', 'vai', 'vou'
  ]);

  constructor() {
    this.ensureDataDir();
    this.loadAllStats();
  }

  private async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.error('Erro ao criar diretório de dados:', error);
    }
  }

  private async loadAllStats() {
    try {
      const files = await fs.readdir(this.dataDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const groupId = file.replace('.json', '');
          await this.loadGroupStats(groupId);
        }
      }
    } catch (error) {
      console.log('Primeiro uso - sem dados salvos ainda');
    }
  }

  private async loadGroupStats(groupId: string) {
    try {
      const filePath = path.join(this.dataDir, `${groupId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      const stats = JSON.parse(data);
      
      // Converter strings de data de volta para Date objects
      stats.createdAt = new Date(stats.createdAt);
      stats.lastActivity = new Date(stats.lastActivity);
      Object.values(stats.users).forEach((user: any) => {
        user.lastActivity = new Date(user.lastActivity);
      });
      
      this.stats.set(groupId, stats);
    } catch (error) {
      console.log(`Criando novas estatísticas para grupo ${groupId}`);
    }
  }

  private async saveGroupStats(groupId: string) {
    try {
      const filePath = path.join(this.dataDir, `${groupId}.json`);
      const stats = this.stats.get(groupId);
      if (stats) {
        await fs.writeFile(filePath, JSON.stringify(stats, null, 2));
      }
    } catch (error) {
      console.error('Erro ao salvar estatísticas:', error);
    }
  }

  async recordMessage(
    groupId: string, 
    userId: string, 
    userName: string, 
    message: string, 
    groupName: string
  ) {
    // Ignorar comandos do bot
    if (message.startsWith('/') || message.startsWith('!')) {
      return;
    }

    let groupStats = this.stats.get(groupId);
    if (!groupStats) {
      groupStats = {
        groupName,
        totalMessages: 0,
        totalWords: 0,
        totalParticipants: 0,
        createdAt: new Date(),
        lastActivity: new Date(),
        users: {},
        wordFrequency: {},
        messagesByHour: Array(24).fill(0),
        messagesByDay: {},
        topEmojis: {}
      };
      this.stats.set(groupId, groupStats);
    }

    // Atualizar estatísticas do usuário
    if (!groupStats.users[userId]) {
      groupStats.users[userId] = {
        name: userName,
        messageCount: 0,
        wordCount: 0,
        characterCount: 0,
        lastActivity: new Date(),
        averageMessageLength: 0,
        mostActiveHour: 0,
        dayActivity: {}
      };
      groupStats.totalParticipants++;
    }

    const user = groupStats.users[userId];
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const hour = now.getHours();

    // Atualizar dados do usuário
    user.name = userName; // Atualizar nome caso tenha mudado
    user.messageCount++;
    user.characterCount += message.length;
    user.lastActivity = now;
    user.dayActivity[today] = (user.dayActivity[today] || 0) + 1;

    // Processar palavras
    const words = this.extractWords(message);
    user.wordCount += words.length;
    user.averageMessageLength = user.characterCount / user.messageCount;

    // Atualizar frequência de palavras
    words.forEach(word => {
      if (!this.stopWords.has(word.toLowerCase()) && word.length > 2) {
        groupStats.wordFrequency[word] = (groupStats.wordFrequency[word] || 0) + 1;
      }
    });

    // Processar emojis
    const emojis = this.extractEmojis(message);
    emojis.forEach(emoji => {
      groupStats.topEmojis[emoji] = (groupStats.topEmojis[emoji] || 0) + 1;
    });

    // Atualizar estatísticas gerais do grupo
    groupStats.totalMessages++;
    groupStats.totalWords += words.length;
    groupStats.lastActivity = now;
    groupStats.messagesByHour[hour]++;
    groupStats.messagesByDay[today] = (groupStats.messagesByDay[today] || 0) + 1;

    // Salvar periodicamente (a cada 10 mensagens)
    if (groupStats.totalMessages % 10 === 0) {
      await this.saveGroupStats(groupId);
    }
  }

  private extractWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private extractEmojis(text: string): string[] {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    return text.match(emojiRegex) || [];
  }

  async getGeneralStats(groupId: string): Promise<string> {
    const stats = this.stats.get(groupId);
    if (!stats) return "❌ Nenhuma estatística disponível para este grupo.";

    const topUsers = Object.entries(stats.users)
      .sort(([,a], [,b]) => b.messageCount - a.messageCount)
      .slice(0, 5);

    const topWords = Object.entries(stats.wordFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    const mostActiveHour = stats.messagesByHour.indexOf(Math.max(...stats.messagesByHour));

    return `📊 *ESTATÍSTICAS GERAIS - ${stats.groupName}*

👥 *Participantes:* ${stats.totalParticipants}
💬 *Total de mensagens:* ${stats.totalMessages.toLocaleString()}
📝 *Total de palavras:* ${stats.totalWords.toLocaleString()}
📅 *Criado em:* ${stats.createdAt.toLocaleDateString('pt-BR')}

🏆 *TOP 5 MAIS ATIVOS:*
${topUsers.map(([userId, user], index) => 
  `${index + 1}. ${user.name}: ${user.messageCount} msgs`
).join('\n')}

🔥 *PALAVRAS MAIS USADAS:*
${topWords.map(([word, count], index) => 
  `${index + 1}. "${word}": ${count}x`
).join('\n')}

⏰ *Horário mais ativo:* ${mostActiveHour}:00h
📈 *Última atividade:* ${stats.lastActivity.toLocaleDateString('pt-BR')}`;
  }

  async getUserStats(groupId: string, userId: string): Promise<string> {
    const stats = this.stats.get(groupId);
    if (!stats || !stats.users[userId]) {
      return "❌ Usuário não encontrado nas estatísticas.";
    }

    const user = stats.users[userId];
    const userRank = Object.entries(stats.users)
      .sort(([,a], [,b]) => b.messageCount - a.messageCount)
      .findIndex(([id]) => id === userId) + 1;

    const totalDays = Object.keys(user.dayActivity).length;
    const avgMessagesPerDay = totalDays > 0 ? (user.messageCount / totalDays).toFixed(1) : '0';

    return `👤 *ESTATÍSTICAS - ${user.name}*

🏆 *Ranking:* ${userRank}º lugar
💬 *Mensagens enviadas:* ${user.messageCount.toLocaleString()}
📝 *Palavras escritas:* ${user.wordCount.toLocaleString()}
📏 *Tamanho médio:* ${user.averageMessageLength.toFixed(1)} caracteres
📊 *Média diária:* ${avgMessagesPerDay} mensagens
📅 *Última atividade:* ${user.lastActivity.toLocaleDateString('pt-BR')}
📈 *Ativo há:* ${totalDays} dias`;
  }

  async getRankingStats(groupId: string): Promise<string> {
    const stats = this.stats.get(groupId);
    if (!stats) return "❌ Nenhuma estatística disponível.";

    const ranking = Object.entries(stats.users)
      .sort(([,a], [,b]) => b.messageCount - a.messageCount)
      .slice(0, 10);

    let result = `🏆 *RANKING DOS MAIS ATIVOS*\n\n`;
    
    ranking.forEach(([userId, user], index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
      const percentage = ((user.messageCount / stats.totalMessages) * 100).toFixed(1);
      result += `${medal} *${user.name}*\n`;
      result += `   📊 ${user.messageCount} msgs (${percentage}%)\n`;
      result += `   📝 ${user.wordCount} palavras\n\n`;
    });

    return result;
  }

  async getActivityStats(groupId: string): Promise<string> {
    const stats = this.stats.get(groupId);
    if (!stats) return "❌ Nenhuma estatística disponível.";

    // Atividade por hora
    const hourlyActivity = stats.messagesByHour
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Últimos 7 dias
    const last7Days = Object.entries(stats.messagesByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7);

    // Top emojis
    const topEmojis = Object.entries(stats.topEmojis)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8);

    return `📈 *ATIVIDADE DO GRUPO*

⏰ *HORÁRIOS MAIS ATIVOS:*
${hourlyActivity.map(({hour, count}) => 
  `${hour}:00h - ${count} msgs`
).join('\n')}

📅 *ÚLTIMOS 7 DIAS:*
${last7Days.map(({date, count}) => 
  `${new Date(date).toLocaleDateString('pt-BR')} - ${count} msgs`
).join('\n')}

😊 *EMOJIS FAVORITOS:*
${topEmojis.map(([emoji, count]) => 
  `${emoji} ${count}x`
).join(' ')}`;
  }

  async getWordStats(groupId: string): Promise<string> {
    const stats = this.stats.get(groupId);
    if (!stats) return "❌ Nenhuma estatística disponível.";

    const topWords = Object.entries(stats.wordFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20);

    return `📝 *PALAVRAS MAIS USADAS*

${topWords.map(([word, count], index) => 
  `${index + 1}. *${word}* - ${count} vezes`
).join('\n')}

📊 Total de palavras únicas: ${Object.keys(stats.wordFrequency).length}`;
  }

  // Método para salvar todas as estatísticas (útil para shutdown)
  async saveAllStats() {
    const promises = Array.from(this.stats.keys()).map(groupId => 
      this.saveGroupStats(groupId)
    );
    await Promise.all(promises);
  }
}
