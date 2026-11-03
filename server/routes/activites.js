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
        description: row.description,
        frequence: row.frequence,
        finRecurrence: row.fin_recurrence
    };
}

const FREQUENCES = [ "quotidien", "hebdomadaire", "mensuel" ];

function checkFrequences(frequence, finRecurrence, debutUtc){
    // Pas de répétition -> activité normale
    if (frequence === undefined || frequence === null || frequence === "") {
        return { frequence: null, finRecurrence: null };
    }
    if (!FREQUENCES.includes(frequence)) {
        return { erreur: "Répétition invalide" };
    }
    // Pas de date de fin
    if (finRecurrence === undefined || finRecurrence === null || finRecurrence === "") {
        return { frequence: frequence, finRecurrence: null };
    }
    if (typeof finRecurrence !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(finRecurrence) || toUtc(finRecurrence) === null) {
        return { erreur: "Date de fin de répétition invalide" };
    }
    if (finRecurrence < debutUtc.slice(0, 10)) {
        return { erreur: "La répétition doit finir après le début" };
    }
    return { frequence: frequence, finRecurrence: finRecurrence };
}


// Convertit une date reçue en texte ISO UTC ("...Z"), ou null si elle est invalide
function toUtc(value) {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString();
}

// Vérifie les champs d'une activité : renvoie le message d'erreur, ou null si tout est bon
function checkActivite(titre, debutUtc, finUtc) {
    if (typeof titre !== "string" || titre.trim() === "" || debutUtc === null || finUtc === null) {
        return "Champs manquants";
    }
    if (finUtc <= debutUtc) {
        return "La fin doit être après le début";
    }
    return null;
}

// Agenda demandé s'il appartient à l'utilisateur connecté, undefined sinon
function getAgendaOfUser(idAgenda, response) {
    return database.prepare(
        "SELECT id_agenda FROM agenda WHERE id_agenda = ? AND id_utilisateur = ?"
    ).get(idAgenda, response.locals.user.id);
}

/**
 * Recupère les activitées de l'agenda
 * GET
 */
router.get("/agendas/:idAgenda/activites", function (request, response) {
    const start = toUtc(request.query.start);
    const end = toUtc(request.query.end);
    if (start === null || end === null) {
        return response.status(400).json({ erreur: "Période invalide" });
    }
    if (getAgendaOfUser(request.params.idAgenda, response) === undefined) {
        return response.status(404).json({ erreur: "Agenda introuvable" });
    }
    // Activités qui chevauchent la période + séries qui peuvent la toucher
    const rows = database.prepare(
        "SELECT * FROM activite WHERE id_agenda = ? AND debut < ? AND (fin > ? OR " +
        "(frequence IS NOT NULL AND (fin_recurrence IS NULL OR fin_recurrence >= date(?, '-1 day'))))"
    ).all(request.params.idAgenda, end, start, start);
    response.json(rows.map(toJson));
});

/**
 * Création d'une activité ratachée à un agenda
 * POST
 */
router.post("/agendas/:idAgenda/activites", function (request, response) {
    const { titre, debut, fin, lieu, description, frequence, finRecurrence } = request.body ?? {};
    const debutUtc = toUtc(debut);
    const finUtc = toUtc(fin);

    // Test val null et cohérence des dates
    const erreur = checkActivite(titre, debutUtc, finUtc);
    if (erreur !== null) {
        return response.status(400).json({ erreur: erreur });
    }
    const recurrence = checkFrequences(frequence, finRecurrence, debutUtc);
    if (recurrence.erreur !== undefined) {
        return response.status(400).json({ erreur: recurrence.erreur });
    }

    // Test Existance d'un aganda (et qu'il appartient à l'utilisateur)
    const agenda = getAgendaOfUser(request.params.idAgenda, response);
    if (agenda === undefined) {
        return response.status(404).json({ erreur: "Agenda introuvable" });
    }
    
    // Insertation dans bd
    const result = database.prepare(
        "INSERT INTO activite (titre, debut, fin, lieu, description, frequence, fin_recurrence, id_agenda) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        ).run(titre.trim(), debutUtc, finUtc, lieu ?? null, description ?? null,
        recurrence.frequence, recurrence.finRecurrence, agenda.id_agenda);
    
    //Récupération de l'élément crée pour le renvoyer 
    const row = database.prepare("SELECT * FROM activite WHERE id_activite = ?").get(result.lastInsertRowid);
    response.status(201).json(toJson(row));
});

/**
 * Modifie une activité (titre, horaires, lieu, description), sans changer d'agenda
 * PUT
 */
router.put("/activites/:idActivite", function (request, response) {
    const { titre, debut, fin, lieu, description, frequence, finRecurrence } = request.body ?? {};
    const debutUtc = toUtc(debut);
    const finUtc = toUtc(fin);

    const erreur = checkActivite(titre, debutUtc, finUtc);
    if (erreur !== null) {
        return response.status(400).json({ erreur: erreur });
    }
    const recurrence = checkFrequences(frequence, finRecurrence, debutUtc);
    if (recurrence.erreur !== undefined) {
        return response.status(400).json({ erreur: recurrence.erreur });
    }

    // On ne modifie que si l'activité est dans un agenda de l'utilisateur connecté
    const result = database.prepare(
        "UPDATE activite SET titre = ?, debut = ?, fin = ?, lieu = ?, description = ?, frequence = ?, fin_recurrence = ? " +
        "WHERE id_activite = ? AND id_agenda IN (SELECT id_agenda FROM agenda WHERE id_utilisateur = ?)"
    ).run(titre.trim(), debutUtc, finUtc, lieu ?? null, description ?? null,
        recurrence.frequence, recurrence.finRecurrence,
        request.params.idActivite, response.locals.user.id);
    if (result.changes === 0) {
        return response.status(404).json({ erreur: "Activité introuvable" });
    }

    const row = database.prepare("SELECT * FROM activite WHERE id_activite = ?").get(request.params.idActivite);
    response.json(toJson(row));
});

/**
 * Delete une activité de la DB en fonction de id_activite
 */
router.delete("/activites/:idActivite", function (request, response) {
    // On ne supprime que si l'activité est dans un agenda de l'utilisateur connecté
    const result = database.prepare(
        "DELETE FROM activite WHERE id_activite = ? AND id_agenda IN (SELECT id_agenda FROM agenda WHERE id_utilisateur = ?)"
    ).run(request.params.idActivite, response.locals.user.id);
    // Test de Changement -> 404 si rien n'a changé
    if (result.changes === 0) {
        return response.status(404).json({ erreur: "Activité introuvable" });
    }
    response.status(204).end(); // Succes
});

export default router;
