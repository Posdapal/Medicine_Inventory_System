const MODULES = ['dashboard','products','categories','units','suppliers','stock_in','stock_out','current_stock','stock_history','expiry','reports','users','roles','settings', 'stock'];
const ACTION_COLUMNS = { create:'can_create', read:'can_read', update:'can_update', delete:'can_delete', export:'can_export', import:'can_import', print:'can_print' };
const PERMISSION_COLUMNS = Object.values(ACTION_COLUMNS);
module.exports = { MODULES, ACTION_COLUMNS, PERMISSION_COLUMNS };
