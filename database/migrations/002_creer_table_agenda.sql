-- A set of activities owned by one user (for example "Cours" or "Sport")
CREATE TABLE IF NOT EXISTS agenda (
    id_agenda INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    couleur TEXT NOT NULL,
    description TEXT,
    id_utilisateur INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE
);
