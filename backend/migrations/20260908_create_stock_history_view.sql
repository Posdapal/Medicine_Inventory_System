-- The SQL dump defines this view, but the initial migration omitted it.
-- Required by the stock-history and reports endpoints. No stock data is changed.
CREATE OR REPLACE VIEW v_stock_history AS
SELECT
  p.product_name AS product,
  pb.batch_number,
  sm.movement_type,
  sm.quantity_before,
  sm.movement_quantity,
  sm.quantity_after,
  DATE(sm.created_at) AS date
FROM stock_movements sm
JOIN products p ON p.id = sm.product_id
JOIN product_batches pb ON pb.id = sm.batch_id
ORDER BY sm.created_at DESC;
