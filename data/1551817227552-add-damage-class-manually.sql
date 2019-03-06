-- Adds damage class entries by hand, only 3 entries, no need to go to the api

-- Damage class table is malformed, fixes
ALTER TABLE damage_class DROP COLUMN IF EXISTS decription;
ALTER TABLE damage_class ADD COLUMN IF NOT EXISTS description TEXT;

INSERT INTO damage_class(api_id, description) VALUES(1, 'status');
INSERT INTO damage_class(api_id, description) VALUES(2, 'physical');
INSERT INTO damage_class(api_id, description) VALUES(3, 'special');