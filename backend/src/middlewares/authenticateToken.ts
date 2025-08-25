import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import jwt from "jsonwebtoken";

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
        res.status(401).json({ error: "Token manquant" })
        return;
    };

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
        req.memberId = payload.id;
        next();
    } catch (err) {
        res.status(403).json({ error: "Token invalide ou expiré" });
    }
}