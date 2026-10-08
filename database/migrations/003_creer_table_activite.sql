-- An event placed in an agenda.
-- Dates are ISO text in UTC (for example '2026-10-15T12:30:00Z'), so they can be compared as text.
CREATE TABLE activite (
    id_activite INTEGER PRIMARY KEY AUTOINCREMENT,
    titre TEXT NOT NULL,
    debut TEXT NOT NULL,
    fin TEXT NOT NULL,
    lieu TEXT,
    description TEXT,
    id_agenda INTEGER NOT NULL REFERENCES agenda(id_agenda) ON DELETE CASCADE,
    CHECK (fin > debut)
);
