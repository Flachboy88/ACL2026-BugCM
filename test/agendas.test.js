// Tests des routes des agendas : GET et POST /api/agendas
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { demarrerServeur, requete, creerUtilisateur, creerAgenda } from "./helpers.js";

// Serveur de test pour ce fichier, sur un port libre
const { url, arreter } = await demarrerServeur();

after(function () {
    arreter();
});

describe("GET /api/agendas", function () {
    test("renvoie une liste vide pour un nouvel utilisateur", async function () {
        // Échouera avec l'issue #62 (« Mon agenda » créé à l'inscription) : il faudra attendre ["Mon agenda"]
        const cookie = await creerUtilisateur(url);

        const response = await requete(url, "/api/agendas", { cookie: cookie });

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), []);
    });

    test("renvoie les agendas de l'utilisateur, triés par nom", async function () {
        const cookie = await creerUtilisateur(url);
        await creerAgenda(url, cookie, "Sport");
        await creerAgenda(url, cookie, "Cours");

        const response = await requete(url, "/api/agendas", { cookie: cookie });
        const agendas = await response.json();

        assert.equal(response.status, 200);
        assert.deepEqual(agendas.map(function (agenda) { return agenda.nom; }), ["Cours", "Sport"]);
    });

    test("ne renvoie pas les agendas d'un autre utilisateur", async function () {
        const cookieAlice = await creerUtilisateur(url);
        const cookieBob = await creerUtilisateur(url);
        await creerAgenda(url, cookieAlice, "Agenda d'Alice");

        const response = await requete(url, "/api/agendas", { cookie: cookieBob });

        assert.deepEqual(await response.json(), []);
    });

    test("répond 401 sans être connecté", async function () {
        const response = await requete(url, "/api/agendas");

        assert.equal(response.status, 401);
    });
});

describe("POST /api/agendas", function () {
    let cookie;

    before(async function () {
        cookie = await creerUtilisateur(url);
    });

    test("crée l'agenda et le renvoie (201)", async function () {
        const response = await requete(url, "/api/agendas", {
            method: "POST",
            cookie: cookie,
            body: { nom: "  Travail  ", couleur: "#ff0000", description: "Réunions" }
        });
        const agenda = await response.json();

        assert.equal(response.status, 201);
        assert.equal(typeof agenda.idAgenda, "number");
        // Les espaces autour du nom sont retirés
        assert.equal(agenda.nom, "Travail");
        assert.equal(agenda.couleur, "#ff0000");
        assert.equal(agenda.description, "Réunions");
    });

    test("accepte un agenda sans description (null)", async function () {
        const response = await requete(url, "/api/agendas", {
            method: "POST",
            cookie: cookie,
            body: { nom: "Loisirs", couleur: "#00ff00" }
        });

        assert.equal(response.status, 201);
        assert.equal((await response.json()).description, null);
    });

    test("refuse un nom vide (400)", async function () {
        const response = await requete(url, "/api/agendas", {
            method: "POST",
            cookie: cookie,
            body: { nom: "   ", couleur: "#ff0000" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Le nom est obligatoire" });
    });

    test("refuse une couleur qui n'est pas au format #RRGGBB (400)", async function () {
        const response = await requete(url, "/api/agendas", {
            method: "POST",
            cookie: cookie,
            body: { nom: "Travail", couleur: "rouge" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Couleur invalide (format #RRGGBB)" });
    });

    test("répond 401 sans être connecté", async function () {
        const response = await requete(url, "/api/agendas", {
            method: "POST",
            body: { nom: "Travail", couleur: "#ff0000" }
        });

        assert.equal(response.status, 401);
    });
});
