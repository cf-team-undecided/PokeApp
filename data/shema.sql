DROP TABLE IF EXISTS species, moves_learned, possible_abilities, types_damage_to, types_damage_from, types, abilities, moves, target_type, damage_class CASCADE;

CREATE TABLE IF NOT EXISTS types (
  api_id INTEGER PRIMARY KEY,
  name VARCHAR(10)
);


CREATE TABLE IF NOT EXISTS abilities (
  api_id INTEGER PRIMARY KEY,
  name VARCHAR(20),
  description text
);

CREATE TABLE IF NOT EXISTS target_type (
  api_id INTEGER PRIMARY KEY,
  name TEXT
);

CREATE TABLE IF NOT EXISTS damage_class (
  api_id INTEGER PRIMARY KEY,
  decription TEXT
);

CREATE TABLE IF NOT EXISTS moves (
  api_id INTEGER PRIMARY KEY,
  name VARCHAR(20),
  power INTEGER,
  accuracy INTEGER,
  target_type_id INTEGER,
  damage_class_id INTEGER,
  type_id INTEGER,
  effect_text TEXT,
  FOREIGN KEY (target_type_id) REFERENCES target_type(api_id),
  FOREIGN KEY (damage_class_id) REFERENCES damage_class(api_id)
);


CREATE TABLE IF NOT EXISTS species (
  national_dex_id INTEGER PRIMARY KEY,
  name VARCHAR(20),
  image_url VARCHAR(100),
  fem_image_url VARCHAR(100),
  type_primary_id INTEGER,
  type_secondary_id INTEGER,
  height INTEGER,
  weight INTEGER,
  FOREIGN KEY (type_primary_id) REFERENCES types(api_id),
  FOREIGN KEY (type_secondary_id) REFERENCES types(api_id)
);

CREATE TABLE IF NOT EXISTS  moves_learned (
  species_id INTEGER,
  move_id INTEGER,
  level_learned INTEGER,
  FOREIGN KEY (species_id) REFERENCES species(national_dex_id),
  FOREIGN KEY (move_id) REFERENCES moves(api_id)
);

CREATE TABLE IF NOT EXISTS possible_abilities (
  species_id INTEGER,
  abilitiy_id INTEGER,
  is_hidden BOOLEAN,
  FOREIGN KEY (species_id) REFERENCES species(national_dex_id),
  FOREIGN KEY (abilitiy_id) REFERENCES abilities(api_id)
);

CREATE TABLE IF NOT EXISTS types_damage_to (
  type_id INTEGER,
  type_damage_to INTEGER,
  type_damage_to_multiplier NUMERIC(2,1),
  FOREIGN KEY (type_id) REFERENCES types(api_id),
  FOREIGN KEY (type_damage_to) REFERENCES types(api_id)
);

CREATE TABLE IF NOT EXISTS types_damage_from (
  type_id INTEGER,
  type_damage_from INTEGER,
  type_damage_from_multiplier NUMERIC(2,1),
  FOREIGN KEY (type_id) REFERENCES types(api_id),
  FOREIGN KEY (type_damage_from) REFERENCES types(api_id)
);


INSERT INTO types(api_id, name) VALUES (0, 'none');