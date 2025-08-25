import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import { db } from '../db';

const router = Router();

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined!");
}

const JWT_SECRET: string = process.env.JWT_SECRET;

router.get("/sessions", (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Token manquant ou invalide" });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(token, JWT_SECRET);

        res.status(200).json({ message: "Token valide", payload });
        return;
    } catch (err) {
        res.status(401).json({ error: "Token invalide ou expiré" });
        return;
    }
});

router.post("/sessions", async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query("SELECT * FROM members WHERE email = $1", [email]);
    
        if (result.rows.length === 0) {
            res.status(401).json({ error: "Utilisateur non trouvé." });
            return;
        }
    
        const user = result.rows[0];
    
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            res.status(401).json({ error: "Mot de passe incorrect." });
            return;
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: "14d",
          });
    
        res.status(200).json({
            message: "Connexion réussie",
            token,
            member: { id: user.id, email: user.email, name: user.first_name }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export default router;