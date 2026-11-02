import express from "express";
import { requireLogin, redirectIfLogin } from "../middlewares/auth.js";
import database from "../database.js";

const router = express.Router();

// Web pages (rendered with EJS)
router.get("/", requireLogin, function (request, response) {
    response.render("index");
});
router.get("/login", redirectIfLogin, function (request, response) {
    response.render("login");
});
router.get("/register", redirectIfLogin, function (request, response) {
    response.render("register");
});
// Page profil
router.get("/profil", requireLogin, function (request, response) {

    try {
        // Récupérer l'identifiant de l'utilisateur connecté
        const idUtilisateur = response.locals.user.id;

        // Récupérer son nom et son email dans la base SQLite
        const utilisateur = database.prepare(`
            SELECT nom, email
            FROM utilisateur
            WHERE id_utilisateur = ?
        `).get(idUtilisateur);

        // Vérifier que l'utilisateur existe
        if (!utilisateur) {
            return response.status(404).send("Utilisateur introuvable");
        }

        // Afficher la page profil avec les données récupérées
        response.render("profil", {
            utilisateur: utilisateur
        });

    } catch (error) {
        console.error("Erreur lors de la récupération du profil :", error);
        response.status(500).send("Une erreur est survenue.");
    }
});

export default router;
