import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

export const db: Pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

db.connect().catch((err) => {
  console.error("Erreur de connexion à la base de données :", err);
});