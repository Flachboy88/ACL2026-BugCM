-- A share: one user has one right ('lecture' or 'ecriture') on one agenda.
-- The owner is not stored here (an owner always has every right on their agendas).
CREATE TABLE IF NOT EXISTS partage (
    id_agenda INTEGER NOT NULL REFERENCES agenda(id_agenda) ON DELETE CASCADE,
    id_utilisateur INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    droit TEXT NOT NULL CHECK (droit IN ('lecture', 'ecriture')),
    PRIMARY KEY (id_agenda, id_utilisateur)
);
