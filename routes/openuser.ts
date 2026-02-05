import { Router } from "express";
import { sendtelegrammessage, updateIndb, sendTicketEmail } from "../utils";

const router = Router();

router.post("/open-user", async (req, res) => {
  const { name, email, phone } = req.body;
  await sendtelegrammessage(name, email, phone);
  res.status(200).json({ message: "awaiting approaval" });
});
router.post("approve-telegram", (req, res) => {
  updateIndb();
  sendTicketEmail();
});
