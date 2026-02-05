
import express from "express";
import referralRoutes from "./routes/referral";
import userRoutes from "./routes/user";

import cookieParser from "cookie-parser";

const app = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());

// Use routes
app.use("/", referralRoutes);
app.use("/", userRoutes);

app.get("/", (req, res) => {
    res.send("Hello via Bun + Express!");
});

app.listen(port, () => {
    console.log(`Listening on localhost:${port}`);
});