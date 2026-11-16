// Tests des routes des agendas : GET, POST, PUT et DELETE /api/agendas
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { demarrerServeur, requete, creerUtilisateur, creerAgenda } from "./helpers.js";

// Serveur de test pour ce fichier, sur un port libre
const { url, arreter } = await demarrerServeur();

after(function () {
    arreter();
});

describe("GET /api/agendas", function () {
    test("un nouvel utilisateur a seulement son agenda par défaut « Mon agenda » (#62)", async function () {
        const cookie = await creerUtilisateur(url);

        const response = await requete(url, "/api/agendas", { cookie: cookie });
        const agendas = await response.json();

        assert.equal(response.status, 200);
        assert.equal(agendas.length, 1);
        assert.equal(agendas[0].nom, "Mon agenda");
        assert.equal(agendas[0].couleur, "#3788d8");
        assert.equal(agendas[0].droit, "proprietaire");
        assert.equal(agendas[0].parDefaut, true);
    });

    test("un agenda créé ensuite n'est pas l'agenda par défaut", async function () {
        const cookie = await creerUtilisateur(url);

        const agenda = await creerAgenda(url, cookie, "Sport");

        assert.equal(agenda.parDefaut, false);
    });

    test("renvoie les agendas de l'utilisateur, triés par nom", async function () {
        const cookie = await creerUtilisateur(url);
        await creerAgenda(url, cookie, "Sport");
        await creerAgenda(url, cookie, "Cours");

        const response = await requete(url, "/api/agendas", { cookie: cookie });
        const agendas = await response.json();

        assert.equal(response.status, 200);
        assert.deepEqual(agendas.map(function (agenda) { return agenda.nom; }), ["Cours", "Mon agenda", "Sport"]);
    });

    test("ne renvoie pas les agendas d'un autre utilisateur", async function () {
        const cookieAlice = await creerUtilisateur(url);
        const cookieBob = await creerUtilisateur(url);
        await creerAgenda(url, cookieAlice, "Agenda d'Alice");

        const response = await requete(url, "/api/agendas", { cookie: cookieBob });

        // Bob ne voit que son propre agenda par défaut
        const noms = (await response.json()).map(function (agenda) { return agenda.nom; });
        assert.deepEqual(noms, ["Mon agenda"]);
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

describe("PUT /api/agendas/:idAgenda", function () {
    test("modifie l'agenda et le renvoie", async function () {
        const cookie = await creerUtilisateur(url);
        const agenda = await creerAgenda(url, cookie, "Ancien");

        const response = await requete(url, "/api/agendas/" + agenda.idAgenda, {
            method: "PUT",
            cookie: cookie,
            body: { nom: "  Nouveau  ", couleur: "#00ff00", description: "Révisé" }
        });
        const modifie = await response.json();

        assert.equal(response.status, 200);
        assert.equal(modifie.idAgenda, agenda.idAgenda);
        // Les espaces autour du nom sont retirés
        assert.equal(modifie.nom, "Nouveau");
        assert.equal(modifie.couleur, "#00ff00");
        assert.equal(modifie.description, "Révisé");
    });

    test("accepte une modification sans description (null)", async function () {
        const cookie = await creerUtilisateur(url);
        const agenda = await creerAgenda(url, cookie, "Loisirs");

        const response = await requete(url, "/api/agendas/" + agenda.idAgenda, {
            method: "PUT",
            cookie: cookie,
            body: { nom: "Loisirs", couleur: "#00ff00" }
        });

        assert.equal(response.status, 200);
        assert.equal((await response.json()).description, null);
    });

    test("refuse un nom vide (400)", async function () {
        const cookie = await creerUtilisateur(url);
        const agenda = await creerAgenda(url, cookie);

        const response = await requete(url, "/api/agendas/" + agenda.idAgenda, {
            method: "PUT",
            cookie: cookie,
            body: { nom: "   ", couleur: "#ff0000" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Le nom est obligatoire" });
    });

    test("refuse une couleur qui n'est pas au format #RRGGBB (400)", async function () {
        const cookie = await creerUtilisateur(url);
        const agenda = await creerAgenda(url, cookie);

        const response = await requete(url, "/api/agendas/" + agenda.idAgenda, {
            method: "PUT",
            cookie: cookie,
            body: { nom: "Travail", couleur: "rouge" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Couleur invalide (format #RRGGBB)" });
    });

    test("répond 404 pour l'agenda d'un autre utilisateur, sans le modifier", async function () {
        const cookieAlice = await creerUtilisateur(url);
        const cookieBob = await creerUtilisateur(url);
        const agenda = await creerAgenda(url, cookieAlice, "À Alice");

        const response = await requete(url, "/api/agendas/" + agenda.idAgenda, {
            method: "PUT",
            cookie: cookieBob,
            body: { nom: "Volé par Bob", couleur: "#ff0000" }
        });

        assert.equal(response.status, 404);
        assert.deepEqual(await response.json(), { erreur: "Agenda introuvable" });
        // Alice retrouve son agenda tel quel
        const liste = await requete(url, "/api/agendas", { cookie: cookieAlice });
        const noms = (await liste.json()).map(function (a) { return a.nom; });
        assert.ok(noms.includes("À Alice"));
        assert.ok(!noms.includes("Volé par Bob"));
    });

    test("répond 404 pour un agenda qui n'existe pas", async function () {
        const cookie = await creerUtilisateur(url);

        const response = await requete(url, "/api/agendas/999999", {
            method: "PUT",
            cookie: cookie,
            body: { nom: "Travail", couleur: "#ff0000" }
        });

        assert.equal(response.status, 404);
    });

    test("répond 401 sans être connecté", async function () {
        const response = await requete(url, "/api/agendas/1", {
            method: "PUT",
            body: { nom: "Travail", couleur: "#ff0000" }
        });

        assert.equal(response.status, 401);
    });
});

describe("DELETE /api/agendas/:idAgenda", function () {
    // Liste des noms des agendas de l'utilisateur de ce cookie
    async function nomsDesAgendas(cookie) {
        const response = await requete(url, "/api/agendas", { cookie: cookie });
        return (await response.json()).map(function (agenda) { return agenda.nom; });
    }

    // Inscrit un utilisateur avec un email connu (pour pouvoir lui partager un agenda)
    let numero = 0;
    async function inscrire() {
        numero++;
        const email = "suppression" + numero + "@test.fr";
        const response = await requete(url, "/register", {
            method: "POST",
            body: { userName: "Suppr " + numero, email: email, password: "motdepasse1", confirmPassword: "motdepasse1" }
        });
        const cookie = response.headers.getSetCookie()[0].split(";")[0];
        return { cookie: cookie, email: email };
    }

    test("supprime l'agenda (204), il disparaît de la liste", async function () {
        const cookie = await creerUtilisateur(url);
        const agenda = await creerAgenda(url, cookie, "Sport");

        const response = await requete(url, "/api/agendas/" + agenda.idAgenda, { method: "DELETE", cookie: cookie });

        assert.equal(response.status, 204);
        assert.deepEqual(await nomsDesAgendas(cookie), ["Mon agenda"]);
    });

    test("refuse de supprimer l'agenda par défaut (403)", async function () {
        const cookie = await creerUtilisateur(url);
        const liste = await requete(url, "/api/agendas", { cookie: cookie });
        const parDefaut = (await liste.json())[0];

        const response = await requete(url, "/api/agendas/" + parDefaut.idAgenda, { method: "DELETE", cookie: cookie });

        assert.equal(response.status, 403);
        assert.deepEqual(await response.json(), { erreur: "L'agenda par défaut ne peut pas être supprimé" });
        assert.deepEqual(await nomsDesAgendas(cookie), ["Mon agenda"]);
    });

    test("supprime aussi ses activités et ses partages", async function () {
        const alice = await inscrire();
        const bob = await inscrire();
        const agenda = await creerAgenda(url, alice.cookie, "Projet");
        const activite = await requete(url, "/api/agendas/" + agenda.idAgenda + "/activites", {
            method: "POST",
            cookie: alice.cookie,
            body: { titre: "Réunion", debut: "2026-10-15T10:00:00Z", fin: "2026-10-15T11:00:00Z" }
        });
        assert.equal(activite.status, 201);
        const partage = await requete(url, "/api/agendas/" + agenda.idAgenda + "/partages", {
            method: "POST",
            cookie: alice.cookie,
            body: { email: bob.email, droit: "lecture" }
        });
        assert.equal(partage.status, 201);
        assert.ok((await nomsDesAgendas(bob.cookie)).includes("Projet"));

        const response = await requete(url, "/api/agendas/" + agenda.idAgenda, { method: "DELETE", cookie: alice.cookie });

        assert.equal(response.status, 204);
        // Bob ne voit plus l'agenda partagé, et l'activité n'existe plus
        assert.deepEqual(await nomsDesAgendas(bob.cookie), ["Mon agenda"]);
        const recherche = await requete(url, "/api/activites/recherche?q=Réunion", { cookie: alice.cookie });
        assert.deepEqual(await recherche.json(), []);
    });

    test("répond 404 pour l'agenda d'un autre utilisateur, même partagé en écriture, sans le supprimer", async function () {
        const alice = await inscrire();
        const bob = await inscrire();
        const agenda = await creerAgenda(url, alice.cookie, "À Alice");
        await requete(url, "/api/agendas/" + agenda.idAgenda + "/partages", {
            method: "POST",
            cookie: alice.cookie,
            body: { email: bob.email, droit: "ecriture" }
        });

        const response = await requete(url, "/api/agendas/" + agenda.idAgenda, { method: "DELETE", cookie: bob.cookie });

        assert.equal(response.status, 404);
        assert.ok((await nomsDesAgendas(alice.cookie)).includes("À Alice"));
    });

    test("répond 404 pour un agenda qui n'existe pas", async function () {
        const cookie = await creerUtilisateur(url);

        const response = await requete(url, "/api/agendas/999999", { method: "DELETE", cookie: cookie });

        assert.equal(response.status, 404);
    });

    test("répond 401 sans être connecté", async function () {
        const response = await requete(url, "/api/agendas/1", { method: "DELETE" });

        assert.equal(response.status, 401);
    });
});
