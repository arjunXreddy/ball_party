import { Router } from "express";
import prisma from "../db";
import { sendTicketEmail } from "../utils/email";
import { authenticateToken } from "../middleware/auth";

const router = Router();
router.post("/submit-user", authenticateToken, async (req, res) => {
  try {
    const { name, email, phoneNo } = req.body;

    if (!name || !email || !phoneNo) {
      res
        .status(400)
        .json({ error: "Name, email, and phone number are required" });
      return;
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phoneNo,
        fromrefralcode: true,
      },
    });

    // Send ticket email asynchronously
    await sendTicketEmail(email, { name, email, phoneNo });

    res
      .status(201)
      .json({ message: "User registered and ticket sent successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

export default router;
