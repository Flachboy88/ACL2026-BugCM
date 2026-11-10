// Tests des routes de partage et de leur effet sur les agendas et les activités
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { demarrerServeur, requete, creerAgenda, lireCookie } from "./helpers.js";

const { url, arreter } = await demarrerServeur();

after(function () {
    arreter();
});

// Inscrit un utilisateur avec un email connu (on en a besoin pour partager) et renvoie son cookie + email
let numero = 0;
async function creerUtilisateur(nom) {
    numero++;
    const email = "partage" + numero + "@test.fr";
    const response = await requete(url, "/register", {
        method: "POST",
        body: { userName: nom, email: email, password: "motdepasse", confirmPassword: "motdepasse" }
    });
    if (response.status !== 200) {
        throw new Error("Inscription impossible : " + response.status);
    }
    return { cookie: lireCookie(response), email: email };
}

// Partage l'agenda avec l'email donné et renvoie la réponse
function partager(cookie, idAgenda, email, droit) {
    return requete(url, "/api/agendas/" + idAgenda + "/partages", {
        method: "POST",
        cookie: cookie,
        body: { email: email, droit: droit }
    });
}

// Liste des agendas de l'utilisateur de ce cookie
async function agendasDe(cookie) {
    const response = await requete(url, "/api/agendas", { cookie: cookie });
    return response.json();
}

describe("POST /api/agendas/:idAgenda/partages", function () {
    test("partage l'agenda avec un autre utilisateur (201)", async function () {
        const alice = await creerUtilisateur("Alice");
        const bob = await creerUtilisateur("Bob");
        const agenda = await creerAgenda(url, alice.cookie, "Cours");

        const response = await partager(alice.cookie, agenda.idAgenda, bob.email, "lecture");
        const partage = await response.json();

        assert.equal(response.status, 201);
        assert.equal(partage.idAgenda, agenda.idAgenda);
        assert.equal(partage.email, bob.email);
        assert.equal(partage.droit, "lecture");
    });

    test("l'agenda partagé apparaît chez le destinataire avec son droit", async function () {
        const alice = await creerUtilisateur("Alice");
        const bob = await creerUtilisateur("Bob");
        const agenda = await creerAgenda(url, alice.cookie, "Partagé");

        await partager(alice.cookie, agenda.idAgenda, bob.email, "ecriture");

        const agendasBob = await agendasDe(bob.cookie);
        const recu = agendasBob.find(function (a) { return a.idAgenda === agenda.idAgenda; });
        assert.ok(recu !== undefined, "l'agenda partagé devrait être dans la liste de Bob");
        assert.equal(recu.droit, "ecriture");
    });

    test("le propriétaire voit ses propres agendas avec le droit 'proprietaire'", async function () {
        const alice = await creerUtilisateur("Alice");
        const agenda = await creerAgenda(url, alice.cookie, "À moi");

        const agendas = await agendasDe(alice.cookie);
        const recu = agendas.find(function (a) { return a.idAgenda === agenda.idAgenda; });
        assert.equal(recu.droit, "proprietaire");
    });

    test("repartager avec un droit différent met à jour (200), sans doublon", async function () {
        const alice = await creerUtilisateur("Alice");
        const bob = await creerUtilisateur("Bob");
        const agenda = await creerAgenda(url, alice.cookie, "Cours");

        await partager(alice.cookie, agenda.idAgenda, bob.email, "lecture");
        const response = await partager(alice.cookie, agenda.idAgenda, bob.email, "ecriture");
        const partage = await response.json();

        assert.equal(response.status, 200);
        assert.equal(partage.droit, "ecriture");

        // Un seul partage dans la liste
        const liste = await requete(url, "/api/agendas/" + agenda.idAgenda + "/partages", { cookie: alice.cookie });
        assert.equal((await liste.json()).length, 1);
    });

    test("refuse un email inconnu (404)", async function () {
        const alice = await creerUtilisateur("Alice");
        const agenda = await creerAgenda(url, alice.cookie, "Cours");

        const response = await partager(alice.cookie, agenda.idAgenda, "personne@test.fr", "lecture");

        assert.equal(response.status, 404);
        assert.deepEqual(await response.json(), { erreur: "Utilisateur introuvable" });
    });

    test("refuse de partager avec soi-même (400)", async function () {
        const alice = await creerUtilisateur("Alice");
        const agenda = await creerAgenda(url, alice.cookie, "Cours");

        const response = await partager(alice.cookie, agenda.idAgenda, alice.email, "lecture");

        assert.equal(response.status, 400);
    });

    test("refuse un droit invalide (400)", async function () {
        const alice = await creerUtilisateur("Alice");
        const bob = await creerUtilisateur("Bob");
        const agenda = await creerAgenda(url, alice.cookie, "Cours");

        const response = await partager(alice.cookie, agenda.idAgenda, bob.email, "admin");

        assert.equal(response.status, 400);
    });

    test("répond 404 si ce n'est pas le propriétaire", async function () {
        const alice = await creerUtilisateur("Alice");
        const bob = await creerUtilisateur("Bob");
        const carol = await creerUtilisateur("Carol");
        const agenda = await creerAgenda(url, alice.cookie, "Cours");

        // Bob n'est pas propriétaire : il ne peut pas partager l'agenda d'Alice
        const response = await partager(bob.cookie, agenda.idAgenda, carol.email, "lecture");

        assert.equal(response.status, 404);
    });

    test("répond 403 pour un destinataire (qui a accès mais n'est pas propriétaire)", async function () {
        const alice = await creerUtilisateur("Alice");
        const bob = await creerUtilisateur("Bob");
        const carol = await creerUtilisateur("Carol");
        const agenda = await creerAgenda(url, alice.cookie, "Cours");
        await partager(alice.cookie, agenda.idAgenda, bob.email, "ecriture");

        // Bob a un accès en écriture mais n'est pas propriétaire : il ne gère pas les partages
        const response = await partager(bob.cookie, agenda.idAgenda, carol.email, "lecture");

        assert.equal(response.status, 403);
        assert.deepEqual(await response.json(), { erreur: "Droit insuffisant" });
    });

    test("répond 401 sans être connecté", async function () {
        const response = await requete(url, "/api/agendas/1/partages", {
            method: "POST",
            body: { email: "x@test.fr", droit: "lecture" }
        });

        assert.equal(response.status, 401);
    });
});

describe("GET /api/agendas/:idAgenda/partages", function () {
    test("le propriétaire liste les partages de son agenda", async function () {
        const alice = await creerUtilisateur("Alice");
        const bob = await creerUtilisateur("Bob");
        const agenda = await creerAgenda(url, alice.cookie, "Cours");
        await partager(alice.cookie, agenda.idAgenda, bob.email, "lecture");

        const response = await requete(url, "/api/agendas/" + agenda.idAgenda + "/partages", { cookie: alice.cookie });
        const partages = await response.json();

        assert.equal(response.status, 200);
        assert.equal(partages.length, 1);
        assert.equal(partages[0].email, bob.email);
        assert.equal(partages[0].droit, "lecture");
    });

    test("répond 404 pour quelqu'un qui n'est pas le propriétaire", async function () {
        const alice = await creerUtilisateur("Alice");
        const bob = await creerUtilisateur("Bob");
        const agenda = await creerAgenda(url, alice.cookie, "Cours");

        const response = await requete(url, "/api/agendas/" + agenda.idAgenda + "/partages", { cookie: bob.cookie });

        assert.equal(response.status, 404);
    });
});

describe("DELETE /api/agendas/:idAgenda/partages/:idUtilisateur", function () {
    test("le propriétaire annule un partage (204)", async function () {
        const alice = await creerUtilisateur("Alice");
        const bob = await creerUtilisateur("Bob");
        const agenda = await creerAgenda(url, alice.cookie, "Cours");
        const partage = await (await partager(alice.cookie, agenda.idAgenda, bob.email, "lecture")).json();

        const response = await requete(url,
            "/api/agendas/" + agenda.idAgenda + "/partages/" + partage.idUtilisateur,
            { method: "DELETE", cookie: alice.cookie });

        assert.equal(response.status, 204);
        // L'agenda ne remonte plus chez Bob
        const agendasBob = await agendasDe(bob.cookie);
        assert.ok(!agendasBob.some(function (a) { return a.idAgenda === agenda.idAgenda; }));
    });

    test("un destinataire peut se retirer lui-même (204)", async function () {
        const alice = await creerUtilisateur("Alice");
        const bob = await creerUtilisateur("Bob");
        const agenda = await creerAgenda(url, alice.cookie, "Cours");
        const partage = await (await partager(alice.cookie, agenda.idAgenda, bob.email, "lecture")).json();

        const response = await requete(url,
            "/api/agendas/" + agenda.idAgenda + "/partages/" + partage.idUtilisateur,
            { method: "DELETE", cookie: bob.cookie });

        assert.equal(response.status, 204);
    });

    test("un tiers ne peut pas retirer le partage de quelqu'un d'autre (404)", async function () {
        const alice = await creerUtilisateur("Alice");
        const bob = await creerUtilisateur("Bob");
        const carol = await creerUtilisateur("Carol");
        const agenda = await creerAgenda(url, alice.cookie, "Cours");
        const partage = await (await partager(alice.cookie, agenda.idAgenda, bob.email, "lecture")).json();

        // Carol n'est ni propriétaire ni le destinataire visé
        const response = await requete(url,
            "/api/agendas/" + agenda.idAgenda + "/partages/" + partage.idUtilisateur,
            { method: "DELETE", cookie: carol.cookie });

        assert.equal(response.status, 404);
    });
});

describe("Droits sur les activités d'un agenda partagé", function () {
    const PERIODE = "?start=2026-10-15T00:00:00Z&end=2026-10-16T00:00:00Z";
    const ACTIVITE = { titre: "Cours", debut: "2026-10-15T08:00:00Z", fin: "2026-10-15T10:00:00Z" };

    let alice;
    let bob;
    let agenda;

    before(async function () {
        alice = await creerUtilisateur("Alice");
        bob = await creerUtilisateur("Bob");
        agenda = await creerAgenda(url, alice.cookie, "Cours");
    });

    test("en lecture : Bob voit les activités mais ne peut pas en créer (403)", async function () {
        await partager(alice.cookie, agenda.idAgenda, bob.email, "lecture");

        const lecture = await requete(url, "/api/agendas/" + agenda.idAgenda + "/activites" + PERIODE, { cookie: bob.cookie });
        assert.equal(lecture.status, 200);

        const creation = await requete(url, "/api/agendas/" + agenda.idAgenda + "/activites", {
            method: "POST", cookie: bob.cookie, body: ACTIVITE
        });
        assert.equal(creation.status, 403);
        assert.deepEqual(await creation.json(), { erreur: "Droit insuffisant" });
    });

    test("en écriture : Bob peut créer une activité (201)", async function () {
        await partager(alice.cookie, agenda.idAgenda, bob.email, "ecriture");

        const creation = await requete(url, "/api/agendas/" + agenda.idAgenda + "/activites", {
            method: "POST", cookie: bob.cookie, body: ACTIVITE
        });
        assert.equal(creation.status, 201);
    });
});
