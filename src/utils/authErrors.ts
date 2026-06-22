/** Map server/auth error text to i18n dictionary keys (ru key → translated via t()). */
const SERVER_ERROR_TO_KEY: Record<string, string> = {
  'Setup failed': 'Не удалось создать учётную запись администратора.',
  'Network error': 'Ошибка сети. Проверьте подключение к серверу.',
  'Initial setup already completed': 'Первоначальная настройка уже выполнена.',
  'Setup already completed': 'Первоначальная настройка уже выполнена.',
  'Login and password required': 'Пожалуйста, заполните все поля для авторизации.',
  'Failed to read setup status': 'Не удалось проверить статус настройки.',
};

export function translateAuthError(message: string, t: (key: string) => string): string {
  if (!message) return '';
  const mappedKey = SERVER_ERROR_TO_KEY[message];
  if (mappedKey) {
    const translated = t(mappedKey);
    if (translated !== mappedKey) return translated;
  }
  const direct = t(message);
  return direct !== message ? direct : message;
}
