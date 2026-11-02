// Tests du changement de mot de passe (route protégée PUT /api/mot-de-passe)
import { describe, test, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import database from "../server/database.js";
import { demarrerServeur, requete, lireCookie, creerUtilisateur } from "./helpers.js";

// Serveur de test pour ce fichier, sur un port libre
const { url, arreter } = await demarrerServeur();

after(function () {
    arreter();
});

describe("PUT /api/mot-de-passe", function () {
    test("change le mot de passe et stocke un nouveau hash", async function () {
        const cookie = await creerUtilisateur(url);

        const response = await requete(url, "/api/mot-de-passe", {
            method: "PUT",
            cookie: cookie,
            body: { password: "nouveau", confirmPassword: "nouveau" }
        });

        assert.equal(response.status, 200);

        // Le nouveau mot de passe est bien celui enregistré en base, et toujours haché
        const { mot_de_passe_hash } = database
            .prepare("SELECT mot_de_passe_hash FROM utilisateur WHERE id_utilisateur = ?")
            .get(1);
        assert.ok(bcrypt.compareSync("nouveau", mot_de_passe_hash));
    });

    test("refuse s'il manque un champ (400)", async function () {
        const cookie = await creerUtilisateur(url);

        const response = await requete(url, "/api/mot-de-passe", {
            method: "PUT",
            cookie: cookie,
            body: { password: "nouveau" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Champs manquants" });
    });

    test("refuse si les deux mots de passe sont différents (400)", async function () {
        const cookie = await creerUtilisateur(url);

        const response = await requete(url, "/api/mot-de-passe", {
            method: "PUT",
            cookie: cookie,
            body: { password: "nouveau", confirmPassword: "autre" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Mot de passe différents" });
    });

    test("refuse un visiteur non connecté (401)", async function () {
        const response = await requete(url, "/api/mot-de-passe", {
            method: "PUT",
            body: { password: "nouveau", confirmPassword: "nouveau" }
        });

        assert.equal(response.status, 401);
    });
});
