CREATE TABLE massnahmen (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  beschreibung TEXT,
  status       VARCHAR(50)
);

CREATE TABLE kriterien (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  beschreibung TEXT
);

CREATE TABLE massnahmen_bewertungen (
  id_massnahme  INTEGER NOT NULL,
  id_kriterium  INTEGER NOT NULL,
  bewertung     SMALLINT CHECK (bewertung BETWEEN 1 AND 5),

  -- Composite Primary Key (beide Spalten zusammen = eindeutig)
  PRIMARY KEY (id_massnahme, id_kriterium),

  -- Foreign Keys
  CONSTRAINT fk_massnahme
    FOREIGN KEY (id_massnahme) REFERENCES massnahmen(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_kriterium
    FOREIGN KEY (id_kriterium) REFERENCES kriterien(id)
    ON DELETE CASCADE
);