import express from "express";
import database from "../database.js";
import bcrypt from "bcrypt";

const router = express.Router();

// True when the client sent a non-empty text for this field
function isFilled(value) {
    return typeof value === "string" && value.trim() !== "";
}

// Id de l'utilisateur connecté, lu dans le token par le middleware auth
function getIdUtilisateur(response) {
    return response.locals.user.id;
}

// Change le mot de passe de l'utilisateur connecté (sans demander l'ancien, choix assumé)
router.put("/mot-de-passe", function (request, response) {
    const { password, confirmPassword } = request.body ?? {};
    if (!isFilled(password) || !isFilled(confirmPassword)) {
        return response.status(400).json({ erreur: "Champs manquants" });
    }
    if (password !== confirmPassword) {
        return response.status(400).json({ erreur: "Mot de passe différents" });
    }
    const passwordHash = bcrypt.hashSync(password, 10);
    database.prepare(
        "UPDATE utilisateur SET mot_de_passe_hash = ? WHERE id_utilisateur = ?"
    ).run(passwordHash, getIdUtilisateur(response));
    return response.status(200).json({ message: "Mot de passe modifié" });
});

export default router;
