// Tests de l'inscription, de la connexion, de la déconnexion et de l'accès aux pages
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { demarrerServeur, requete, lireCookie, creerUtilisateur } from "./helpers.js";

// Une copie de l'app, démarrée pour ce fichier sur un port libre
const { url, arreter } = await demarrerServeur();

after(function () {
    arreter();
});

describe("POST /register", function () {
    test("inscrit l'utilisateur et le connecte", async function () {
        const response = await requete(url, "/register", {
            method: "POST",
            body: { userName: "Alice", email: "alice@test.fr", password: "secret", confirmPassword: "secret" }
        });

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { path: "/" });
        // Le cookie de connexion est posé dès l'inscription
        assert.ok(lireCookie(response));
    });

    test("refuse s'il manque un champ (400)", async function () {
        const response = await requete(url, "/register", {
            method: "POST",
            body: { userName: "Bob", email: "bob@test.fr", password: "secret" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Champs manquants" });
    });

    test("refuse si les deux mots de passe sont différents (400)", async function () {
        const response = await requete(url, "/register", {
            method: "POST",
            body: { userName: "Bob", email: "bob@test.fr", password: "secret", confirmPassword: "autre" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Mot de passe différents" });
    });

    test("refuse un email déjà utilisé (400)", async function () {
        const compte = { userName: "Claire", email: "claire@test.fr", password: "secret", confirmPassword: "secret" };
        await requete(url, "/register", { method: "POST", body: compte });

        const response = await requete(url, "/register", { method: "POST", body: compte });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Email déjà pris" });
    });
});

describe("POST /login", function () {
    // Un compte existant pour les tests de connexion
    before(async function () {
        await requete(url, "/register", {
            method: "POST",
            body: { userName: "David", email: "david@test.fr", password: "secret", confirmPassword: "secret" }
        });
    });

    test("connecte avec le bon email et le bon mot de passe", async function () {
        const response = await requete(url, "/login", {
            method: "POST",
            body: { email: "david@test.fr", password: "secret" }
        });

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { path: "/" });
        assert.ok(lireCookie(response));
    });

    test("refuse un mauvais mot de passe (401)", async function () {
        const response = await requete(url, "/login", {
            method: "POST",
            body: { email: "david@test.fr", password: "faux" }
        });

        assert.equal(response.status, 401);
        assert.deepEqual(await response.json(), { erreur: "Identifiants incorrects" });
        assert.equal(lireCookie(response), undefined);
    });

    test("refuse s'il manque un champ (400)", async function () {
        const response = await requete(url, "/login", { method: "POST", body: { email: "david@test.fr" } });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Champs manquants" });
    });

    test("refuse une requête sans JSON (400)", async function () {
        const response = await requete(url, "/login", { method: "POST" });

        assert.equal(response.status, 400);
    });
});

describe("POST /logout", function () {
    test("redirige vers la page de connexion", async function () {
        const cookie = await creerUtilisateur(url);

        const response = await requete(url, "/logout", { method: "POST", cookie: cookie });

        assert.equal(response.status, 302);
        assert.equal(response.headers.get("location"), "/login");
    });
});

describe("Accès aux pages", function () {
    test("un visiteur qui ouvre / est renvoyé vers /login", async function () {
        const response = await requete(url, "/");

        assert.equal(response.status, 302);
        assert.equal(response.headers.get("location"), "/login");
    });

    test("un utilisateur connecté voit le calendrier sur /", async function () {
        const cookie = await creerUtilisateur(url);

        const response = await requete(url, "/", { cookie: cookie });

        assert.equal(response.status, 200);
    });

    test("un utilisateur connecté qui ouvre /login est renvoyé vers /", async function () {
        const cookie = await creerUtilisateur(url);

        const response = await requete(url, "/login", { cookie: cookie });

        assert.equal(response.status, 302);
        assert.equal(response.headers.get("location"), "/");
    });

    test("un visiteur peut ouvrir /login et /register", async function () {
        assert.equal((await requete(url, "/login")).status, 200);
        assert.equal((await requete(url, "/register")).status, 200);
    });

    test("un faux jeton ne connecte pas", async function () {
        const response = await requete(url, "/", { cookie: "accessToken=faux-jeton" });

        assert.equal(response.status, 302);
        assert.equal(response.headers.get("location"), "/login");
    });

    test("l'API répond 401 à un visiteur", async function () {
        const response = await requete(url, "/api/agendas");

        assert.equal(response.status, 401);
        assert.deepEqual(await response.json(), { erreur: "Non connecté" });
    });
});
