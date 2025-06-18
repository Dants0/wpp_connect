import { Message } from 'whatsapp-web.js';
import { StatisticsManager } from '../services/statisticService';

const statsManager = new StatisticsManager();

export async function handleStatsCommand(
  command: string,
  msg: Message,
  client: any
): Promise<void> {
  // Só funciona em grupos
  if (!msg.from.endsWith('@g.us')) {
    await client.sendMessage(msg.from, "📊 Este comando só funciona em grupos!");
    return;
  }

  const parts = command.split(' ');
  const subCommand = parts[1]?.toLowerCase();

  let response = '';

  switch (subCommand) {
    case 'geral':
    case undefined:
      response = await statsManager.getGeneralStats(msg.from);
      break;

    case 'ranking':
      response = await statsManager.getRankingStats(msg.from);
      break;

    case 'atividade':
      response = await statsManager.getActivityStats(msg.from);
      break;

    case 'palavras':
      response = await statsManager.getWordStats(msg.from);
      break;

    case 'meu':
      const userId = msg.author || msg.from;
      response = await statsManager.getUserStats(msg.from, userId);
      break;

    default:
      response = `📊 *COMANDOS DE ESTATÍSTICAS*

/stats *geral* - Estatísticas gerais
/stats *ranking* - Top 10 mais ativos
/stats *atividade* - Atividade por horário
/stats *palavras* - Palavras mais usadas
/stats *meu* - Suas estatísticas

Exemplo: \`/stats ranking\``;
  }

  await client.sendMessage(msg.from, response);
}

export { statsManager };