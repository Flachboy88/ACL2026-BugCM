import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(data, 'agenda.db'));

const testUsers = [

    { nom : Mathias, email : 'TestMathias@gmail.com', passwordHash : 'TestMathias'},
    { nom : Corentin, email : 'TestCorentin@gmail.com', passwordHash : 'TestCorentin'},
    { nom : Romaric, email : 'TestRomaric@gmail.com', passwordHash : 'TesRomaric'},
    { nom : Nyar, email : 'TestNyar@gmail.com', passwordHash : 'TestNyar'},
    { nom : Martin, email : 'TestMartin@gmail.com', passwordHash : 'TestMartin'},
    { nom : Matteo, email : 'TestMatteo@gmail.com', passwordHash : 'TestMatteo'},

]

const insertData = db.prepare(" INSERT OR IGNORE INTO utilisateur(nom, email, mot_de_passe_hash) VALUES(?,?,?) ");

testUsers.forEach( user => { 
    insertData.run(user.nom, user.email, user.passwordHash);
    console.log("Execution sur " + user.nom);
});
