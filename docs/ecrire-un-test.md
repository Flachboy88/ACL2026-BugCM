# Écrire un test

On utilise `node:test` et `node:assert`, intégrés à Node.js 22 : rien à installer.
Une story arrive avec ses tests, et `npm test` doit passer avant d'ouvrir la PR.

## Lancer les tests

```bash
npm test
```

Un seul fichier, ou seulement les tests dont le nom contient un mot :

```bash
node --import ./test/setup.js --test test/agendas.test.js
node --import ./test/setup.js --test --test-name-pattern="couleur" "test/**/*.test.js"
```

En cas d'échec, Node affiche la valeur attendue et la valeur reçue.

## Organisation

```
test/
├── setup.js            # chargé avant chaque fichier : base en mémoire, secret des jetons
├── helpers.js          # démarrer l'app, envoyer une requête, créer un utilisateur / un agenda
├── auth.test.js        # inscription, connexion, déconnexion, accès aux pages
├── agendas.test.js     # /api/agendas
└── activites.test.js   # activités
```

`server/app.js` construit l'app sans la démarrer (c'est `server/server.js` qui la démarre pour `npm start`).
Chaque fichier de test démarre donc sa propre copie de l'app sur un port libre, avec une base en mémoire vide.
`data/agenda.db` n'est jamais touchée.

Pour une nouvelle route, on ajoute ses tests dans le fichier de son groupe, ou dans un nouveau fichier `xxx.test.js`.

## Un test

Un test prépare les données, envoie la requête, puis vérifie la réponse :

```js
test("refuse une couleur qui n'est pas au format #RRGGBB (400)", async function () {
    const cookie = await creerUtilisateur(url);

    const response = await requete(url, "/api/agendas", {
        method: "POST",
        cookie: cookie,
        body: { nom: "Travail", couleur: "rouge" }
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { erreur: "Couleur invalide (format #RRGGBB)" });
});
```

Le nom du test dit ce qui est attendu : « refuse… », « crée… », « répond 404… ».

Les fonctions utiles :

- `test`, `describe` (regroupe les tests d'une route), `before` / `after` (avant / après le groupe)
- `assert.equal(a, b)` pour un nombre ou un texte, `assert.deepEqual(a, b)` pour un objet ou un tableau, `assert.ok(x)` si `x` doit être vrai
- dans `helpers.js` :
  - `requete(url, chemin, { method, body, cookie })` : `body` est envoyé en JSON. Les redirections ne sont pas suivies, on vérifie `302` et `response.headers.get("location")`.
  - `creerUtilisateur(url)` : nouveau compte à chaque appel, renvoie son cookie de connexion.
  - `creerAgenda(url, cookie, nom)` : renvoie l'agenda créé.
  - `lireCookie(response)` : cookie `accessToken=…` posé par la réponse.

## Nouveau fichier de test

```js
// Tests de PUT /api/agendas/:idAgenda
import { describe, test, after } from "node:test";
import assert from "node:assert/strict";
import { demarrerServeur, requete, creerUtilisateur } from "./helpers.js";

// Serveur de test pour ce fichier, sur un port libre
const { url, arreter } = await demarrerServeur();

after(function () {
    arreter();
});

describe("PUT /api/agendas/:idAgenda", function () {
    test("modifie l'agenda et le renvoie", async function () {
        const cookie = await creerUtilisateur(url);
        // ...
    });
});
```

Le serveur est démarré en haut du fichier et pas dans un `before` : avec `--test-name-pattern`, Node saute les `before` d'un fichier dont aucun test n'est choisi, mais lance quand même son `after`.

## Quoi tester

Pour chaque route, au moins le cas normal (code `200` / `201` / `204` et JSON renvoyé) et un cas d'erreur (`400`, `404`).
Selon la route, aussi :

- sans être connecté : `401` sur `/api` ;
- avec les données d'un autre utilisateur : créer deux utilisateurs, vérifier que le second ne peut ni voir, ni modifier, ni supprimer ce qui est au premier.

Quelques règles :

- chaque test crée ce dont il a besoin, sans dépendre d'un autre test ;
- vérifier aussi le message d'erreur et les champs renvoyés, pas seulement le code HTTP ;
- voir le test échouer une fois (par exemple en changeant `201` en `200` dans la route) pour être sûr qu'il teste quelque chose ;
- si un test casse après un changement, se demander qui a raison du code ou du test, et le dire dans la PR.
