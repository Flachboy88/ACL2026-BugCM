// Tests de la modification / suppression d'une seule occurrence d'une activité récurrente
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { demarrerServeur, requete, creerUtilisateur, creerAgenda, lireCookie } from "./helpers.js";
import database from "../server/database.js";

const { url, arreter } = await demarrerServeur();
let cookieAlice;
let cookieBob;
let agendaAlice;

// Bob a besoin d'un email connu pour qu'Alice lui partage son agenda en lecture
async function inscrireBob() {
    const response = await requete(url, "/register", {
        method: "POST",
        body: { userName: "Bob", email: "bob.occurrences@test.fr", password: "motdepasse1", confirmPassword: "motdepasse1" }
    });
    return lireCookie(response);
}

before(async function () {
    cookieAlice = await creerUtilisateur(url);
    cookieBob = await inscrireBob();
    agendaAlice = await creerAgenda(url, cookieAlice, "Cours");
});

after(function () {
    arreter();
});

// Crée une série hebdomadaire (le lundi 2 novembre, 8h-9h) dans l'agenda d'Alice
async function creerSerie() {
    const response = await requete(url, "/api/agendas/" + agendaAlice.idAgenda + "/activites", {
        method: "POST",
        cookie: cookieAlice,
        body: { titre: "Cours de maths", debut: "2026-11-02T08:00:00Z", fin: "2026-11-02T09:00:00Z", frequence: "hebdomadaire" }
    });
    return response.json();
}

// Activités de l'agenda d'Alice sur le mois de novembre
async function activitesNovembre() {
    const response = await requete(url,
        "/api/agendas/" + agendaAlice.idAgenda + "/activites?start=2026-11-01T00:00:00Z&end=2026-12-01T00:00:00Z",
        { cookie: cookieAlice });
    return response.json();
}

function trouver(activites, idActivite) {
    return activites.find(function (activite) { return activite.idActivite === idActivite; });
}

describe("POST /api/activites/:idActivite/occurrences", function () {
    test("détache une occurrence : exception sur la série + nouvelle activité simple (201)", async function () {
        const serie = await creerSerie();

        const response = await requete(url, "/api/activites/" + serie.idActivite + "/occurrences", {
            method: "POST",
            cookie: cookieAlice,
            body: { date: "2026-11-09", titre: "Cours décalé", debut: "2026-11-09T14:00:00Z", fin: "2026-11-09T15:00:00Z", lieu: "Salle 2" }
        });
        const nouvelle = await response.json();

        assert.equal(response.status, 201);
        assert.notEqual(nouvelle.idActivite, serie.idActivite);
        assert.equal(nouvelle.idAgenda, agendaAlice.idAgenda);
        assert.equal(nouvelle.titre, "Cours décalé");
        assert.equal(nouvelle.debut, "2026-11-09T14:00:00.000Z");
        assert.equal(nouvelle.lieu, "Salle 2");
        assert.equal(nouvelle.frequence, null);

        const activites = await activitesNovembre();
        assert.deepEqual(trouver(activites, serie.idActivite).exceptions, ["2026-11-09"]);
        // La série elle-même ne change pas
        assert.equal(trouver(activites, serie.idActivite).titre, "Cours de maths");
    });

    test("peut détacher une occurrence en journée entière", async function () {
        const serie = await creerSerie();

        const response = await requete(url, "/api/activites/" + serie.idActivite + "/occurrences", {
            method: "POST",
            cookie: cookieAlice,
            body: { date: "2026-11-16", titre: "Sortie", debut: "2026-11-16", fin: "2026-11-17", journeeEntiere: true }
        });
        const nouvelle = await response.json();

        assert.equal(response.status, 201);
        assert.equal(nouvelle.journeeEntiere, true);
        assert.equal(nouvelle.debut, "2026-11-16");
    });

    test("refuse une date d'occurrence invalide (400)", async function () {
        const serie = await creerSerie();

        const response = await requete(url, "/api/activites/" + serie.idActivite + "/occurrences", {
            method: "POST",
            cookie: cookieAlice,
            body: { date: "09/11/2026", titre: "Cours", debut: "2026-11-09T14:00:00Z", fin: "2026-11-09T15:00:00Z" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Date de l'occurrence invalide" });
    });

    test("refuse des champs invalides (400)", async function () {
        const serie = await creerSerie();

        const response = await requete(url, "/api/activites/" + serie.idActivite + "/occurrences", {
            method: "POST",
            cookie: cookieAlice,
            body: { date: "2026-11-09", titre: "Cours", debut: "2026-11-09T15:00:00Z", fin: "2026-11-09T14:00:00Z" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "La fin doit être après le début" });
    });

    test("refuse sur une activité qui n'est pas récurrente (400)", async function () {
        const simple = await (await requete(url, "/api/agendas/" + agendaAlice.idAgenda + "/activites", {
            method: "POST",
            cookie: cookieAlice,
            body: { titre: "Simple", debut: "2026-11-09T08:00:00Z", fin: "2026-11-09T09:00:00Z" }
        })).json();

        const response = await requete(url, "/api/activites/" + simple.idActivite + "/occurrences", {
            method: "POST",
            cookie: cookieAlice,
            body: { date: "2026-11-09", titre: "Cours", debut: "2026-11-09T14:00:00Z", fin: "2026-11-09T15:00:00Z" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "L'activité n'est pas récurrente" });
    });

    test("renvoie 404 pour une activité inconnue", async function () {
        const response = await requete(url, "/api/activites/999999/occurrences", {
            method: "POST",
            cookie: cookieAlice,
            body: { date: "2026-11-09", titre: "Cours", debut: "2026-11-09T14:00:00Z", fin: "2026-11-09T15:00:00Z" }
        });

        assert.equal(response.status, 404);
    });
});

describe("DELETE /api/activites/:idActivite/occurrences/:date", function () {
    test("supprime une seule occurrence (204) : la série reste, avec l'exception", async function () {
        const serie = await creerSerie();

        const response = await requete(url, "/api/activites/" + serie.idActivite + "/occurrences/2026-11-16", {
            method: "DELETE",
            cookie: cookieAlice
        });

        assert.equal(response.status, 204);
        const activites = await activitesNovembre();
        assert.deepEqual(trouver(activites, serie.idActivite).exceptions, ["2026-11-16"]);
    });

    test("supprimer deux fois la même occurrence ne crée pas de doublon", async function () {
        const serie = await creerSerie();

        for (let i = 0; i < 2; i++) {
            await requete(url, "/api/activites/" + serie.idActivite + "/occurrences/2026-11-23", {
                method: "DELETE",
                cookie: cookieAlice
            });
        }

        const activites = await activitesNovembre();
        assert.deepEqual(trouver(activites, serie.idActivite).exceptions, ["2026-11-23"]);
    });

    test("refuse une date invalide (400)", async function () {
        const serie = await creerSerie();

        const response = await requete(url, "/api/activites/" + serie.idActivite + "/occurrences/2026-13-01", {
            method: "DELETE",
            cookie: cookieAlice
        });

        assert.equal(response.status, 400);
    });

    test("une activité sans exception renvoie une liste vide", async function () {
        const serie = await creerSerie();

        const activites = await activitesNovembre();
        assert.deepEqual(trouver(activites, serie.idActivite).exceptions, []);
    });

    test("supprimer la série supprime aussi ses exceptions", async function () {
        const serie = await creerSerie();
        await requete(url, "/api/activites/" + serie.idActivite + "/occurrences/2026-11-30", {
            method: "DELETE",
            cookie: cookieAlice
        });

        await requete(url, "/api/activites/" + serie.idActivite, { method: "DELETE", cookie: cookieAlice });

        const restantes = database.prepare(
            "SELECT * FROM exception_activite WHERE id_activite = ?"
        ).all(serie.idActivite);
        assert.equal(restantes.length, 0);
    });
});

describe("Occurrences et droits d'accès", function () {
    test("un utilisateur sans accès reçoit 404", async function () {
        const serie = await creerSerie();

        const response = await requete(url, "/api/activites/" + serie.idActivite + "/occurrences/2026-11-09", {
            method: "DELETE",
            cookie: cookieBob
        });

        assert.equal(response.status, 404);
    });

    test("un utilisateur en lecture seule reçoit 403, sans rien changer", async function () {
        const agendaPartage = await creerAgenda(url, cookieAlice, "Partagé");
        await requete(url, "/api/agendas/" + agendaPartage.idAgenda + "/partages", {
            method: "POST",
            cookie: cookieAlice,
            body: { email: "bob.occurrences@test.fr", droit: "lecture" }
        });
        const serie = await (await requete(url, "/api/agendas/" + agendaPartage.idAgenda + "/activites", {
            method: "POST",
            cookie: cookieAlice,
            body: { titre: "Série", debut: "2026-11-02T08:00:00Z", fin: "2026-11-02T09:00:00Z", frequence: "hebdomadaire" }
        })).json();

        let response = await requete(url, "/api/activites/" + serie.idActivite + "/occurrences/2026-11-09", {
            method: "DELETE",
            cookie: cookieBob
        });
        assert.equal(response.status, 403);

        response = await requete(url, "/api/activites/" + serie.idActivite + "/occurrences", {
            method: "POST",
            cookie: cookieBob,
            body: { date: "2026-11-09", titre: "Cours", debut: "2026-11-09T14:00:00Z", fin: "2026-11-09T15:00:00Z" }
        });
        assert.equal(response.status, 403);

        const exceptions = database.prepare(
            "SELECT * FROM exception_activite WHERE id_activite = ?"
        ).all(serie.idActivite);
        assert.equal(exceptions.length, 0);
    });
});
