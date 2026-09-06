function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
}

const DUPLICATE_MESSAGES = {
  uq_roles_name: 'A role with this name already exists.',
  uq_users_username: 'This username is already in use.',
  uq_users_email: 'This email address is already in use.',
  uq_user_module: 'Permissions for this user and module already exist.',
  uq_settings_key: 'A setting with this key already exists.',
  uq_categories_name: 'A category with this name already exists.',
  uq_units_name: 'A unit with this name already exists.',
  uq_products_code: 'A product with this code already exists.',
  uq_suppliers_code: 'A supplier with this code already exists.',
  uq_batches_product_batch: 'This batch number already exists for the selected product.',
  uq_transactions_number: 'A transaction with this number already exists.',
};

function duplicateMessage(err) {
  const databaseMessage = err.sqlMessage || err.message || '';
  const constraint = Object.keys(DUPLICATE_MESSAGES).find((key) => databaseMessage.includes(key));
  return constraint
    ? DUPLICATE_MESSAGES[constraint]
    : 'This value already exists. Please use a different value.';
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
    return res.status(409).json({
      success: false,
      message: duplicateMessage(err),
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.sqlMessage || err.message || 'Internal server error',
  });
}

module.exports = { notFound, errorHandler, duplicateMessage };
