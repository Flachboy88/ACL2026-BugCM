// Tests des routes des activités (rendez-vous) : lister, créer, modifier, supprimer
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { demarrerServeur, requete, creerUtilisateur, creerAgenda } from "./helpers.js";

// Une copie de l'app, démarrée pour ce fichier sur un port libre
const { url, arreter } = await demarrerServeur();
// Alice a un agenda ; Bob sert à vérifier qu'on ne touche pas aux données des autres
let cookieAlice;
let cookieBob;
let agendaAlice;

before(async function () {
    cookieAlice = await creerUtilisateur(url);
    cookieBob = await creerUtilisateur(url);
    agendaAlice = await creerAgenda(url, cookieAlice);
});

after(function () {
    arreter();
});

// Crée une activité dans l'agenda d'Alice et renvoie l'activité créée
async function creerActivite(champs) {
    const response = await requete(url, "/api/agendas/" + agendaAlice.idAgenda + "/activites", {
        method: "POST",
        cookie: cookieAlice,
        body: { titre: "Cours de maths", debut: "2026-10-15T08:00:00Z", fin: "2026-10-15T10:00:00Z", ...champs }
    });
    return response.json();
}

describe("POST /api/agendas/:idAgenda/activites", function () {
    test("crée l'activité et la renvoie (201)", async function () {
        const response = await requete(url, "/api/agendas/" + agendaAlice.idAgenda + "/activites", {
            method: "POST",
            cookie: cookieAlice,
            body: { titre: "Réunion", debut: "2026-10-15T14:00:00+02:00", fin: "2026-10-15T15:00:00+02:00", lieu: "Salle 1" }
        });
        const activite = await response.json();

        assert.equal(response.status, 201);
        assert.equal(typeof activite.idActivite, "number");
        assert.equal(activite.idAgenda, agendaAlice.idAgenda);
        assert.equal(activite.titre, "Réunion");
        // Les dates sont enregistrées en UTC : 14h à Paris (+02:00) = 12h UTC
        assert.equal(activite.debut, "2026-10-15T12:00:00.000Z");
        assert.equal(activite.fin, "2026-10-15T13:00:00.000Z");
        assert.equal(activite.lieu, "Salle 1");
        assert.equal(activite.description, null);
    });

    test("refuse s'il manque le titre (400)", async function () {
        const response = await requete(url, "/api/agendas/" + agendaAlice.idAgenda + "/activites", {
            method: "POST",
            cookie: cookieAlice,
            body: { debut: "2026-10-15T08:00:00Z", fin: "2026-10-15T10:00:00Z" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Champs manquants" });
    });

    test("refuse une date invalide (400)", async function () {
        const response = await requete(url, "/api/agendas/" + agendaAlice.idAgenda + "/activites", {
            method: "POST",
            cookie: cookieAlice,
            body: { titre: "Cours", debut: "pas une date", fin: "2026-10-15T10:00:00Z" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Champs manquants" });
    });

    test("refuse une fin avant le début (400)", async function () {
        const response = await requete(url, "/api/agendas/" + agendaAlice.idAgenda + "/activites", {
            method: "POST",
            cookie: cookieAlice,
            body: { titre: "Cours", debut: "2026-10-15T10:00:00Z", fin: "2026-10-15T08:00:00Z" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "La fin doit être après le début" });
    });

    test("répond 404 dans l'agenda d'un autre utilisateur", async function () {
        const response = await requete(url, "/api/agendas/" + agendaAlice.idAgenda + "/activites", {
            method: "POST",
            cookie: cookieBob,
            body: { titre: "Intrus", debut: "2026-10-15T08:00:00Z", fin: "2026-10-15T10:00:00Z" }
        });

        assert.equal(response.status, 404);
        assert.deepEqual(await response.json(), { erreur: "Agenda introuvable" });
    });

    test("répond 401 sans être connecté", async function () {
        const response = await requete(url, "/api/agendas/" + agendaAlice.idAgenda + "/activites", {
            method: "POST",
            body: { titre: "Cours", debut: "2026-10-15T08:00:00Z", fin: "2026-10-15T10:00:00Z" }
        });

        assert.equal(response.status, 401);
    });
});

describe("GET /api/agendas/:idAgenda/activites", function () {
    let agenda;

    // Un agenda à part, pour savoir exactement quelles activités il contient
    before(async function () {
        agenda = await creerAgenda(url, cookieAlice, "Semaine");
        for (const [titre, debut, fin] of [
            ["Lundi", "2026-11-02T08:00:00Z", "2026-11-02T09:00:00Z"],
            ["Mercredi", "2026-11-04T08:00:00Z", "2026-11-04T09:00:00Z"],
            ["Semaine suivante", "2026-11-10T08:00:00Z", "2026-11-10T09:00:00Z"]
        ]) {
            await requete(url, "/api/agendas/" + agenda.idAgenda + "/activites", {
                method: "POST",
                cookie: cookieAlice,
                body: { titre: titre, debut: debut, fin: fin }
            });
        }
    });

    test("renvoie seulement les activités de la période demandée", async function () {
        const response = await requete(url,
            "/api/agendas/" + agenda.idAgenda + "/activites?start=2026-11-02T00:00:00Z&end=2026-11-09T00:00:00Z",
            { cookie: cookieAlice });
        const activites = await response.json();

        assert.equal(response.status, 200);
        assert.deepEqual(activites.map(function (activite) { return activite.titre; }).sort(), ["Lundi", "Mercredi"]);
    });

    test("renvoie une activité qui déborde sur le début de la période", async function () {
        // Lundi 8h-9h : la période commence à 8h30, l'activité est en partie dedans
        const response = await requete(url,
            "/api/agendas/" + agenda.idAgenda + "/activites?start=2026-11-02T08:30:00Z&end=2026-11-02T12:00:00Z",
            { cookie: cookieAlice });

        assert.deepEqual((await response.json()).map(function (activite) { return activite.titre; }), ["Lundi"]);
    });

    test("refuse une période absente ou invalide (400)", async function () {
        const response = await requete(url, "/api/agendas/" + agenda.idAgenda + "/activites", { cookie: cookieAlice });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Période invalide" });
    });

    test("répond 404 pour l'agenda d'un autre utilisateur", async function () {
        const response = await requete(url,
            "/api/agendas/" + agenda.idAgenda + "/activites?start=2026-11-02T00:00:00Z&end=2026-11-09T00:00:00Z",
            { cookie: cookieBob });

        assert.equal(response.status, 404);
        assert.deepEqual(await response.json(), { erreur: "Agenda introuvable" });
    });
});

describe("PUT /api/activites/:idActivite", function () {
    test("modifie l'activité et la renvoie", async function () {
        const activite = await creerActivite();

        const response = await requete(url, "/api/activites/" + activite.idActivite, {
            method: "PUT",
            cookie: cookieAlice,
            body: { titre: "Cours déplacé", debut: "2026-10-16T08:00:00Z", fin: "2026-10-16T11:00:00Z", description: "Salle B" }
        });
        const modifiee = await response.json();

        assert.equal(response.status, 200);
        assert.equal(modifiee.idActivite, activite.idActivite);
        assert.equal(modifiee.titre, "Cours déplacé");
        assert.equal(modifiee.debut, "2026-10-16T08:00:00.000Z");
        assert.equal(modifiee.fin, "2026-10-16T11:00:00.000Z");
        assert.equal(modifiee.description, "Salle B");
    });

    test("refuse une fin avant le début (400)", async function () {
        const activite = await creerActivite();

        const response = await requete(url, "/api/activites/" + activite.idActivite, {
            method: "PUT",
            cookie: cookieAlice,
            body: { titre: "Cours", debut: "2026-10-16T11:00:00Z", fin: "2026-10-16T08:00:00Z" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "La fin doit être après le début" });
    });

    test("répond 404 pour l'activité d'un autre utilisateur, sans la modifier", async function () {
        const activite = await creerActivite({ titre: "Pas touche" });

        const response = await requete(url, "/api/activites/" + activite.idActivite, {
            method: "PUT",
            cookie: cookieBob,
            body: { titre: "Modifié par Bob", debut: "2026-10-16T08:00:00Z", fin: "2026-10-16T09:00:00Z" }
        });

        assert.equal(response.status, 404);
        assert.deepEqual(await response.json(), { erreur: "Activité introuvable" });
        // Alice retrouve son activité telle quelle
        const liste = await requete(url,
            "/api/agendas/" + agendaAlice.idAgenda + "/activites?start=2026-10-15T00:00:00Z&end=2026-10-16T00:00:00Z",
            { cookie: cookieAlice });
        const titres = (await liste.json()).map(function (a) { return a.titre; });
        assert.ok(titres.includes("Pas touche"));
        assert.ok(!titres.includes("Modifié par Bob"));
    });

    test("répond 404 pour une activité qui n'existe pas", async function () {
        const response = await requete(url, "/api/activites/999999", {
            method: "PUT",
            cookie: cookieAlice,
            body: { titre: "Cours", debut: "2026-10-16T08:00:00Z", fin: "2026-10-16T09:00:00Z" }
        });

        assert.equal(response.status, 404);
    });
});

describe("DELETE /api/activites/:idActivite", function () {
    test("supprime l'activité (204), une deuxième suppression répond 404", async function () {
        const activite = await creerActivite();

        const response = await requete(url, "/api/activites/" + activite.idActivite, {
            method: "DELETE",
            cookie: cookieAlice
        });
        assert.equal(response.status, 204);

        const encore = await requete(url, "/api/activites/" + activite.idActivite, {
            method: "DELETE",
            cookie: cookieAlice
        });
        assert.equal(encore.status, 404);
    });

    test("répond 404 pour l'activité d'un autre utilisateur", async function () {
        const activite = await creerActivite();

        const response = await requete(url, "/api/activites/" + activite.idActivite, {
            method: "DELETE",
            cookie: cookieBob
        });

        assert.equal(response.status, 404);
        assert.deepEqual(await response.json(), { erreur: "Activité introuvable" });
    });

    test("répond 401 sans être connecté", async function () {
        const activite = await creerActivite();

        const response = await requete(url, "/api/activites/" + activite.idActivite, { method: "DELETE" });

        assert.equal(response.status, 401);
    });
});
