import express from "express";
import database from "../database.js";

const router = express.Router();

// Format #RRGGBB, comme dans conception.md (c'est aussi ce que donne <input type="color">)
const COULEUR_VALIDE = /^#[0-9a-fA-F]{6}$/;

// Id de l'utilisateur connecté, lu dans le token par le middleware auth de app.js
function getIdUtilisateur(response) {
    return response.locals.user.id;
}

// Une ligne de la table -> le JSON décrit dans conception.md
function toJson(row) {
    return {
        idAgenda: row.id_agenda,
        nom: row.nom,
        couleur: row.couleur,
        description: row.description
    };
}

// Liste des agendas de l'utilisateur connecté
router.get("/agendas", function (request, response) {
    const rows = database.prepare(
        "SELECT * FROM agenda WHERE id_utilisateur = ? ORDER BY nom"
    ).all(getIdUtilisateur(response));
    response.json(rows.map(toJson));
});

// Créer un agenda pour l'utilisateur connecté
router.post("/agendas", function (request, response) {
    const { nom, couleur, description } = request.body ?? {};
    if (typeof nom !== "string" || nom.trim() === "") {
        return response.status(400).json({ erreur: "Le nom est obligatoire" });
    }
    if (typeof couleur !== "string" || !COULEUR_VALIDE.test(couleur)) {
        return response.status(400).json({ erreur: "Couleur invalide (format #RRGGBB)" });
    }
    const result = database.prepare(
        "INSERT INTO agenda (nom, couleur, description, id_utilisateur) VALUES (?, ?, ?, ?)"
    ).run(nom.trim(), couleur, description ?? null, getIdUtilisateur(response));
    const row = database.prepare("SELECT * FROM agenda WHERE id_agenda = ?").get(result.lastInsertRowid);
    response.status(201).json(toJson(row));
});

export default router;