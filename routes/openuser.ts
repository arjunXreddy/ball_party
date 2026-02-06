import { Router, type Request, type Response } from "express";
import { sendTelegramMessage } from "../utils/telegram";
import { sendTicketEmail } from "../utils/email";
import prisma from "../db";

const router = Router();

// Route to submit a new user - saves to PendingUser and sends Telegram message
router.post("/open-user", async (req: Request, res: Response) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: "Name, email, and phone are required" });
    }

    // Check if user already exists in User or PendingUser
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phoneNo: phone }] },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already registered" });
    }

    const existingPending = await prisma.pendingUser.findFirst({
      where: { OR: [{ email }, { phoneNo: phone }] },
    });

    if (existingPending) {
      return res.status(400).json({ error: "Registration already pending approval" });
    }

    // Create pending user
    const pendingUser = await prisma.pendingUser.create({
      data: { name, email, phoneNo: phone },
    });

    // Send Telegram message with Accept/Reject buttons
    await sendTelegramMessage(name, email, phone, pendingUser.id);

    res.status(200).json({ message: "Awaiting approval" });
  } catch (error) {
    console.error("Error in /open-user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route called when approved via Telegram - moves user from Pending to User table and sends email
router.post("/approve-telegram", async (req: Request, res: Response) => {
  try {
    const { pendingUserId } = req.body;

    if (!pendingUserId) {
      return res.status(400).json({ error: "pendingUserId is required" });
    }

    // Find pending user
    const pendingUser = await prisma.pendingUser.findUnique({
      where: { id: pendingUserId },
    });

    if (!pendingUser) {
      return res.status(404).json({ error: "Pending user not found" });
    }

    // Create user in User table
    const newUser = await prisma.user.create({
      data: {
        name: pendingUser.name,
        email: pendingUser.email,
        phoneNo: pendingUser.phoneNo,
        fromrefralcode: false,
      },
    });

    // Delete from pending
    await prisma.pendingUser.delete({
      where: { id: pendingUserId },
    });

    // Send confirmation email
    await sendTicketEmail(newUser.email, {
      name: newUser.name,
      email: newUser.email,
      phoneNo: newUser.phoneNo,
    });

    res.status(200).json({ message: "User approved and email sent", user: newUser });
  } catch (error) {
    console.error("Error in /approve-telegram:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Telegram webhook to handle callback queries (button clicks)
router.post("/telegram-webhook", async (req: Request, res: Response) => {
  try {
    const { callback_query } = req.body;

    if (!callback_query) {
      return res.status(200).json({ ok: true });
    }

    const callbackData = callback_query.data;
    const chatId = callback_query.message.chat.id;
    const messageId = callback_query.message.message_id;

    if (callbackData.startsWith("approve_")) {
      const pendingUserId = callbackData.replace("approve_", "");

      // Find and approve the user
      const pendingUser = await prisma.pendingUser.findUnique({
        where: { id: pendingUserId },
      });

      if (!pendingUser) {
        return res.status(200).json({ ok: true, message: "User already processed" });
      }

      // Create user in User table
      const newUser = await prisma.user.create({
        data: {
          name: pendingUser.name,
          email: pendingUser.email,
          phoneNo: pendingUser.phoneNo,
          fromrefralcode: false,
        },
      });

      // Delete from pending
      await prisma.pendingUser.delete({
        where: { id: pendingUserId },
      });

      // Send confirmation email
      await sendTicketEmail(newUser.email, {
        name: newUser.name,
        email: newUser.email,
        phoneNo: newUser.phoneNo,
      });

      // Update Telegram message to show approval
      const axios = (await import("axios")).default;
      await axios.post(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageText`,
        {
          chat_id: chatId,
          message_id: messageId,
          text: `✅ *APPROVED*\n\n👤 *Name:* ${pendingUser.name}\n📧 *Email:* ${pendingUser.email}\n📱 *Phone:* ${pendingUser.phoneNo}`,
          parse_mode: "Markdown",
        }
      );
    } else if (callbackData.startsWith("reject_")) {
      const pendingUserId = callbackData.replace("reject_", "");

      // Delete the pending user
      const pendingUser = await prisma.pendingUser.findUnique({
        where: { id: pendingUserId },
      });

      if (pendingUser) {
        await prisma.pendingUser.delete({
          where: { id: pendingUserId },
        });

        // Update Telegram message to show rejection
        const axios = (await import("axios")).default;
        await axios.post(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageText`,
          {
            chat_id: chatId,
            message_id: messageId,
            text: `❌ *REJECTED*\n\n👤 *Name:* ${pendingUser.name}\n📧 *Email:* ${pendingUser.email}\n📱 *Phone:* ${pendingUser.phoneNo}`,
            parse_mode: "Markdown",
          }
        );
      }
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error in /telegram-webhook:", error);
    res.status(200).json({ ok: true }); // Always return 200 to Telegram
  }
});

export default router;
