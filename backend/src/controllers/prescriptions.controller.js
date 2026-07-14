const { query, ok, fail, asyncHandler, beginTransaction, commit, rollback } = require('../utils/helper');

// GET /api/prescriptions?search=&status=
const getAll = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const conditions = [];
  const params = [];

  if (search) { conditions.push('pt.full_name LIKE ?'); params.push(`%${search}%`); }
  if (status) { conditions.push('p.status = ?'); params.push(status); }

  let sql = `
    SELECT p.*, pt.full_name AS patient_name, u.full_name AS prescribed_by_name,
      (SELECT COUNT(*) FROM prescription_items pi WHERE pi.prescription_id = p.id) AS item_count
    FROM prescriptions p
    JOIN patients pt ON pt.id = p.patient_id
    JOIN users u ON u.id = p.prescribed_by
  `;
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY p.prescription_date DESC';

  const rows = await query(sql, params);
  return ok(res, rows);
});

// GET /api/prescriptions/:id -> with line items
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rows = await query(
    `SELECT p.*, pt.full_name AS patient_name, u.full_name AS prescribed_by_name
     FROM prescriptions p
     JOIN patients pt ON pt.id = p.patient_id
     JOIN users u ON u.id = p.prescribed_by
     WHERE p.id = ?`,
    [id]
  );
  if (!rows[0]) return fail(res, 'Prescription not found', 404);

  const items = await query(
    `SELECT pi.*, m.name AS medicine_name
     FROM prescription_items pi
     JOIN medicines m ON m.id = pi.medicine_id
     WHERE pi.prescription_id = ?`,
    [id]
  );
  return ok(res, { ...rows[0], items });
});

// POST /api/prescriptions
// body: { patient_id, diagnosis, notes, items: [{ medicine_id, quantity, dosage, instructions }] }
const create = asyncHandler(async (req, res) => {
  const { patient_id, diagnosis, notes, items } = req.body;
  const prescribed_by = req.user.id;

  if (!patient_id) return fail(res, 'Patient is required', 400);
  if (!items || !items.length) return fail(res, 'At least one medicine item is required', 400);

  await beginTransaction();
  try {
    const result = await query(
      `INSERT INTO prescriptions (patient_id, prescribed_by, diagnosis, notes) VALUES (?, ?, ?, ?)`,
      [patient_id, prescribed_by, diagnosis || null, notes || null]
    );
    const prescriptionId = result.insertId;

    for (const item of items) {
      await query(
        `INSERT INTO prescription_items (prescription_id, medicine_id, quantity, dosage, instructions)
         VALUES (?, ?, ?, ?, ?)`,
        [prescriptionId, item.medicine_id, item.quantity || 1, item.dosage || null, item.instructions || null]
      );
    }

    await commit();
    return ok(res, { id: prescriptionId }, 'Prescription created', 201);
  } catch (err) {
    await rollback();
    throw err;
  }
});

// PATCH /api/prescriptions/:id/status
// When status flips to 'dispensed': logs stock_transactions (out), decrements stock,
// and records medicine_usage for the usage report chart.
const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending', 'dispensed', 'cancelled'];
  if (!validStatuses.includes(status)) return fail(res, 'Invalid status', 400);

  await beginTransaction();
  try {
    await query('UPDATE prescriptions SET status = ? WHERE id = ?', [status, id]);

    if (status === 'dispensed') {
      const items = await query('SELECT * FROM prescription_items WHERE prescription_id = ?', [id]);

      for (const item of items) {
        await query(
          `INSERT INTO stock_transactions (medicine_id, transaction_type, quantity, reference_id, created_by)
           VALUES (?, 'out', ?, ?, ?)`,
          [item.medicine_id, item.quantity, item.id, req.user.id]
        );
        await query(
          'UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.medicine_id]
        );
        await query(
          `INSERT INTO medicine_usage (medicine_id, usage_date, quantity_used, prescription_item_id)
           VALUES (?, CURDATE(), ?, ?)`,
          [item.medicine_id, item.quantity, item.id]
        );
      }
    }

    await commit();
    return ok(res, null, `Prescription marked as ${status}`);
  } catch (err) {
    await rollback();
    throw err;
  }
});

// DELETE /api/prescriptions/:id
const remove = asyncHandler(async (req, res) => {
  await query('DELETE FROM prescriptions WHERE id = ?', [req.params.id]);
  return ok(res, null, 'Prescription deleted');
});

module.exports = { getAll, getById, create, updateStatus, remove };
