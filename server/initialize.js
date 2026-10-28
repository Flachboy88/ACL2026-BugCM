import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin vers la base de données : /data/agenda.db
const dbPath = path.join(__dirname, '..', 'data', 'agenda.db');
const db = new Database(dbPath);

// Permet d'utiliser les foreign keys 
db.pragma('foreign_keys = ON');

// 1. Exécution des fichiers de migration (.sql)
const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');

if (fs.existsSync(migrationsDir)) {
    const sqlFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

    sqlFiles.forEach(file => {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        db.exec(sql);
        console.log(`Migration exécutée : ${file}`);
    });
} else {
    console.log("Dossier de migrations non trouvé.");
}

const testUsers = [
    { nom: 'Mathias', email: 'TestMathias@gmail.com', passwordHash: 'TestMathias' },
    { nom: 'Corentin', email: 'TestCorentin@gmail.com', passwordHash: 'TestCorentin' },
    { nom: 'Romaric', email: 'TestRomaric@gmail.com', passwordHash: 'TesRomaric' },
    { nom: 'Nyar', email: 'TestNyar@gmail.com', passwordHash: 'TestNyar' },
    { nom: 'Martin', email: 'TestMartin@gmail.com', passwordHash: 'TestMartin' },
    { nom: 'Matteo', email: 'TestMatteo@gmail.com', passwordHash: 'TestMatteo' }
];

const insertData = db.prepare("INSERT OR IGNORE INTO utilisateur(nom, email, mot_de_passe_hash) VALUES(?, ?, ?)");
const defautAgenda = db.prepare("INSERT OR IGNORE INTO agenda (nom, couleur, description, id_utilisateur) VALUES(?, ?, ?, ?)");
const GetterIdUtilisateur = db.prepare("SELECT id_utilisateur FROM utilisateur WHERE nom = ? AND email = ? AND mot_de_passe_hash = ? ");

const getRandomHexColor = () => {
  const randomNumber = Math.floor(Math.random() * 16777215);
  return `#${randomNumber.toString(16).padStart(6, '0')}`;
};



testUsers.forEach(user => { 
    
    insertData.run(user.nom, user.email, user.passwordHash);
    console.log("Création sur : " + user.nom);
    const userRow = GetterIdUtilisateur.get(user.nom, user.email, user.passwordHash);

    if (userRow) {
        const userId = userRow.id_utilisateur; 
        defautAgenda.run(user.nom, getRandomHexColor(), "default", userId); 
    } else {
        console.error(`Impossible de récupérer l'ID pour ${user.nom}`);
    }
});

