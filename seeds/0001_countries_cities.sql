-- Seed: countries and cities
-- Safe to re-run — INSERT OR IGNORE skips rows that already exist

INSERT OR IGNORE INTO countries (slug, name, sort_order) VALUES
  ('united-kingdom', 'United Kingdom', 10),
  ('france',         'France',         20),
  ('italy',          'Italy',          30),
  ('spain',          'Spain',          40);

INSERT OR IGNORE INTO cities (country_id, slug, name) VALUES
  ((SELECT id FROM countries WHERE slug = 'united-kingdom'), 'london',    'London'),
  ((SELECT id FROM countries WHERE slug = 'united-kingdom'), 'edinburgh', 'Edinburgh'),
  ((SELECT id FROM countries WHERE slug = 'france'),         'paris',     'Paris'),
  ((SELECT id FROM countries WHERE slug = 'france'),         'nice',      'Nice'),
  ((SELECT id FROM countries WHERE slug = 'italy'),          'rome',      'Rome'),
  ((SELECT id FROM countries WHERE slug = 'italy'),          'florence',  'Florence'),
  ((SELECT id FROM countries WHERE slug = 'spain'),          'barcelona', 'Barcelona'),
  ((SELECT id FROM countries WHERE slug = 'spain'),          'seville',   'Seville');
