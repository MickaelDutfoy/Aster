import { Router } from 'express';
import { db } from '../db';
import { AuthRequest } from '../types';
import { authenticateToken } from '../middlewares/authenticateToken';

const router = Router();

router.get("/organizations", async (req, res) => {
    const searchTerm = req.query.q as string;
    if (!searchTerm || searchTerm.length < 2) {
        res.status(400).json({ error: "Requête trop courte" });
        return;
    }

    try {
        const rows = await db.query(`
            SELECT 
              o.id,
              o.name,
              m.first_name AS superadmin_first_name,
              m.last_name AS superadmin_last_name
            FROM organizations o
            JOIN member_organization mo ON o.id = mo.organization_id
            JOIN members m ON mo.member_id = m.id
            WHERE mo.role = 'superadmin' AND LOWER(o.name) LIKE LOWER($1)
        `, [`%${searchTerm}%`]);

        const formatted = rows.rows.map(row => ({
            id: row.id,
            name: row.name,
            superadmin_first_name: row.superadmin_first_name,
            superadmin_last_name: row.superadmin_last_name
        }));

        res.json(formatted);
    } catch (err) {
        console.error("Erreur recherche d'orga:", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

router.post("/organizations", authenticateToken, async (req: AuthRequest, res) => {
    const memberId = req.memberId;
    const { name } = req.body;

    if (!name) {
        res.status(400).json({ error: "Nom d'association requis" });
        return;
    }

    try {
        const client = await db.connect();

        try {
            await client.query("BEGIN");

            const orgRes = await client.query(
                "INSERT INTO organizations (name) VALUES ($1) RETURNING id, name",
                [name]
            );

            const orgId = orgRes.rows[0].id;

            await client.query(
                `INSERT INTO member_organization (member_id, organization_id, role, status)
                VALUES ($1, $2, 'superadmin', 'validated')
                `, [memberId, orgId]);

            await client.query("COMMIT");

            res.status(201).json(orgRes.rows[0]);
        } catch (err) {
            await client.query("ROLLBACK");
            console.error(err);
            res.status(500).json({ error: "Erreur lors de la création" });
        } finally {
            client.release();
        }
    } catch (err) {
        res.status(500).json({ error: "Erreur de connexion à la BDD" });
    }
});

export default router;