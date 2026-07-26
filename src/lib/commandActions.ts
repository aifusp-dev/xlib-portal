// Traduce entre el string plano que espera CommandDispatcher.java
// (formato: "[delay=segundos] console: comando", con %player% como placeholder)
// y una forma estructurada fácil de editar con desplegables.

export type CommandExecutor = 'console' | 'player';
export type CommandActionKind = 'say' | 'custom';

export interface CommandAction {
  delay: number; // segundos, 0 = sin retraso
  executor: CommandExecutor;
  action: CommandActionKind;
  message: string; // el mensaje (say) o el comando completo (custom), sin prefijos
}

export const DEFAULT_COMMAND_ACTION: CommandAction = {
  delay: 0,
  executor: 'console',
  action: 'say',
  message: '',
};

export function parseCommandAction(raw: string): CommandAction {
  const trimmed = (raw || '').trim();
  if (!trimmed) return { ...DEFAULT_COMMAND_ACTION };

  let rest = trimmed;
  let delay = 0;
  const delayMatch = rest.match(/^\[delay=(\d+)\]\s*/);
  if (delayMatch) {
    delay = parseInt(delayMatch[1], 10);
    rest = rest.slice(delayMatch[0].length);
  }

  let executor: CommandExecutor = 'player';
  if (rest.startsWith('console:')) {
    executor = 'console';
    rest = rest.slice('console:'.length).trim();
  }

  if (rest.startsWith('say ')) {
    return { delay, executor, action: 'say', message: rest.slice(4) };
  }

  return { delay, executor, action: 'custom', message: rest };
}

export function buildCommandAction(a: CommandAction): string {
  const body = a.action === 'say' ? `say ${a.message}` : a.message;
  const prefix = a.delay > 0 ? `[delay=${a.delay}] ` : '';
  return `${prefix}${a.executor}: ${body}`;
}
