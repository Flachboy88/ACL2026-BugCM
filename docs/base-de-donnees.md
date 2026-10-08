# Base de données : guide de l'équipe

La base est une base **SQLite** : toute la base tient dans **un seul fichier**, `data/agenda.db`.
Il n'y a rien à installer : la bibliothèque `better-sqlite3` est installée par `npm install`.

Les tables sont créées et modifiées par des **migrations** : des fichiers SQL numérotés, versionnés dans Git.

---

## 1. Lancer le projet

```bash
npm install
npm start
```

Au démarrage, le serveur :

1. crée le fichier `data/agenda.db` s'il n'existe pas encore ;
2. applique les **migrations** pas encore appliquées (voir partie 3) ;
3. écoute sur http://localhost:3000.

Le fichier `data/agenda.db` **n'est pas dans Git** : chacun a sa propre base sur sa machine, avec ses propres données de test.
Arrêter le serveur ou l'ordinateur ne l'efface pas.

### Commandes utiles

| Commande | Effet |
|---|---|
| `npm start` | Crée / met à jour la base, puis démarre le serveur |
| `npm run db:reset` | **Efface toute la base** (le serveur doit être arrêté). Le prochain `npm start` la recrée (voir partie 5) |

### Voir le contenu de la base

Ouvrir le fichier `data/agenda.db` avec un de ces outils :

- **DB Browser for SQLite** (gratuit, le plus simple) : https://sqlitebrowser.org/
- **DBeaver** : nouvelle connexion → SQLite → choisir le fichier ;
- une extension SQLite pour VS Code ou IntelliJ.

> Ces outils servent à **regarder** la base. Pour changer la structure des tables, on écrit une migration (partie 4), jamais à la main.

---

## 2. Utiliser la base dans le code du serveur

La connexion est ouverte une seule fois dans `server/database.js`. Pour l'utiliser :

```js
const database = require("./database");

// Lire plusieurs lignes
const agendas = database.prepare("SELECT * FROM agenda WHERE id_utilisateur = ?").all(idUtilisateur);

// Lire une seule ligne (undefined si rien n'est trouvé)
const agenda = database.prepare("SELECT * FROM agenda WHERE id_agenda = ?").get(idAgenda);

// Ajouter / modifier / supprimer
const result = database.prepare("INSERT INTO agenda (nom, couleur, id_utilisateur) VALUES (?, ?, ?)").run(nom, couleur, idUtilisateur);
console.log(result.lastInsertRowid); // id de la ligne créée
```

- Toujours passer les valeurs avec des `?`, jamais en collant du texte dans la requête (`"... WHERE id = " + id`) : c'est la protection contre les injections SQL.
- Les fonctions sont **synchrones** : pas besoin de `await`.

---

## 3. Le principe des migrations

On ne crée **jamais** une table à la main. On écrit un fichier SQL dans `database/migrations/`, et c'est le serveur qui l'applique au démarrage.

```
database/migrations/
├── 001_creer_table_a.sql
├── 002_creer_table_b.sql
└── 003_ajouter_colonne_x_a_table_a.sql
```

Au démarrage, le serveur :

1. regarde dans la table `migration` quels fichiers ont déjà été appliqués ;
2. applique les autres, **dans l'ordre des numéros** ;
3. note chaque fichier appliqué dans la table `migration`.

Chaque fichier est appliqué dans une **transaction** : s'il y a une erreur dans le fichier, **rien** n'est appliqué et le serveur s'arrête en affichant l'erreur.

Résultat : quand quelqu'un ajoute une migration, les autres font `git pull` puis `npm start`, et leur base est à jour **sans perdre leurs données**.

---

## 4. Créer ou modifier une table

### Créer une table

1. Regarder le plus grand numéro dans `database/migrations/` et prendre le suivant.
2. Créer le fichier `NNN_description_courte.sql` (numéro sur 3 chiffres, minuscules, `_` au lieu des espaces).
3. Écrire le SQL. Exemple :

   ```sql
   CREATE TABLE exemple (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       nom TEXT NOT NULL,
       date_creation TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
   );
   ```

4. Lancer `npm start` : le terminal affiche `Migration applied: NNN_description_courte.sql`.
5. Vérifier le résultat avec DB Browser for SQLite.
6. Commit + PR, comme le reste du code.

### Ce qui change par rapport au SQL vu en cours

| Besoin | En SQLite |
|---|---|
| Identifiant auto-incrémenté | `id INTEGER PRIMARY KEY AUTOINCREMENT` |
| Texte | `TEXT` (pas besoin de `VARCHAR(50)`) |
| Nombre entier / booléen | `INTEGER` (booléen : `0` ou `1`) |
| Date et heure | `TEXT` au format ISO : `'2026-10-15T14:30:00Z'`. Ce format se trie et se compare correctement (`WHERE debut >= '2026-10-12'`) |
| Date actuelle par défaut | `DEFAULT CURRENT_TIMESTAMP` |
| Clé étrangère | `id_agenda INTEGER NOT NULL REFERENCES agenda(id_agenda) ON DELETE CASCADE` |
| Vérification | `CHECK (fin > debut)` |

> Les clés étrangères sont **activées** par `server/database.js` : une ligne qui pointe vers une ligne inexistante est refusée.

### Modifier une table qui existe déjà

On écrit une **nouvelle** migration. SQLite sait faire directement :

```sql
-- Ajouter une colonne
ALTER TABLE exemple ADD COLUMN description TEXT;

-- Renommer une colonne
ALTER TABLE exemple RENAME COLUMN nom TO titre;

-- Supprimer une colonne
ALTER TABLE exemple DROP COLUMN description;
```

En revanche, SQLite **ne sait pas** changer le type ou les contraintes d'une colonne (ajouter un `NOT NULL`, un `UNIQUE`...).
Dans ce cas, la migration **reconstruit** la table en 4 étapes :

```sql
-- 1. Créer la nouvelle version de la table
CREATE TABLE exemple_nouveau (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL UNIQUE,
    date_creation TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Copier les données
INSERT INTO exemple_nouveau (id, nom, date_creation)
SELECT id, nom, date_creation FROM exemple;

-- 3. Supprimer l'ancienne table
DROP TABLE exemple;

-- 4. Donner l'ancien nom à la nouvelle table
ALTER TABLE exemple_nouveau RENAME TO exemple;
```

Les lignes des autres tables qui pointent vers `exemple` (clés étrangères) ne sont pas perdues : le serveur désactive les clés étrangères pendant les migrations, puis vérifie à la fin de chaque migration que tout est cohérent.

### Les règles

- **Ne jamais modifier une migration déjà fusionnée dans `main`.** Les autres l'ont déjà appliquée : leur base ne verrait pas le changement. Pour corriger, on écrit une nouvelle migration.
- **Ne jamais renuméroter ni supprimer** une migration fusionnée.
- Une migration = un changement cohérent (créer une table, ajouter une colonne...).
- Si deux personnes prennent le même numéro en parallèle, celle qui fusionne en second renumérote son fichier **avant** de fusionner.

---

## 5. Quand faut-il effacer la base (`npm run db:reset`) ?

`db:reset` supprime le fichier `data/agenda.db`, donc **toutes les données de ta base locale** (comptes de test, rendez-vous...). Au `npm start` suivant, la base est recréée et toutes les migrations sont réappliquées depuis le début.

Il faut **arrêter le serveur** avant (Ctrl+C dans le terminal où il tourne).

| Situation | Faut-il reset ? |
|---|---|
| J'ai fait `git pull` et il y a de nouvelles migrations | **Non**, `npm start` suffit |
| Une migration a échoué au démarrage | **Non** : elle a été annulée. Corriger le fichier, puis `npm start` |
| J'ai modifié une migration **de ma branche, pas encore fusionnée**, que j'avais déjà appliquée | **Oui** : ma base contient l'ancienne version |
| Je change de branche et ma base contient des tables d'une autre branche, ce qui provoque des erreurs | **Oui** |
| Ma base est dans un état bizarre et je veux repartir propre | **Oui** |
| J'ai modifié une migration **déjà fusionnée** | Ne pas faire ça (voir les règles) |

---

## 6. Dépannage

| Message | Cause probable | Solution |
|---|---|---|
| `Could not prepare the database: Migration ... failed: ...` | Erreur SQL dans une migration | Lire le message, corriger le fichier, relancer `npm start` |
| `... failed: some rows point to rows that do not exist (foreign keys)` | La migration laisse des lignes qui pointent vers des lignes supprimées ou inexistantes | Corriger les données copiées dans la migration |
| `Could not delete the database. Is the server still running?` | Le serveur tourne encore et utilise le fichier | Arrêter le serveur (Ctrl+C), puis relancer `npm run db:reset` |
| `FOREIGN KEY constraint failed` (pendant l'utilisation) | Le code insère une ligne qui pointe vers une ligne inexistante | Vérifier l'identifiant envoyé (agenda, utilisateur...) |
| `npm install` échoue sur `better-sqlite3` avec `gyp ERR!` ou `Visual Studio` | Pas de version précompilée de `better-sqlite3` pour ta version de Node, donc npm essaie de la compiler | Installer la version **LTS** de Node (22 ou 24) depuis https://nodejs.org/, supprimer `node_modules`, relancer `npm install` |

> Ne pas passer `better-sqlite3` en version 13 : cette version n'est plus fournie précompilée et demande des outils de compilation (Visual Studio sous Windows). La version 12 suffit.
