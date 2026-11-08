// Tests du mot de passe oublié : demande d'un lien (POST /forget) et nouveau mot de passe (POST /reset)
import { describe, test, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import database from "../server/database.js";
import { demarrerServeur, requete } from "./helpers.js";

// Pas d'appel à Ethereal pendant les tests : le mailer fabrique le mail en mémoire sans l'envoyer
process.env.MAIL_MODE = "console";

// Serveur de test pour ce fichier, sur un port libre
const { url, arreter } = await demarrerServeur();

after(function () {
    arreter();
});

const UNE_HEURE = 60 * 60 * 1000;
let numero = 0;

// Inscrit un utilisateur dont le mot de passe est "ancien" et renvoie son email
async function creerCompte() {
    numero++;
    const email = "oubli" + numero + "@test.fr";
    const response = await requete(url, "/register", {
        method: "POST",
        body: { userName: "Oubli " + numero, email: email, password: "ancien", confirmPassword: "ancien" }
    });
    assert.equal(response.status, 200);
    return email;
}

function hasher(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

// Le vrai token n'existe que dans le mail : on pose en base un lien dont on connaît le token
function poserToken(email, token, expiration) {
    database
        .prepare("UPDATE utilisateur SET reset_token_hash = ?, reset_expires = ? WHERE email = ?")
        .run(hasher(token), expiration, email);
}

function lireUtilisateur(email) {
    return database.prepare("SELECT * FROM utilisateur WHERE email = ?").get(email);
}

describe("POST /forget", function () {
    test("enregistre le hash du token et une expiration d'une heure", async function () {
        const email = await creerCompte();
        const avant = Date.now();

        const response = await requete(url, "/forget", { method: "POST", body: { email: email } });
        const utilisateur = lireUtilisateur(email);

        assert.equal(response.status, 200);
        // Un sha256 en hexadécimal fait 64 caractères : le token n'est pas stocké en clair
        assert.match(utilisateur.reset_token_hash, /^[0-9a-f]{64}$/);
        assert.ok(utilisateur.reset_expires >= avant + UNE_HEURE - 1000);
        assert.ok(utilisateur.reset_expires <= Date.now() + UNE_HEURE + 1000);
    });

    test("répond la même chose pour un email inconnu (pas de fuite sur l'existence du compte)", async function () {
        const email = await creerCompte();

        const connu = await requete(url, "/forget", { method: "POST", body: { email: email } });
        const inconnu = await requete(url, "/forget", { method: "POST", body: { email: "personne@test.fr" } });

        assert.equal(inconnu.status, 200);
        assert.equal(inconnu.status, connu.status);
        assert.deepEqual(await inconnu.json(), await connu.json());
    });

    test("une nouvelle demande remplace le token précédent", async function () {
        const email = await creerCompte();

        await requete(url, "/forget", { method: "POST", body: { email: email } });
        const premier = lireUtilisateur(email).reset_token_hash;
        await requete(url, "/forget", { method: "POST", body: { email: email } });
        const second = lireUtilisateur(email).reset_token_hash;

        assert.notEqual(second, premier);
    });

    test("refuse s'il manque l'email (400)", async function () {
        const response = await requete(url, "/forget", { method: "POST", body: {} });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Champs manquants" });
    });

    test("refuse une requête sans JSON (400)", async function () {
        const response = await requete(url, "/forget", { method: "POST" });

        assert.equal(response.status, 400);
    });
});

describe("POST /reset", function () {
    test("change le mot de passe : le nouveau fonctionne, l'ancien non", async function () {
        const email = await creerCompte();
        poserToken(email, "token-valide", Date.now() + UNE_HEURE);

        const response = await requete(url, "/reset", {
            method: "POST",
            body: { token: "token-valide", password: "nouveau", confirmPassword: "nouveau" }
        });

        assert.equal(response.status, 200);
        const avecNouveau = await requete(url, "/login", { method: "POST", body: { email: email, password: "nouveau" } });
        const avecAncien = await requete(url, "/login", { method: "POST", body: { email: email, password: "ancien" } });
        assert.equal(avecNouveau.status, 200);
        assert.equal(avecAncien.status, 401);
    });

    test("stocke le nouveau mot de passe haché et efface le token", async function () {
        const email = await creerCompte();
        poserToken(email, "token-hash", Date.now() + UNE_HEURE);

        await requete(url, "/reset", {
            method: "POST",
            body: { token: "token-hash", password: "nouveau", confirmPassword: "nouveau" }
        });
        const utilisateur = lireUtilisateur(email);

        assert.notEqual(utilisateur.mot_de_passe_hash, "nouveau");
        assert.ok(bcrypt.compareSync("nouveau", utilisateur.mot_de_passe_hash));
        assert.equal(utilisateur.reset_token_hash, null);
        assert.equal(utilisateur.reset_expires, null);
    });

    test("le lien ne sert qu'une fois", async function () {
        const email = await creerCompte();
        poserToken(email, "token-unique", Date.now() + UNE_HEURE);
        const corps = { token: "token-unique", password: "nouveau", confirmPassword: "nouveau" };

        await requete(url, "/reset", { method: "POST", body: corps });
        const response = await requete(url, "/reset", { method: "POST", body: corps });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Lien invalide ou expiré" });
    });

    test("refuse un lien expiré, sans changer le mot de passe (400)", async function () {
        const email = await creerCompte();
        poserToken(email, "token-expire", Date.now() - 1000);

        const response = await requete(url, "/reset", {
            method: "POST",
            body: { token: "token-expire", password: "nouveau", confirmPassword: "nouveau" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Lien invalide ou expiré" });
        assert.ok(bcrypt.compareSync("ancien", lireUtilisateur(email).mot_de_passe_hash));
    });

    test("refuse un token inconnu (400)", async function () {
        const response = await requete(url, "/reset", {
            method: "POST",
            body: { token: "n-importe-quoi", password: "nouveau", confirmPassword: "nouveau" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Lien invalide ou expiré" });
    });

    test("refuse si les deux mots de passe sont différents, sans rien changer (400)", async function () {
        const email = await creerCompte();
        poserToken(email, "token-different", Date.now() + UNE_HEURE);

        const response = await requete(url, "/reset", {
            method: "POST",
            body: { token: "token-different", password: "nouveau", confirmPassword: "autre" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Mot de passe différents" });
        assert.ok(bcrypt.compareSync("ancien", lireUtilisateur(email).mot_de_passe_hash));
    });

    test("refuse s'il manque un champ (400)", async function () {
        const response = await requete(url, "/reset", {
            method: "POST",
            body: { token: "token", password: "nouveau" }
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { erreur: "Champs manquants" });
    });

    test("refuse une requête sans JSON (400)", async function () {
        const response = await requete(url, "/reset", { method: "POST" });

        assert.equal(response.status, 400);
    });
});
