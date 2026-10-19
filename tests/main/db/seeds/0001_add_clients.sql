INSERT INTO clients (id, uid, name, name_key, created_at, updated_at)
VALUES
  (1, 'c1', 'Contoso', 'contoso', 0, 0),
  (2, 'c2', 'Fabrikam', 'fabrikam', 0, 0);

UPDATE projects SET client_id = 1 WHERE id = 1;

UPDATE activities SET client_id = 2 WHERE id = 2;
