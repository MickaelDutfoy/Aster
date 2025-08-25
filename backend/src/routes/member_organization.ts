import { Router } from 'express';
import { db } from '../db';
import { AuthRequest } from '../types';
import { authenticateToken } from '../middlewares/authenticateToken';

const router = Router();

router.get("/member-organization", authenticateToken, async (req: AuthRequest, res) => {
  const memberId = req.memberId;
  if (!memberId) {
    res.status(400).json({ error: "ID manquant" });
    return;
  }

  try {
    const orgs = await db.query(`
      SELECT mo.organization_id AS id, mo.role, mo.status, o.name
      FROM member_organization mo
      JOIN organizations o ON mo.organization_id = o.id
      WHERE mo.member_id = $1
      ORDER BY o.name ASC
    `, [memberId]);

    const rows = orgs.rows;
    const organizations = rows.filter(r => r.status === 'validated');
    const myPending = rows.filter(r => r.status === 'pending')
      .map(r => ({ id: r.id, name: r.name, status: r.status }));

    const admin = await db.query(`
      SELECT mo.organization_id AS id, mo.role, mo.status, o.name
      FROM member_organization mo
      JOIN organizations o ON mo.organization_id = o.id
      WHERE mo.member_id = $1
        AND mo.role = 'superadmin'
    `, [memberId]);

    const adminIds = admin.rows.map(r => r.id);
    let pending = { rows: [] };
    if (adminIds.length > 0) {
      pending = await db.query(`
        SELECT 
          pm.organization_id  AS org_id,
          o.name              AS org_name,
          m.id                AS member_id,
          m.first_name,
          m.last_name,
          m.email,
          m.phone_number
        FROM member_organization pm
        JOIN members m       ON m.id = pm.member_id
        JOIN organizations o ON o.id = pm.organization_id
        WHERE pm.status = 'pending'
          AND pm.organization_id = ANY($1::int[])
        ORDER BY o.name ASC, m.last_name ASC
      `, [adminIds]);
    }

    res.json({ organizations, myPending, pending: pending.rows });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/member-organization", authenticateToken, async (req: AuthRequest, res) => {
  const { organizationId } = req.body;
  const memberId = req.memberId;

  try {
    const check = await db.query(`
      SELECT * FROM member_organization
      WHERE member_id = $1 AND organization_id = $2
    `, [memberId, organizationId]);

    if (check.rows.length > 0) {
      res.status(409).json({ error: "already_member" });
      return;
    }

    await db.query(`
        INSERT INTO member_organization (member_id, organization_id, role, status)
        VALUES ($1, $2, 'member', 'pending')
    `, [memberId, organizationId]);

    res.status(201).json({ message: "Demande envoyée" });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.patch("/member-organization/:orgId/members/:memberId", authenticateToken, async (req: AuthRequest, res) => {
  const callerId = req.memberId;
  const orgId = Number(req.params.orgId);
  const targetId = Number(req.params.memberId);
  const status = String(req.body.status).toLowerCase();

  if (!callerId || !Number.isFinite(orgId) || !Number.isFinite(targetId)) {
    res.status(400).json({ error: "Paramètres invalides" });
    return;
  }

  if (!["validated", "rejected"].includes(status)) {
    res.status(400).json({ error: "Entrée invalide" });
    return;
  }

  try {
    const check = await db.query(`
      SELECT 1
      FROM member_organization
      WHERE member_id=$1
      AND organization_id=$2
      AND role='superadmin'
      AND status='validated'
    `, [callerId, orgId]);

    if (check.rows.length === 0) {
      res.status(403).json({ error: "Accès refusé." });
      return;
    }

    const patch = await db.query(`
      UPDATE member_organization
      SET status=$1
      WHERE organization_id=$2
      AND member_id=$3
      AND status='pending'
      RETURNING member_id, status
    `, [status, orgId, targetId]);

    if (patch.rows.length === 0) {
      res.status(404).json({ error: "Échec de la validation." });
      return;
    }

    res.status(200).json(patch.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;