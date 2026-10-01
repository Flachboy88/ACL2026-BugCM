# Base de données : guide de l'équipe

La base est un **PostgreSQL 17** qui tourne dans un conteneur **Docker**.
Les tables sont créées et modifiées par des **migrations** : des fichiers SQL numérotés, versionnés dans Git.

---

## 1. Installer Docker (une seule fois)

| Système | Quoi installer |
|---|---|
| Windows | [Docker Desktop](https://www.docker.com/products/docker-desktop/). Il demande **WSL2** : accepter l'installation. Si Docker refuse de démarrer, vérifier que la **virtualisation** est activée dans le BIOS. |
| Linux | Docker Engine + le plugin Compose (`docker compose`, pas l'ancien `docker-compose`). Ajouter son utilisateur au groupe `docker` pour ne pas avoir besoin de `sudo` : `sudo usermod -aG docker $USER` puis se reconnecter. |

Vérifier que tout marche :

```bash
docker run hello-world
docker compose version
```

> Sous Windows, **Docker Desktop doit être lancé** avant `npm start`.

---

## 2. Lancer le projet

```bash
npm install
npm start
```

`npm start` fait trois choses, dans l'ordre :

1. `docker compose up -d --wait` : démarre le conteneur PostgreSQL et attend qu'il soit prêt. La première fois, Docker télécharge l'image PostgreSQL (quelques centaines de Mo, compter quelques minutes).
2. Le serveur Node applique les **migrations** pas encore appliquées (voir partie 4).
3. Le serveur écoute sur http://localhost:3000.

Les données sont gardées dans un **volume Docker** (`agenda-bugcm_agenda-data`) : arrêter le serveur, le conteneur ou l'ordinateur ne les efface pas.

### Commandes utiles

| Commande | Effet |
|---|---|
| `npm start` | Démarre la base (si besoin) puis le serveur |
| `npm run db:stop` | Arrête le conteneur de la base (les données sont gardées) |
| `npm run db:reset` | **Efface toute la base** et la recrée vide (voir partie 5) |
| `docker compose ps` | Montre si le conteneur tourne et s'il est `healthy` |
| `docker compose logs db` | Affiche les messages de PostgreSQL |
| `docker compose exec db psql -U agenda -d agenda` | Ouvre une console SQL dans la base (`\dt` liste les tables, `\q` pour quitter) |

### Voir la base avec un outil graphique

DBeaver, pgAdmin, ou l'extension de base de données de VS Code / IntelliJ, avec :

| Champ | Valeur |
|---|---|
| Hôte | `localhost` |
| Port | `5432` |
| Base | `agenda` |
| Utilisateur | `agenda` |
| Mot de passe | `agenda` |

### Changer ces valeurs

Seulement si besoin (par exemple si le port 5432 est déjà pris par un PostgreSQL installé sur ta machine) :
copier `.env.example` en `.env` et modifier les valeurs. Le fichier `.env` n'est pas versionné : il reste sur ta machine.

---

## 3. Le principe des migrations

On ne crée **jamais** une table à la main dans la base. On écrit un fichier SQL dans `database/migrations/`, et c'est le serveur qui l'applique au démarrage.

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

Chaque fichier est appliqué dans une **transaction** : s'il y a une erreur dans le fichier, rien n'est appliqué, et le serveur s'arrête en affichant l'erreur.

Résultat : quand quelqu'un ajoute une migration, les autres font `git pull` puis `npm start`, et leur base est à jour **sans perdre leurs données et sans toucher à Docker**.

---

## 4. Créer ou modifier une table

### Créer une table

1. Regarder le plus grand numéro dans `database/migrations/` et prendre le suivant.
2. Créer le fichier `NNN_description_courte.sql` (numéro sur 3 chiffres, minuscules, `_` au lieu des espaces).
3. Écrire le SQL. Exemple :

   ```sql
   CREATE TABLE exemple (
       id SERIAL PRIMARY KEY,
       nom TEXT NOT NULL,
       date_creation TIMESTAMP NOT NULL DEFAULT NOW()
   );
   ```

4. Lancer `npm start` : le terminal affiche `Migration applied: NNN_description_courte.sql`.
5. Vérifier le résultat (DBeaver, ou `\d exemple` dans `psql`).
6. Commit + PR, comme le reste du code.

### Modifier une table qui existe déjà

On écrit une **nouvelle** migration, avec `ALTER TABLE` :

```sql
ALTER TABLE exemple ADD COLUMN description TEXT;
```

### Les règles

- **Ne jamais modifier une migration déjà fusionnée dans `main`.** Les autres l'ont déjà appliquée : leur base ne verrait pas le changement. Pour corriger, on écrit une nouvelle migration.
- **Ne jamais renuméroter ni supprimer** une migration fusionnée.
- Une migration = un changement cohérent (créer une table, ajouter une colonne...).
- Si deux personnes prennent le même numéro en parallèle, celle qui fusionne en second renumérote son fichier **avant** de fusionner.

---

## 5. Quand faut-il effacer la base (`npm run db:reset`) ?

`db:reset` supprime **toutes les données de ta base locale** (comptes de test, rendez-vous...), puis la recrée vide. Au `npm start` suivant, toutes les migrations sont réappliquées depuis le début.

| Situation | Faut-il reset ? |
|---|---|
| J'ai fait `git pull` et il y a de nouvelles migrations | **Non**, `npm start` suffit |
| Une migration a échoué au démarrage | **Non** : elle a été annulée. Corriger le fichier, puis `npm start` |
| J'ai modifié une migration **de ma branche, pas encore fusionnée**, que j'avais déjà appliquée | **Oui** : ma base contient l'ancienne version |
| Je change de branche et ma base contient des tables d'une autre branche, ce qui provoque des erreurs | **Oui** |
| Ma base est dans un état bizarre et je veux repartir propre | **Oui** |
| J'ai modifié une migration **déjà fusionnée** | Ne pas faire ça (voir les règles) |

> On n'a **jamais besoin de redémarrer Docker** pour un changement de tables : ce sont les migrations qui font le travail.

---

## 6. Dépannage

| Message | Cause probable | Solution |
|---|---|---|
| `failed to connect to the docker API` / `Cannot connect to the Docker daemon` | Docker n'est pas lancé | Lancer Docker Desktop (Windows) ou `sudo systemctl start docker` (Linux) |
| `port is already allocated` / `address already in use` sur 5432 | Un autre PostgreSQL utilise déjà le port | Dans `.env`, mettre `DB_PORT=5433` (par exemple) |
| `Could not prepare the database: Migration ... failed: ...` | Erreur SQL dans une migration | Lire le message, corriger le fichier, relancer `npm start` |
| `password authentication failed` | Les valeurs du `.env` ont changé après la création de la base | `npm run db:reset` (la base est recréée avec les nouvelles valeurs) |
| `permission denied ... docker.sock` (Linux) | Utilisateur pas dans le groupe `docker` | `sudo usermod -aG docker $USER` puis se reconnecter |
