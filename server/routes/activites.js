import express from "express";
import database from "../database.js";
import { droitSurAgenda, peutEcrire, agendasAccessibles } from "../acces.js";

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
        finRecurrence: row.fin_recurrence,
        journeeEntiere: row.journee_entiere === 1
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

// Garde une date sans heure (YYYY-MM-DD) si elle existe vraiment, sinon null
function toJour(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null;
    }
    const utc = toUtc(value);
    return utc !== null && utc.slice(0, 10) === value ? value : null;
}

// Début et fin à enregistrer : des dates sans heure pour une journée entière
// (fin exclue : une activité le 15 va du 15 au 16), sinon des dates UTC
function lireDates(debut, fin, journeeEntiere) {
    if (journeeEntiere) {
        return { debut: toJour(debut), fin: toJour(fin) };
    }
    return { debut: toUtc(debut), fin: toUtc(fin) };
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

// Agenda d'une activité, ou undefined si l'activité n'existe pas
function getAgendaDeActivite(idActivite) {
    return database.prepare(
        "SELECT id_agenda FROM activite WHERE id_activite = ?"
    ).get(idActivite);
}

/**
 * Recherche dans les activités accessibles (ses agendas + agendas partagés)
 * GET /activites/recherche?q=...&start=...&end=...&idAgenda=...
 * Tous les paramètres sont facultatifs. idAgenda peut être répété pour chercher
 * dans plusieurs agendas à la fois (?idAgenda=1&idAgenda=3).
 */
router.get("/activites/recherche", function (request, response) {
    // On ne cherche que dans les agendas auxquels l'utilisateur a accès
    const accessibles = agendasAccessibles(response.locals.user.id).map(function (a) {
        return a.id_agenda;
    });
    if (accessibles.length === 0) {
        return response.json([]);
    }

    // Filtre agenda : un ou plusieurs ?idAgenda=1&idAgenda=3 (Express donne une string ou un tableau).
    // Chaque agenda demandé doit faire partie des agendas accessibles.
    let ids = accessibles;
    if (request.query.idAgenda !== undefined) {
        const demandes = [].concat(request.query.idAgenda).map(Number);
        if (demandes.some(function (id) { return !accessibles.includes(id); })) {
            return response.status(404).json({ erreur: "Agenda introuvable" });
        }
        ids = demandes;
    }

    const conditions = ["id_agenda IN (" + ids.map(function () { return "?"; }).join(", ") + ")"];
    const params = ids.slice();

    // Mots-clés : titre, lieu ou description
    const q = request.query.q;
    if (typeof q === "string" && q.trim() !== "") {
        const motif = "%" + q.trim() + "%";
        conditions.push("(titre LIKE ? OR lieu LIKE ? OR description LIKE ?)");
        params.push(motif, motif, motif);
    }

    // Période : on ne garde que les activités qui chevauchent [start, end[
    const start = toUtc(request.query.start);
    const end = toUtc(request.query.end);
    if ((request.query.start !== undefined && start === null) ||
        (request.query.end !== undefined && end === null)) {
        return response.status(400).json({ erreur: "Période invalide" });
    }
    if (start !== null) {
        conditions.push("fin > ?");
        params.push(start);
    }
    if (end !== null) {
        conditions.push("debut < ?");
        params.push(end);
    }

    const rows = database.prepare(
        "SELECT * FROM activite WHERE " + conditions.join(" AND ") + " ORDER BY debut"
    ).all(...params);
    response.json(rows.map(toJson));
});

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
    // Lire les activités : il faut au moins un droit de lecture sur l'agenda
    if (droitSurAgenda(response.locals.user.id, request.params.idAgenda) === null) {
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
    const { titre, debut, fin, lieu, description, frequence, finRecurrence, journeeEntiere } = request.body ?? {};
    const dates = lireDates(debut, fin, journeeEntiere === true);
    const debutUtc = dates.debut;
    const finUtc = dates.fin;

    // Test val null et cohérence des dates
    const erreur = checkActivite(titre, debutUtc, finUtc);
    if (erreur !== null) {
        return response.status(400).json({ erreur: erreur });
    }
    const recurrence = checkFrequences(frequence, finRecurrence, debutUtc);
    if (recurrence.erreur !== undefined) {
        return response.status(400).json({ erreur: recurrence.erreur });
    }

    // Créer une activité : il faut voir l'agenda (sinon 404), et pouvoir y écrire (sinon 403)
    const droit = droitSurAgenda(response.locals.user.id, request.params.idAgenda);
    if (droit === null) {
        return response.status(404).json({ erreur: "Agenda introuvable" });
    }
    if (!peutEcrire(droit)) {
        return response.status(403).json({ erreur: "Droit insuffisant" });
    }

    // Insertation dans bd
    const result = database.prepare(
        "INSERT INTO activite (titre, debut, fin, lieu, description, frequence, fin_recurrence, journee_entiere, id_agenda) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).run(titre.trim(), debutUtc, finUtc, lieu ?? null, description ?? null,
        recurrence.frequence, recurrence.finRecurrence, journeeEntiere === true ? 1 : 0, request.params.idAgenda);
    
    //Récupération de l'élément crée pour le renvoyer 
    const row = database.prepare("SELECT * FROM activite WHERE id_activite = ?").get(result.lastInsertRowid);
    response.status(201).json(toJson(row));
});

/**
 * Modifie une activité (titre, horaires, lieu, description), sans changer d'agenda
 * PUT
 */
router.put("/activites/:idActivite", function (request, response) {
    const { titre, debut, fin, lieu, description, frequence, finRecurrence, journeeEntiere } = request.body ?? {};
    const dates = lireDates(debut, fin, journeeEntiere === true);
    const debutUtc = dates.debut;
    const finUtc = dates.fin;

    const erreur = checkActivite(titre, debutUtc, finUtc);
    if (erreur !== null) {
        return response.status(400).json({ erreur: erreur });
    }
    const recurrence = checkFrequences(frequence, finRecurrence, debutUtc);
    if (recurrence.erreur !== undefined) {
        return response.status(400).json({ erreur: recurrence.erreur });
    }

    // On modifie seulement si l'activité existe et qu'on peut écrire sur son agenda
    const activite = getAgendaDeActivite(request.params.idActivite);
    if (activite === undefined) {
        return response.status(404).json({ erreur: "Activité introuvable" });
    }
    const droit = droitSurAgenda(response.locals.user.id, activite.id_agenda);
    if (droit === null) {
        return response.status(404).json({ erreur: "Activité introuvable" });
    }
    if (!peutEcrire(droit)) {
        return response.status(403).json({ erreur: "Droit insuffisant" });
    }
    database.prepare(
        "UPDATE activite SET titre = ?, debut = ?, fin = ?, lieu = ?, description = ?, frequence = ?, fin_recurrence = ?, " +
        "journee_entiere = ? WHERE id_activite = ?"
    ).run(titre.trim(), debutUtc, finUtc, lieu ?? null, description ?? null,
        recurrence.frequence, recurrence.finRecurrence, journeeEntiere === true ? 1 : 0,
        request.params.idActivite);

    const row = database.prepare("SELECT * FROM activite WHERE id_activite = ?").get(request.params.idActivite);
    response.json(toJson(row));
});

/**
 * Delete une activité de la DB en fonction de id_activite
 */
router.delete("/activites/:idActivite", function (request, response) {
    // On supprime seulement si l'activité existe et qu'on peut écrire sur son agenda
    const activite = getAgendaDeActivite(request.params.idActivite);
    if (activite === undefined) {
        return response.status(404).json({ erreur: "Activité introuvable" });
    }
    const droit = droitSurAgenda(response.locals.user.id, activite.id_agenda);
    if (droit === null) {
        return response.status(404).json({ erreur: "Activité introuvable" });
    }
    if (!peutEcrire(droit)) {
        return response.status(403).json({ erreur: "Droit insuffisant" });
    }
    database.prepare("DELETE FROM activite WHERE id_activite = ?").run(request.params.idActivite);
    response.status(204).end(); // Succes
});

export default router;
