
import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token || (req.headers["authorization"] && req.headers["authorization"].split(" ")[1]);

    if (!token) {
        res.status(401).json({ error: "Access token required" });
        return;
    }

    jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
        if (err) {
            res.status(403).json({ error: "Invalid token" });
            return;
        }
        next();
    });
};

export const generateToken = (payload: object) => {
    return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
};
