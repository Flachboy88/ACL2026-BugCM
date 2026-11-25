-- Occurrence d'une activité récurrente qui n'est plus affichée (supprimée ou détachée de la série).
-- date_occurrence est la date de l'occurrence, au format YYYY-MM-DD.
CREATE TABLE IF NOT EXISTS exception_activite (
    id_activite INTEGER NOT NULL REFERENCES activite(id_activite) ON DELETE CASCADE,
    date_occurrence TEXT NOT NULL,
    PRIMARY KEY (id_activite, date_occurrence)
);
