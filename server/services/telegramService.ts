export interface TelegramNotificationData {
  firstName: string;
  lastName: string;
  studentId: string;
  courseName?: string;
  groupName?: string;
  teacherName?: string;
  lessonTime?: string;
  initialPassword?: string;
  createdDate: string;
  phone?: string;
  parentPhone?: string;
  includePassword?: boolean;
}

export interface TelegramSettings {
  botToken: string;
  adminChatId: string;
  adminChatIds: string[];
  botUsername: string;
  enabled: boolean;
  isLocked: boolean;
  sendPasswordInTelegram: boolean;
}

// Boshqa hech kim o'zgartira olmaydigan qilib qulflangan rasmiy bot va admin ma'lumotlari:
export const LOCKED_TELEGRAM_BOT_TOKEN = '8971004593:AAGhEKfqpiTomhDbIRnzuYHZtOaXxZqjOd4';
export const LOCKED_ADMIN_CHAT_IDS = ['8821038107', '291171879'];
export const LOCKED_BOT_USERNAME = 'newrenaissancesupportcrmbot';

export class TelegramService {
  private readonly botToken: string = LOCKED_TELEGRAM_BOT_TOKEN;
  private readonly adminChatIds: string[] = LOCKED_ADMIN_CHAT_IDS;
  private readonly enabled: boolean = true;
  private readonly isLocked: boolean = true;
  private sendPasswordInTelegram: boolean = true;

  constructor() {
    // Hardcoded and locked by the master administrator
  }

  // Configuration is permanently locked - cannot be modified or stolen
  public updateConfig(settings: Partial<TelegramSettings>) {
    if (settings.sendPasswordInTelegram !== undefined) {
      this.sendPasswordInTelegram = Boolean(settings.sendPasswordInTelegram);
    }
    // Token and Admin IDs are immutable and strictly protected
  }

  public getConfig(): TelegramSettings {
    return {
      botToken: `${this.botToken.slice(0, 10)}...${this.botToken.slice(-6)}`,
      adminChatId: this.adminChatIds.join(', '),
      adminChatIds: this.adminChatIds,
      botUsername: LOCKED_BOT_USERNAME,
      enabled: this.enabled,
      isLocked: this.isLocked,
      sendPasswordInTelegram: this.sendPasswordInTelegram,
    };
  }

  public getRawConfig(): TelegramSettings {
    return {
      botToken: this.botToken,
      adminChatId: this.adminChatIds.join(', '),
      adminChatIds: this.adminChatIds,
      botUsername: LOCKED_BOT_USERNAME,
      enabled: this.enabled,
      isLocked: this.isLocked,
      sendPasswordInTelegram: this.sendPasswordInTelegram,
    };
  }

  public async sendMessage(
    text: string,
    customChatId?: string
  ): Promise<{ success: boolean; results?: any[]; error?: string }> {
    const targetChatIds = customChatId ? [customChatId] : this.adminChatIds;
    const results: any[] = [];
    let atLeastOneSuccess = false;
    let lastError = '';

    for (const chatId of targetChatIds) {
      try {
        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId.trim(),
            text,
            parse_mode: 'HTML',
          }),
        });

        const data = (await response.json()) as any;
        if (response.ok && data.ok) {
          results.push({ chatId, success: true, messageId: data.result?.message_id });
          atLeastOneSuccess = true;
        } else {
          const desc = data.description || 'Xatolik';
          results.push({ chatId, success: false, error: desc });
          lastError = `${chatId}: ${desc}`;
        }
      } catch (err: any) {
        results.push({ chatId, success: false, error: err.message });
        lastError = `${chatId}: ${err.message}`;
      }
    }

    return {
      success: atLeastOneSuccess,
      results,
      error: atLeastOneSuccess ? undefined : lastError,
    };
  }

  public async notifyNewStudent(data: TelegramNotificationData): Promise<{ success: boolean; error?: string }> {
    const passwordSection =
      this.sendPasswordInTelegram && data.initialPassword
        ? `\n🔐 <b>Ota-ona portali paroli:</b> <code>${data.initialPassword}</code>\n`
        : '';

    const message = `<b>🆕 YANGI O‘QUVCHI RO‘YXATGA OLINDI</b>

👤 <b>O‘quvchi:</b> ${data.firstName} ${data.lastName}
🆔 <b>Student ID:</b> <code>${data.studentId}</code>
📞 <b>Telefon:</b> ${data.phone || 'Ko‘rsatilmagan'}
👨‍👩‍👧 <b>Ota-onasi:</b> ${data.parentPhone || 'Ko‘rsatilmagan'}

📚 <b>Kurs:</b> ${data.courseName || 'Belgilanmagan'}
👥 <b>Guruh:</b> ${data.groupName || 'Biriktirilmagan'}
👨‍🏫 <b>O‘qituvchi:</b> ${data.teacherName || 'Biriktirilmagan'}
🕐 <b>Dars vaqti:</b> ${data.lessonTime || 'Jadval bo‘yicha'}${passwordSection}
📅 <b>Ro‘yxatdan o‘tgan vaqt:</b> ${data.createdDate}

<i>EduCenter CRM • Rasmiy Admin Bildirishnomasi</i>`;

    return this.sendMessage(message);
  }

  public async sendTestPing(customChatId?: string): Promise<{ success: boolean; results?: any[]; error?: string }> {
    const time = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });
    const text = `🔔 <b>EduCenter CRM — Rasmiy Integratsiya Testi</b>

✅ <b>Telegram Bot muvaffaqiyatli ishlamoqda!</b>
🤖 <b>Bot:</b> @${LOCKED_BOT_USERNAME}
👑 <b>Asosiy Adminlar:</b> <code>${this.adminChatIds.join(' va ')}</code>
⏰ <b>Vaqt:</b> ${time}

🔒 <i>Integratsiya qat’iy qulflangan: Begona foydalanuvchilar bot ma’lumotlarini o‘zgartira olmaydi. Barcha muhim yangiliklar ushbu hisoblarga yuboriladi.</i>`;

    return this.sendMessage(text, customChatId);
  }
}

export const telegramService = new TelegramService();
