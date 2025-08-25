import { Router } from 'express';
import { db } from '../db';
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

const router = Router();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined!");
}

const JWT_SECRET: string = process.env.JWT_SECRET;

router.post("/members", async (req, res) => {
  const { first_name, last_name, email, phone_number, password } = req.body;
  const password_hash = await bcrypt.hash(password, 10);

  if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !phone_number?.trim() || !password?.trim()) {
    res.status(400).json({ error: "Tous les champs obligatoires doivent être remplis." });
    return;
  }

  const existing = await db.query(
    "SELECT id FROM members WHERE email = $1 OR phone_number = $2",
    [email, phone_number]
  );

  if (existing.rows.length > 0) {
    res.status(400).json({ error: "Un compte existe déjà avec cet e-mail ou ce numéro." });
    return;
  }

  try {
    const result = await db.query(
      `INSERT INTO members (first_name, last_name, email, phone_number, password_hash) VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [first_name, last_name, email, phone_number, password_hash]
    );

    const newMemberId = result.rows[0].id;

    const token = jwt.sign({ id: newMemberId, email: email }, JWT_SECRET, {
      expiresIn: "14d",
    });

    res.status(201).json({ message: "Utilisateur créé !", token });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;