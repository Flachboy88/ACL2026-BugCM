// Outils partagés par les tests : démarrer l'app, envoyer des requêtes, créer un utilisateur connecté
import { once } from "node:events";
import app from "../server/app.js";
import runMigrations from "../server/migrations.js";

// Crée les tables dans la base en mémoire (une seule fois par fichier de test)
runMigrations();

// Démarre l'app sur un port libre (port 0 : le système choisit).
// Renvoie l'adresse du serveur et une fonction pour l'arrêter.
export async function demarrerServeur() {
    const server = app.listen(0);
    await once(server, "listening");
    return {
        url: "http://localhost:" + server.address().port,
        arreter: function () {
            server.close();
        }
    };
}

// Envoie une requête au serveur. body est converti en JSON, cookie est le jeton de connexion.
// Les redirections ne sont pas suivies : on peut vérifier le code 302 et l'en-tête location.
export function requete(url, chemin, { method = "GET", body, cookie } = {}) {
    const headers = {};
    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }
    if (cookie !== undefined) {
        headers["Cookie"] = cookie;
    }
    return fetch(url + chemin, {
        method: method,
        headers: headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: "manual"
    });
}

// Cookie "accessToken=..." envoyé par le serveur, à renvoyer dans les requêtes suivantes
export function lireCookie(response) {
    const cookie = response.headers.getSetCookie().find(function (ligne) {
        return ligne.startsWith("accessToken=");
    });
    return cookie === undefined ? undefined : cookie.split(";")[0];
}

let numeroUtilisateur = 0;

// Inscrit un nouvel utilisateur (email différent à chaque appel) et renvoie son cookie de connexion
export async function creerUtilisateur(url) {
    numeroUtilisateur++;
    const response = await requete(url, "/register", {
        method: "POST",
        body: {
            userName: "Utilisateur " + numeroUtilisateur,
            email: "utilisateur" + numeroUtilisateur + "@test.fr",
            password: "motdepasse",
            confirmPassword: "motdepasse"
        }
    });
    if (response.status !== 200) {
        throw new Error("Inscription impossible : " + response.status);
    }
    return lireCookie(response);
}

// Crée un agenda pour l'utilisateur de ce cookie et renvoie l'agenda créé (JSON de l'API)
export async function creerAgenda(url, cookie, nom = "Cours") {
    const response = await requete(url, "/api/agendas", {
        method: "POST",
        cookie: cookie,
        body: { nom: nom, couleur: "#3366ff" }
    });
    if (response.status !== 201) {
        throw new Error("Création de l'agenda impossible : " + response.status);
    }
    return response.json();
}
