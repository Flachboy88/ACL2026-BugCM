import express from "express";
import database from "../database.js";
import { droitSurAgenda } from "../acces.js";

const router = express.Router();

// Id of the logged in user, read from the token by the auth middleware
function getIdUtilisateur(response) {
    return response.locals.user.id;
}

// A share row (joined with its user) -> the JSON sent to the client (never the password)
function toJson(row) {
    return {
        idAgenda: row.id_agenda,
        idUtilisateur: row.id_utilisateur,
        nom: row.nom,
        email: row.email,
        droit: row.droit
    };
}

const DROITS = ["lecture", "ecriture"];

// Share an agenda with another user (by email), or update their right if already shared.
// Only the owner can do this.
router.post("/agendas/:idAgenda/partages", function (request, response) {
    const idAgenda = request.params.idAgenda;
    const { email, droit } = request.body ?? {};

    // Only the owner manages shares: no access at all -> 404 (we do not reveal the agenda),
    // access but not the owner -> 403.
    const monDroit = droitSurAgenda(getIdUtilisateur(response), idAgenda);
    if (monDroit === null) {
        return response.status(404).json({ erreur: "Agenda introuvable" });
    }
    if (monDroit !== "proprietaire") {
        return response.status(403).json({ erreur: "Droit insuffisant" });
    }
    if (!DROITS.includes(droit)) {
        return response.status(400).json({ erreur: "Droit invalide (lecture ou ecriture)" });
    }
    if (typeof email !== "string" || email.trim() === "") {
        return response.status(400).json({ erreur: "Email manquant" });
    }

    const destinataire = database.prepare(
        "SELECT id_utilisateur FROM utilisateur WHERE email = ?"
    ).get(email.trim());
    if (destinataire === undefined) {
        return response.status(404).json({ erreur: "Utilisateur introuvable" });
    }
    if (destinataire.id_utilisateur === getIdUtilisateur(response)) {
        return response.status(400).json({ erreur: "On ne peut pas partager un agenda avec soi-même" });
    }

    // Already shared with this user: update the right instead of making a duplicate
    const dejaPartage = database.prepare(
        "SELECT droit FROM partage WHERE id_agenda = ? AND id_utilisateur = ?"
    ).get(idAgenda, destinataire.id_utilisateur);
    if (dejaPartage !== undefined) {
        database.prepare(
            "UPDATE partage SET droit = ? WHERE id_agenda = ? AND id_utilisateur = ?"
        ).run(droit, idAgenda, destinataire.id_utilisateur);
        return response.status(200).json(lirePartage(idAgenda, destinataire.id_utilisateur));
    }
    database.prepare(
        "INSERT INTO partage (id_agenda, id_utilisateur, droit) VALUES (?, ?, ?)"
    ).run(idAgenda, destinataire.id_utilisateur, droit);
    response.status(201).json(lirePartage(idAgenda, destinataire.id_utilisateur));
});

// List the shares of an agenda. Only the owner can see them.
router.get("/agendas/:idAgenda/partages", function (request, response) {
    const idAgenda = request.params.idAgenda;
    const monDroit = droitSurAgenda(getIdUtilisateur(response), idAgenda);
    if (monDroit === null) {
        return response.status(404).json({ erreur: "Agenda introuvable" });
    }
    if (monDroit !== "proprietaire") {
        return response.status(403).json({ erreur: "Droit insuffisant" });
    }
    const rows = database.prepare(
        "SELECT p.id_agenda, u.id_utilisateur, u.nom, u.email, p.droit " +
        "FROM partage p JOIN utilisateur u ON u.id_utilisateur = p.id_utilisateur " +
        "WHERE p.id_agenda = ? ORDER BY u.nom"
    ).all(idAgenda);
    response.json(rows.map(toJson));
});

// Remove a share. The owner can remove anyone; a user can remove their own access.
router.delete("/agendas/:idAgenda/partages/:idUtilisateur", function (request, response) {
    const idAgenda = request.params.idAgenda;
    const idCible = Number(request.params.idUtilisateur);
    const moi = getIdUtilisateur(response);

    const monDroit = droitSurAgenda(moi, idAgenda);
    const estProprietaire = monDroit === "proprietaire";
    // Allowed only if I own the agenda, or if I am removing my own share
    if (!estProprietaire && idCible !== moi) {
        if (monDroit === null) {
            return response.status(404).json({ erreur: "Agenda introuvable" });
        }
        return response.status(403).json({ erreur: "Droit insuffisant" });
    }
    const result = database.prepare(
        "DELETE FROM partage WHERE id_agenda = ? AND id_utilisateur = ?"
    ).run(idAgenda, idCible);
    if (result.changes === 0) {
        return response.status(404).json({ erreur: "Partage introuvable" });
    }
    response.status(204).end();
});

// Reads back a share with the user's name and email, to send it to the client
function lirePartage(idAgenda, idUtilisateur) {
    const row = database.prepare(
        "SELECT p.id_agenda, u.id_utilisateur, u.nom, u.email, p.droit " +
        "FROM partage p JOIN utilisateur u ON u.id_utilisateur = p.id_utilisateur " +
        "WHERE p.id_agenda = ? AND p.id_utilisateur = ?"
    ).get(idAgenda, idUtilisateur);
    return toJson(row);
}

export default router;
