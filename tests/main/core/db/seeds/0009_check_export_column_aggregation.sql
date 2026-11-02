INSERT INTO export_templates (id, uid, name, name_key, format, layout, created_at, updated_at)
VALUES
  (2, 'x2', 'Per project', 'per project', 'xlsx', 'summed', 0, 0);

INSERT INTO export_template_columns (template_id, position, builtin, field_id, header, aggregation)
VALUES
  (2, 0, 'project', NULL, NULL, 'group'),
  (2, 1, NULL, 2, NULL, 'list_distinct'),
  (2, 2, 'tags', NULL, NULL, NULL),
  (2, 3, 'duration_h', NULL, NULL, 'sum');
