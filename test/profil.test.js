// Tests du changement de mot de passe (route protégée PUT /api/mot-de-passe)
import { describe, test, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import database from "../server/database.js";
import { demarrerServeur, requete, lireCookie, creerUtilisateur } from "./helpers.js";

// Serveur de test pour ce fichier, sur un port libre
const { url, arreter } = await demarrerServeur();
const MDP_INITIAL = "motdepasse1";
after(function () {
    arreter();
});

describe("PUT /api/mot-de-passe", function () {
    test("change le mot de passe et stocke un nouveau hash", async function () {
        const cookie = await creerUtilisateur(url);

        const response = await requete(url, "/api/mot-de-passe", {
            method: "PUT",
            cookie: cookie,
            body: { oldPwd: MDP_INITIAL, password: "nouveau1", confirmPassword: "nouveau1" }
        });

        assert.equal(response.status, 200);

        // Le nouveau mot de passe est bien celui enregistré en base, et toujours haché
        const { mot_de_passe_hash } = database
            .prepare("SELECT mot_de_passe_hash FROM utilisateur WHERE id_utilisateur = ?")
            .get(1);
        assert.ok(bcrypt.compareSync("nouveau1", mot_de_passe_hash));
    });

    test("refuse s'il manque un champ (400)", async function () {
        const cookie = await creerUtilisateur(url);

        const response = await requete(url, "/api/mot-de-passe", {
            method: "PUT",
            cookie: cookie,
            body: { oldPwd: MDP_INITIAL, password: "nouveau1" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Champs manquants" });
    });

 test("refuse s'il manque l'ancien mot de passe (400)", async function () {
        const cookie = await creerUtilisateur(url);

        const response = await requete(url, "/api/mot-de-passe", {
            method: "PUT",
            cookie: cookie,
            body: { password: "nouveau1", confirmPassword: "nouveau1" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Champs manquants" });
    });

    test("refuse si les deux mots de passe sont différents (400)", async function () {
        const cookie = await creerUtilisateur(url);

        const response = await requete(url, "/api/mot-de-passe", {
            method: "PUT",
            cookie: cookie,
            body: { oldPwd: MDP_INITIAL, password: "nouveau1", confirmPassword: "autre01" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Mot de passe différents" });
    });

    test("refuse un ancien mot de passe incorrect (401) sans modifier le hash", async function () {
        const cookie = await creerUtilisateur(url);
        const avant = database
            .prepare("SELECT mot_de_passe_hash FROM utilisateur WHERE id_utilisateur = ?")
            .get(1);

        const response = await requete(url, "/api/mot-de-passe", {
            method: "PUT",
            cookie: cookie,
            body: { oldPwd: "mauvais", password: "nouveau1", confirmPassword: "nouveau1" }
        });

        assert.equal(response.status, 401);
        assert.deepEqual(await response.json(), { erreur: "Ancien mot de passe incorrect" });

        const apres = database
            .prepare("SELECT mot_de_passe_hash FROM utilisateur WHERE id_utilisateur = ?")
            .get(1);
        assert.equal(apres.mot_de_passe_hash, avant.mot_de_passe_hash);
    });

    test("refuse un visiteur non connecté (401)", async function () {
        const response = await requete(url, "/api/mot-de-passe", {
            method: "PUT",
            body: { password: "nouveau1", confirmPassword: "nouveau1" }
        });

        assert.equal(response.status, 401);
    });
});
