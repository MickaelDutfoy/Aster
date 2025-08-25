import { Router } from 'express';
import { db } from '../db';
import { AuthRequest } from '../types';
import { authenticateToken } from '../middlewares/authenticateToken';

const router = Router();

router.get("/animals", authenticateToken, async (req: AuthRequest, res) => {
    const memberId = req.memberId;
    const orgId = req.query.orgId;

    if (!memberId) {
        res.status(400).json({ error: "ID manquant" });
        return;
    }

    if (!orgId) {
        res.status(400).json({ error: "ID orga manquant" });
        return;
    }

    try {
        const test = await db.query(`
            SELECT 1
            FROM member_organization
            WHERE member_id = $1
            AND organization_id = $2
            AND status = 'validated'
            `, [memberId, orgId]
        )

        if (test.rows.length === 0) {
            res.status(403).json({ error: "Accès refusé" });
            return;
        }

        const result = await db.query(`
            SELECT *
            FROM animals
            WHERE organization_id = $1
            ORDER BY name ASC
        `, [orgId]);

        res.json(result.rows);

    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
})

router.post("/animals", authenticateToken, async (req: AuthRequest, res) => {
    const memberId = req.memberId;

    if (!memberId) {
        res.status(400).json({ error: "ID manquant" });
        return;
    }

    let { name, species, sex, color, birthYear, birthMonth, birthDay, neutered, vax, primo, deworm, prime, notes, orgId } = req.body;

    if (sex === "") sex = null;
    if (birthDay === 0) birthDay = 15;

    if (birthMonth < 1 || birthMonth > 12 || birthDay < 1 || birthDay > 31) {
        res.status(400).json({ error: "Données invalides" });
        return;
    }

    let birthDate = birthYear + "-" + (birthMonth < 10 ? "0" + birthMonth : birthMonth) + "-" + (birthDay < 10 ? "0" + birthDay : birthDay);

    try {
        const test = await db.query(`
        SELECT 1
        FROM member_organization
        WHERE member_id = $1
        AND organization_id = $2
        AND status = 'validated'
        `, [memberId, orgId]
        )

        if (test.rows.length === 0) {
            res.status(403).json({ error: "Accès refusé" });
            return;
        }

        const post = await db.query(`
            INSERT INTO animals (name, species, sex, color, birth_date, is_neutered, last_vax, is_primo_vax, last_deworm, is_first_deworm, information, organization_id)
            VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, '')::date, $8, NULLIF($9, '')::date, $10, $11, $12)
            RETURNING id
        `, [name, species, sex, color, birthDate, neutered, vax, primo, deworm, prime, notes, orgId])

        const animalId = post.rows[0].id

        res.status(201).json({ id: animalId });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
})

router.patch("/animals/:id", authenticateToken, async (req: AuthRequest, res) => {
    const memberId = req.memberId;
    const { id } = req.params;

    if (!memberId) {
        res.status(400).json({ error: "ID manquant" });
        return;
    }

    const test = await db.query("SELECT organization_id FROM animals WHERE id = $1", [id]);
    if (test.rowCount === 0) {
        res.status(404).json({ error: "Animal introuvable" });
        return;
    }

    const check = await db.query(
      "SELECT 1 FROM member_organization WHERE member_id = $1 AND organization_id = $2 AND status = 'validated'",
      [memberId, test.rows[0].organization_id]
    );

    if (check.rowCount === 0) {
        res.status(403).json({ error: "Accès refusé" });
        return;
    }

    let { name, species, sex, color, birthYear, birthMonth, birthDay, neutered, vax, primo, deworm, prime, notes } = req.body;

    if (sex === "") sex = null;
    if (birthDay === 0) birthDay = 15;

    if (birthMonth < 1 || birthMonth > 12 || birthDay < 1 || birthDay > 31) {
        res.status(400).json({ error: "Données invalides" });
        return;
    }

    let birthDate = birthYear + "-" + (birthMonth < 10 ? "0" + birthMonth : birthMonth) + "-" + (birthDay < 10 ? "0" + birthDay : birthDay);

    try {
        const patch = await db.query(`
            UPDATE animals
            SET name = $1,
                species = $2,
                sex = $3,
                color = $4,
                birth_date = $5,
                is_neutered = $6,
                last_vax = NULLIF($7, '')::date,
                is_primo_vax = $8,
                last_deworm = NULLIF($9, '')::date,
                is_first_deworm = $10,
                information = $11
            WHERE id = $12
            RETURNING *;
        `, [name, species, sex, color, birthDate, neutered, vax, primo, deworm, prime, notes, id])

        res.status(201).json(patch.rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
})

export default router;