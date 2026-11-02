INSERT INTO custom_fields (id, uid, scope, type, name, name_key, created_at, updated_at)
VALUES
  (1, 'f1', 'project', 'select', 'Cost center', 'cost center', 0, 0),
  (2, 'f2', 'activity', 'text', 'Ticket', 'ticket', 0, 0),
  (3, 'f3', 'client', 'text', 'Customer number', 'customer number', 0, 0);

INSERT INTO custom_field_options (id, uid, field_id, name, name_key, created_at, updated_at)
VALUES
  (1, 'o1', 1, 'Sales', 'sales', 0, 0);

INSERT INTO project_field_values (project_id, field_id, option_id)
VALUES
  (1, 1, 1);

INSERT INTO activity_field_values (activity_id, field_id, text_value)
VALUES
  (1, 2, 'T-1');

INSERT INTO client_field_values (client_id, field_id, text_value)
VALUES
  (1, 3, 'K-1');
