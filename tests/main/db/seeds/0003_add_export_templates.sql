INSERT INTO export_templates (id, uid, name, name_key, format, created_at, updated_at)
VALUES
  (1, 'x1', 'Billing', 'billing', 'csv', 0, 0);

INSERT INTO export_template_columns (template_id, position, builtin, field_id, header)
VALUES
  (1, 0, 'date', NULL, NULL),
  (1, 1, NULL, 2, 'Ticket'),
  (1, 2, 'duration_min', NULL, 'Minutes');
