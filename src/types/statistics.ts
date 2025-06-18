export interface UserStats {
  name: string;
  messageCount: number;
  wordCount: number;
  characterCount: number;
  lastActivity: Date;
  averageMessageLength: number;
  mostActiveHour: number;
  dayActivity: { [key: string]: number }; // YYYY-MM-DD -> count
}

export interface GroupStats {
  groupName: string;
  totalMessages: number;
  totalWords: number;
  totalParticipants: number;
  createdAt: Date;
  lastActivity: Date;
  users: { [userId: string]: UserStats };
  wordFrequency: { [word: string]: number };
  messagesByHour: number[]; // 24 positions for each hour
  messagesByDay: { [date: string]: number };
  topEmojis: { [emoji: string]: number };
}

export interface StatsCommand {
  type: 'geral' | 'usuario' | 'palavras' | 'ranking' | 'atividade';
  target?: string; // para estatísticas de usuário específico
  period?: 'hoje' | 'semana' | 'mes' | 'total';
}