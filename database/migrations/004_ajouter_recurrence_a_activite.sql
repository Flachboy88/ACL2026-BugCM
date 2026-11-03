ALTER TABLE activite ADD COLUMN frequence TEXT
    CHECK (frequence IN ('quotidien', 'hebdomadaire', 'mensuel'));
ALTER TABLE activite ADD COLUMN fin_recurrence TEXT;
