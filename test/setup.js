// Chargé avant chaque fichier de test (voir le script "test" de package.json).
// Les variables doivent être posées AVANT d'importer server/app.js, qui ouvre la base.

// Base SQLite en mémoire : vide à chaque fichier de test, jamais enregistrée, data/agenda.db n'est pas touchée
process.env.DATABASE_FILE = ":memory:";
// Secret des jetons de connexion, réservé aux tests
process.env.SECRET = "secret-des-tests";
