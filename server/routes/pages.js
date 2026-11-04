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
router.get("/profil", requireLogin, function (request, response) {

    try {
        // getting the id of the use
        const idUtilisateur = response.locals.user.id;

        // getting the name and email of the user
        const utilisateur = database.prepare(`
            SELECT nom, email
            FROM utilisateur
            WHERE id_utilisateur = ?
        `).get(idUtilisateur);

        // check if the user exist
        if (!utilisateur) {
            return response.status(404).send("Utilisateur introuvable");
        }

        // display the page with the infos
        response.render("profil", {
            utilisateur: utilisateur
        });

    } catch (error) {
        console.error("Erreur lors de la récupération du profil :", error);
        response.status(500).send("Une erreur est survenue.");
    }
});

export default router;
