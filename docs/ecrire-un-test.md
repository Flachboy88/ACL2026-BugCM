# Écrire un test

Les tests vérifient automatiquement que les routes répondent ce qu'elles doivent répondre.
Ils utilisent `node:test` et `node:assert`, intégrés à Node.js 22 : rien à installer.

Règle de l'équipe : **une story arrive avec ses tests**, et `npm test` passe avant d'ouvrir la PR.

---

## 1. Lancer les tests

```bash
npm test
```

Pour un seul fichier, ou seulement les tests dont le nom contient un mot :

```bash
node --import ./test/setup.js --test test/agendas.test.js
node --import ./test/setup.js --test --test-name-pattern="couleur" "test/**/*.test.js"
```

Chaque test affiche `✔` (réussi) ou `✖` (échoué). En cas d'échec, Node affiche la valeur attendue et la valeur reçue.

---

## 2. Où sont les tests

```
test/
├── setup.js            # Chargé avant chaque fichier : base en mémoire + secret des jetons
├── helpers.js          # Outils partagés : démarrer l'app, envoyer une requête, créer un utilisateur
├── auth.test.js        # Inscription, connexion, déconnexion, accès aux pages
├── agendas.test.js     # Routes /api/agendas
└── activites.test.js   # Routes des activités
```

`npm test` lance tous les fichiers `test/**/*.test.js`. Pour une nouvelle route, on ajoute ses tests dans le fichier de son groupe, ou dans un nouveau fichier `xxx.test.js`.

**Comment ça marche, en bref :**

- `server/app.js` construit l'application Express **sans la démarrer**. C'est `server/server.js` qui la démarre pour `npm start`.
- Chaque fichier de test démarre sa propre copie de l'app sur un port libre (`demarrerServeur()`), puis l'arrête à la fin.
- La base est en mémoire (`DATABASE_FILE=":memory:"`, posé dans `setup.js`) : elle est vide au début de chaque fichier et disparaît à la fin. Votre `data/agenda.db` n'est jamais touchée.

---

## 3. Anatomie d'un test

Un test fait toujours trois choses : **préparer** les données, **agir** (envoyer la requête), **vérifier** la réponse.

```js
test("refuse une couleur qui n'est pas au format #RRGGBB (400)", async function () {
    // Préparer : un utilisateur connecté
    const cookie = await creerUtilisateur(url);

    // Agir : la requête à tester
    const response = await requete(url, "/api/agendas", {
        method: "POST",
        cookie: cookie,
        body: { nom: "Travail", couleur: "rouge" }
    });

    // Vérifier : le code HTTP et le JSON renvoyé
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { erreur: "Couleur invalide (format #RRGGBB)" });
});
```

Le nom du test dit ce qui est attendu, en français, comme une phrase : « refuse… », « crée… », « répond 404… ».

---

## 4. Les outils

### `node:test`

| Fonction | Rôle |
|---|---|
| `test("nom", fn)` | Un test |
| `describe("nom", fn)` | Regroupe des tests (par exemple tous ceux d'une route) |
| `before(fn)` / `after(fn)` | Exécuté une fois avant / après les tests du groupe (ou du fichier) |

### `node:assert/strict`

| Vérification | Réussit si… |
|---|---|
| `assert.equal(a, b)` | `a === b` (nombres, textes) |
| `assert.deepEqual(a, b)` | `a` et `b` ont le même contenu (objets, tableaux) |
| `assert.ok(valeur)` | `valeur` est vraie (non vide, non `undefined`…) |
| `assert.notEqual(a, b)` | `a !== b` |

### `test/helpers.js`

| Fonction | Rôle |
|---|---|
| `demarrerServeur()` | Démarre l'app sur un port libre, renvoie `{ url, arreter }` |
| `requete(url, chemin, { method, body, cookie })` | Envoie une requête ; `body` est envoyé en JSON. Les redirections ne sont pas suivies : on vérifie `302` et `response.headers.get("location")` |
| `creerUtilisateur(url)` | Inscrit un nouvel utilisateur (email unique) et renvoie son cookie de connexion |
| `creerAgenda(url, cookie, nom)` | Crée un agenda pour cet utilisateur et le renvoie |
| `lireCookie(response)` | Cookie `accessToken=…` posé par la réponse (`undefined` s'il n'y en a pas) |

Si un besoin revient dans plusieurs fichiers (créer une activité, par exemple), on l'ajoute dans `helpers.js`.

---

## 5. Modèle d'un nouveau fichier de test

```js
// Tests de ... (dire quelles routes)
import { describe, test, after } from "node:test";
import assert from "node:assert/strict";
import { demarrerServeur, requete, creerUtilisateur } from "./helpers.js";

// Une copie de l'app, démarrée pour ce fichier sur un port libre
const { url, arreter } = await demarrerServeur();

after(function () {
    arreter();
});

describe("PUT /api/agendas/:idAgenda", function () {
    test("modifie l'agenda et le renvoie", async function () {
        const cookie = await creerUtilisateur(url);
        // ...
    });

    test("répond 404 pour l'agenda d'un autre utilisateur", async function () {
        // ...
    });
});
```

Le serveur est démarré en haut du fichier (pas dans un `before`) : quand on filtre avec `--test-name-pattern`, Node saute les `before` des fichiers sans test choisi mais exécute quand même leur `after`.

---

## 6. Quoi tester pour une route

Au minimum, pour chaque route :

- **le cas normal** : le bon code (`200`, `201`, `204`) et le JSON renvoyé ;
- **au moins un cas d'erreur** : champ manquant ou invalide (`400`), élément introuvable (`404`).

Et selon la route :

- **sans être connecté** : une route `/api` répond `401` ;
- **les données d'un autre utilisateur** : on crée deux utilisateurs et on vérifie que le second ne peut ni voir, ni modifier, ni supprimer ce qui appartient au premier (`404`, et la donnée n'a pas changé).

---

## 7. Bonnes pratiques

- **Des tests indépendants** : chaque test crée ce dont il a besoin (`creerUtilisateur` donne un compte neuf à chaque appel). Un test ne doit pas dépendre d'un autre test, ni de l'ordre d'exécution.
- **Un test = un comportement** : si le nom du test contient « et », c'est souvent deux tests.
- **Vérifier le contenu, pas seulement le code HTTP** : le message d'erreur, les champs renvoyés.
- **Voir le test échouer au moins une fois** : on casse volontairement le code (par exemple `201` → `200`) et on vérifie que le test passe au rouge. Un test qui ne peut pas échouer ne sert à rien.
- **Modifier un test, c'est modifier une règle** : si un test casse après votre changement, demandez-vous d'abord si c'est le code ou le test qui a raison, et dites-le dans la PR.
