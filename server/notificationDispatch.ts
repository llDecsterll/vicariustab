/*
 * Vicariustab — outbound session alerts (email / Telegram)
 */
import type { SessionNotificationRecord } from "./sessionEngine.ts";

export interface NotificationChannelPrefs {
  email?: string;
  emailVerified?: boolean;
  emailNotificationsEnabled?: boolean;
  telegramChatId?: string;
  telegramNotificationsEnabled?: boolean;
}

export interface DispatchResult {
  email: { attempted: boolean; sent: boolean; reason?: string };
  telegram: { attempted: boolean; sent: boolean; reason?: string };
}

function buildHtmlBody(notification: SessionNotificationRecord): string {
  const m = notification.meta;
  const location =
    m.city && m.country ? `${m.city}, ${m.country}` : m.country || "Не определено";
  return `
    <h2>${notification.title}</h2>
    <p>В вашу учётную запись был выполнен вход с нового устройства.</p>
    <ul>
      <li><strong>Время:</strong> ${m.loginAt}</li>
      <li><strong>IP-адрес:</strong> ${m.ipAddress}</li>
      <li><strong>Местоположение:</strong> ${location}</li>
      <li><strong>Браузер:</strong> ${m.browser}</li>
      <li><strong>ОС:</strong> ${m.os}</li>
      <li><strong>Устройство:</strong> ${m.device}</li>
    </ul>
    <p>Если это были не вы, немедленно завершите активные сессии и смените пароль.</p>
    <p><a href="#">Просмотреть активные сессии</a> (откройте Настройки → Безопасность → Активные сессии)</p>
  `.trim();
}

async function sendTelegram(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[SessionNotify] Telegram error:", err);
    return false;
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.SESSION_ALERT_FROM_EMAIL?.trim() || "security@vicariustab.local";

  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: [to], subject, html }),
      });
      return res.ok;
    } catch (err) {
      console.error("[SessionNotify] Resend error:", err);
      return false;
    }
  }

  console.log(`[SessionNotify][Email] To: ${to} | Subject: ${subject}`);
  console.log(html.replace(/<[^>]+>/g, " ").slice(0, 500));
  return false;
}

export async function dispatchNewLoginAlert(
  notification: SessionNotificationRecord,
  prefs: NotificationChannelPrefs,
  sessionsUrl?: string
): Promise<DispatchResult> {
  const result: DispatchResult = {
    email: { attempted: false, sent: false },
    telegram: { attempted: false, sent: false },
  };

  const textPlain = notification.body;
  const html = buildHtmlBody(notification).replace(
    'href="#"',
    `href="${sessionsUrl || "#"}"`
  );

  if (
    prefs.email &&
    prefs.emailVerified &&
    prefs.emailNotificationsEnabled !== false
  ) {
    result.email.attempted = true;
    result.email.sent = await sendEmail(
      prefs.email,
      notification.title,
      html
    );
    if (!result.email.sent) {
      result.email.reason = process.env.RESEND_API_KEY
        ? "send_failed"
        : "smtp_not_configured";
    }
  }

  if (prefs.telegramChatId && prefs.telegramNotificationsEnabled) {
    result.telegram.attempted = true;
    const tgText = `<b>${notification.title}</b>\n\n${textPlain.replace(/\n/g, "\n")}`;
    result.telegram.sent = await sendTelegram(prefs.telegramChatId, tgText);
    if (!result.telegram.sent) {
      result.telegram.reason = process.env.TELEGRAM_BOT_TOKEN
        ? "send_failed"
        : "bot_not_configured";
    }
  }

  return result;
}
