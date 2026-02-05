
import { Router } from "express";
import prisma from "../db";
import { generateToken } from "../middleware/auth";

const router = Router();

router.post("/verify-referral", async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            res.status(400).json({ error: "Referral code is required" });
            return;
        }

        const referral = await prisma.refral.findUnique({
            where: { code },
        });

        if (referral) {
            const token = generateToken({ code });
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production", // Use secure cookies in production
                maxAge: 3600000, // 1 hour
            });
            res.status(200).json({ valid: true, message: "Referral code valid" });
        } else {
            res.status(404).json({ valid: false, message: "Invalid referral code" });
        }
    } catch (error) {
        res.status(400).json({ error: "Invalid request" });
    }
});

export default router;
