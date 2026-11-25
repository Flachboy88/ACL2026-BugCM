-- Activité sur la journée entière (0 / 1).
-- Quand elle vaut 1, debut et fin sont des dates sans heure (YYYY-MM-DD), fin exclue.
ALTER TABLE activite ADD COLUMN journee_entiere INTEGER NOT NULL DEFAULT 0
    CHECK (journee_entiere IN (0, 1));
