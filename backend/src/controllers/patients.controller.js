const { query, ok, fail, asyncHandler } = require('../utils/helper');

// GET /api/patients?search=
const getAll = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const rows = await query(
    'SELECT * FROM patients WHERE full_name LIKE ? ORDER BY created_at DESC',
    [search]
  );
  return ok(res, rows);
});

// GET /api/patients/:id -> includes prescription history
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const patientRows = await query('SELECT * FROM patients WHERE id = ?', [id]);
  if (!patientRows[0]) return fail(res, 'Patient not found', 404);

  const prescriptions = await query(
    `SELECT p.*, u.full_name AS prescribed_by_name
     FROM prescriptions p
     JOIN users u ON u.id = p.prescribed_by
     WHERE p.patient_id = ?
     ORDER BY p.prescription_date DESC`,
    [id]
  );

  return ok(res, { ...patientRows[0], prescriptions });
});

// POST /api/patients
const create = asyncHandler(async (req, res) => {
  const { full_name, gender, date_of_birth, phone, email, address, blood_group } = req.body;
  if (!full_name) return fail(res, 'Full name is required', 400);

  const result = await query(
    `INSERT INTO patients (full_name, gender, date_of_birth, phone, email, address, blood_group)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [full_name, gender || null, date_of_birth || null, phone || null, email || null, address || null, blood_group || null]
  );
  return ok(res, { id: result.insertId }, 'Patient created', 201);
});

// PUT /api/patients/:id
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { full_name, gender, date_of_birth, phone, email, address, blood_group } = req.body;

  await query(
    `UPDATE patients
     SET full_name=?, gender=?, date_of_birth=?, phone=?, email=?, address=?, blood_group=?
     WHERE id=?`,
    [full_name, gender, date_of_birth, phone, email, address, blood_group, id]
  );
  return ok(res, null, 'Patient updated');
});

// DELETE /api/patients/:id
const remove = asyncHandler(async (req, res) => {
  await query('DELETE FROM patients WHERE id = ?', [req.params.id]);
  return ok(res, null, 'Patient deleted');
});

module.exports = { getAll, getById, create, update, remove };
