// Tests de la recherche d'activités (#94) : mots-clés, filtres et droits d'accès
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { demarrerServeur, requete, creerUtilisateur, creerAgenda, lireCookie } from "./helpers.js";

const { url, arreter } = await demarrerServeur();

after(function () {
    arreter();
});

// Inscrit un utilisateur avec un email connu (nécessaire pour le partager) : renvoie cookie + email
let numero = 0;
async function creerUtilisateurAvecEmail(nom) {
    numero++;
    const email = "recherche" + numero + "@test.fr";
    const response = await requete(url, "/register", {
        method: "POST",
        body: { userName: nom, email: email, password: "motdepasse1", confirmPassword: "motdepasse1" }
    });
    if (response.status !== 200) {
        throw new Error("Inscription impossible : " + response.status);
    }
    return { cookie: lireCookie(response), email: email };
}

// Crée une activité dans l'agenda et renvoie son JSON
async function creerActivite(cookie, idAgenda, activite) {
    const response = await requete(url, "/api/agendas/" + idAgenda + "/activites", {
        method: "POST", cookie: cookie, body: activite
    });
    if (response.status !== 201) {
        throw new Error("Création d'activité impossible : " + response.status);
    }
    return response.json();
}

// Lance une recherche et renvoie les activités trouvées
async function rechercher(cookie, query) {
    const response = await requete(url, "/api/activites/recherche" + query, { cookie: cookie });
    return response.json();
}

describe("GET /api/activites/recherche", function () {
    let cookie;
    let agenda;

    before(async function () {
        cookie = await creerUtilisateur(url);
        agenda = await creerAgenda(url, cookie, "Perso");
        await creerActivite(cookie, agenda.idAgenda, {
            titre: "Réunion projet", lieu: "Salle B", description: "point hebdo",
            debut: "2026-10-15T08:00:00Z", fin: "2026-10-15T10:00:00Z"
        });
        await creerActivite(cookie, agenda.idAgenda, {
            titre: "Sport", lieu: "Gymnase", description: "footing",
            debut: "2026-10-20T18:00:00Z", fin: "2026-10-20T19:00:00Z"
        });
    });

    test("trouve par mot-clé dans le titre", async function () {
        const activites = await rechercher(cookie, "?q=réunion");
        assert.equal(activites.length, 1);
        assert.equal(activites[0].titre, "Réunion projet");
    });

    test("cherche aussi dans le lieu et la description", async function () {
        assert.equal((await rechercher(cookie, "?q=gymnase")).length, 1);
        assert.equal((await rechercher(cookie, "?q=hebdo")).length, 1);
    });

    test("sans mot-clé, renvoie toutes les activités accessibles", async function () {
        assert.equal((await rechercher(cookie, "")).length, 2);
    });

    test("filtre sur la période", async function () {
        const activites = await rechercher(cookie, "?start=2026-10-14T00:00:00Z&end=2026-10-16T00:00:00Z");
        assert.equal(activites.length, 1);
        assert.equal(activites[0].titre, "Réunion projet");
    });

    test("filtre sur un agenda précis", async function () {
        assert.equal((await rechercher(cookie, "?idAgenda=" + agenda.idAgenda)).length, 2);
    });

    test("période invalide : 400", async function () {
        const response = await requete(url, "/api/activites/recherche?start=pasunedate", { cookie: cookie });
        assert.equal(response.status, 400);
    });

    test("401 sans être connecté", async function () {
        const response = await requete(url, "/api/activites/recherche");
        assert.equal(response.status, 401);
    });
});

describe("Recherche et droits d'accès", function () {
    test("ne renvoie pas les activités d'un agenda d'un autre utilisateur", async function () {
        const alice = await creerUtilisateurAvecEmail("Alice");
        const bob = await creerUtilisateurAvecEmail("Bob");
        const agendaAlice = await creerAgenda(url, alice.cookie, "Privé Alice");
        await creerActivite(alice.cookie, agendaAlice.idAgenda, {
            titre: "Secret", debut: "2026-11-01T08:00:00Z", fin: "2026-11-01T09:00:00Z"
        });

        assert.equal((await rechercher(bob.cookie, "?q=secret")).length, 0);
    });

    test("renvoie les activités d'un agenda partagé", async function () {
        const alice = await creerUtilisateurAvecEmail("Alice");
        const bob = await creerUtilisateurAvecEmail("Bob");
        const agendaAlice = await creerAgenda(url, alice.cookie, "Partagé");
        await creerActivite(alice.cookie, agendaAlice.idAgenda, {
            titre: "Partagé", debut: "2026-11-02T08:00:00Z", fin: "2026-11-02T09:00:00Z"
        });

        // Alice partage son agenda avec Bob
        await requete(url, "/api/agendas/" + agendaAlice.idAgenda + "/partages", {
            method: "POST", cookie: alice.cookie, body: { email: bob.email, droit: "lecture" }
        });

        const activites = await rechercher(bob.cookie, "?q=partagé");
        assert.equal(activites.length, 1);
        assert.equal(activites[0].titre, "Partagé");
    });
});
