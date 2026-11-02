INSERT INTO projects (id, uid, name, name_key, created_at, updated_at)
VALUES
  (1, 'p1', 'Alpha', 'alpha', 0, 0),
  (2, 'p2', 'Beta', 'beta', 0, 0);

INSERT INTO activities (id, uid, project_id, name, name_key, created_at, updated_at)
VALUES
  (1, 'a1', 1, 'Build', 'build', 0, 0),
  (2, 'a2', 2, 'Run', 'run', 0, 0);

INSERT INTO tags (id, uid, name, name_key, created_at, updated_at)
VALUES
  (1, 't1', 'meeting', 'meeting', 0, 0),
  (2, 't2', 'support', 'support', 0, 0);

INSERT INTO activity_tags (activity_id, tag_id)
VALUES
  (1, 1),
  (1, 2),
  (2, 2);

INSERT INTO time_entries (uid, activity_id, date, started_at, ended_at, timezone, duration_sec, note, created_at, updated_at)
VALUES
  ('e1', 1, '2026-01-05', NULL, NULL, NULL, 3600, 'by duration', 0, 0),
  ('e2', 2, '2026-01-05', 1000, 4600, 'Europe/Berlin', 3600, NULL, 0, 0),
  ('e3', 1, '2026-01-06', 5000, NULL, 'Europe/Berlin', NULL, 'running', 0, 0);
