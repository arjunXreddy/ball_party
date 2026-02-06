import axios from "axios";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export const sendTelegramMessage = async (
    name: string,
    email: string,
    phone: string,
    pendingUserId: string
) => {
    const message = `🎉 *New User Registration Request*\n\n👤 *Name:* ${name}\n📧 *Email:* ${email}\n📱 *Phone:* ${phone}`;

    const inlineKeyboard = {
        inline_keyboard: [
            [
                { text: "✅ Accept", callback_data: `approve_${pendingUserId}` },
                { text: "❌ Reject", callback_data: `reject_${pendingUserId}` },
            ],
        ],
    };

    try {
        const response = await axios.post(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: "Markdown",
                reply_markup: inlineKeyboard,
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error sending Telegram message:", error);
        throw error;
    }
};
