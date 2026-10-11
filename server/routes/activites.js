import express from "express";
import database from "../database.js";

const router = express.Router();

function toJson(row) {
    return {
        idActivite: row.id_activite,
        idAgenda: row.id_agenda,
        titre: row.titre,
        debut: row.debut,
        fin: row.fin,
        lieu: row.lieu,
        description: row.description
    };
}

// Heure Format US -> Format France 
function toUtc(value) {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Recupère les activitées de l'agenda
 */
router.get("/agendas/:idAgenda/activites", function (request, response) {
    const start = toUtc(request.query.start);
    const end = toUtc(request.query.end);
    if (start === null || end === null) {
        return response.status(400).json({ erreur: "Période invalide" });
    }
    // Eviter de charger toute la database comme un bléreau
    const rows = database.prepare(
        "SELECT * FROM activite WHERE id_agenda = ? AND debut < ? AND fin > ?"
    ).all(request.params.idAgenda, end, start);
    response.json(rows.map(toJson));
});

/**
 * Création d'une activité ratachée à un agenda
 */
router.post("/agendas/:idAgenda/activites", function (request, response) {
    const { titre, debut, fin, lieu, description } = request.body ?? {};
    const debutUtc = toUtc(debut);
    const finUtc = toUtc(fin);

    // Test val null 
    if (typeof titre !== "string" || titre.trim() === "" || debutUtc === null || finUtc === null) {
        return response.status(400).json({ erreur: "Champs manquants" });
    }
    
    // Test cohérences des valeurs
    if (finUtc <= debutUtc) {
        return response.status(400).json({ erreur: "La fin doit être après le début" });
    }
    
    // Test Existance d'un aganda 
    const agenda = database.prepare("SELECT id_agenda FROM agenda WHERE id_agenda = ?").get(request.params.idAgenda);
    if (agenda === undefined) {
        return response.status(404).json({ erreur: "Agenda introuvable" });
    }
    
    // Insertation dans bd
    const result = database.prepare(
        "INSERT INTO activite (titre, debut, fin, lieu, description, id_agenda) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(titre.trim(), debutUtc, finUtc, lieu ?? null, description ?? null, agenda.id_agenda);
    
    //Récupération de l'élément crée pour le renvoyer 
    const row = database.prepare("SELECT * FROM activite WHERE id_activite = ?").get(result.lastInsertRowid);
    response.status(201).json(toJson(row));
});

/**
 * Delete une activité de la DB en fonction de id_activite
 */
router.delete("/activites/:idActivite", function (request, response) {
    const result = database.prepare("DELETE FROM activite WHERE id_activite = ?").run(request.params.idActivite);
    // Test de Changement -> 404 si rien n'a changé
    if (result.changes === 0) {
        return response.status(404).json({ erreur: "Activité introuvable" });
    }
    response.status(204).end(); // Succes
});

export default router;