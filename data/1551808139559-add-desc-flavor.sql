-- Adds additional table for flavor text

DROP TABLE IF EXISTS flavor_text;

CREATE TABLE IF NOT EXISTS flavor_text(
  species_id INTEGER,
  text TEXT,
  FOREIGN KEY (species_id) REFERENCES species(national_dex_id)
);