# Projet Agenda — Master Ingénierie Logicielle

Application Web de gestion d'agendas, basée sur une architecture client-serveur. Projet réalisé en équipe selon la méthode Scrum (sprints de 2 semaines).

## Équipe

Nom de l'équipe : **BugCM**

| Membre |
|---|
| MINAROLI Corentin |
| BURNEL Mathias |
| VERGNAUD Ryan |
| SCHMITT Martin |
| HENRY Romaric |
| SIGNORINO-GELO Matteo |

---

## Lancement

Prérequis : [Node.js](https://nodejs.org/) **22 ou plus**, en version LTS (avec npm). Rien d'autre à installer.

```bash
npm install && npm start
```

Au démarrage, `npm start` :

1. crée le fichier `.env` avec une clé secrète `SECRET` (utilisée pour signer les jetons de connexion) s'il n'existe pas encore (script `server/setup_env.js`) ;
2. crée ou met à jour la base de données (un fichier SQLite) ;
3. lance le serveur sur le port **3000** :
   - en local : http://localhost:3000
   - depuis une autre machine du réseau local : `http://<IP-de-la-machine-hôte>:3000`

Plusieurs clients peuvent utiliser l'application simultanément.

Le fichier `.env` n'est pas dans Git : chacun a le sien sur sa machine.

Base de données, création des tables et dépannage : voir [docs/base-de-donnees.md](docs/base-de-donnees.md).

### Lancement en mode développement

```bash
npm install && npm run dev
```

Le serveur redémarre tout seul quand on modifie un fichier du serveur (option `--watch` intégrée à Node.js 22, rien à installer).
Pour les fichiers du client (`client/`), il suffit de recharger la page dans le navigateur.

Pour surveiller aussi un autre dossier, on peut ajouter des `--watch-path` dans le script `dev` du `package.json`, par exemple :

```bash
"dev": "node --watch --watch-path=server --watch-path=DOSSIER_A_SURVEILLER server/server.js"
```

### Tests

```bash
npm test
```

Les tests utilisent `node:test` (intégré à Node.js, rien à installer) et une base en mémoire : la base locale `data/agenda.db` n'est pas touchée.
Pour écrire un test : voir [docs/ecrire-un-test.md](docs/ecrire-un-test.md).

---

## Architecture

Un **serveur unique** (Express) assure deux rôles, sur des routes distinctes :

| Rôle | Préfixe de route | Description |
|---|---|---|
| API | `/api/...` | Fournit les données et opérations de l'application |
| Pages Web | `/` | Pages générées avec EJS depuis `client/views/`, plus les fichiers CSS et JS de `client/` |

```
.
├── client/
│   ├── css/                # Feuille de style
│   ├── js/                 # Scripts du navigateur (calendrier, fenêtres, connexion...)
│   └── views/              # Pages EJS (index, login, register)
│       └── partials/       # Morceaux de page réutilisés (ex : header)
├── server/
│   ├── server.js           # Point d'entrée : prépare la base puis démarre le serveur (port 3000)
│   ├── app.js              # Application Express : assemble les middlewares et les routes, sans la démarrer
│   ├── middlewares/        # Middlewares partagés : auth.js (lecture du jeton, protection des routes)
│   ├── routes/             # Routes : auth.js (connexion), pages.js (pages EJS), agendas.js, activites.js
│   ├── database.js         # Connexion à la base SQLite
│   ├── migrations.js       # Application des migrations au démarrage
│   ├── resetDatabase.js    # Effacement de la base locale (npm run db:reset)
│   └── setup_env.js        # Création du fichier .env avec la clé secrète
├── database/
│   └── migrations/         # Fichiers SQL numérotés qui créent / modifient les tables
├── data/                   # Fichier de la base (agenda.db), créé au démarrage, pas dans Git
├── test/                   # Tests automatisés (npm test), un fichier *.test.js par groupe de routes
├── docs/                   # Documentation de l'équipe
├── sprints/                # Documents Scrum, un dossier par sprint
└── package.json
```

### Technologies

| Partie | Choix |
|---|---|
| Serveur | Node.js + Express 5 |
| Client | HTML, CSS, JavaScript, EJS, sans framework |
| Affichage du calendrier | FullCalendar |
| Base de données | SQLite (bibliothèque `better-sqlite3`) |

### Persistance des données

Les données sont stockées dans une base SQLite, c'est-à-dire un fichier : `data/agenda.db`. Un redémarrage du serveur ou de la machine n'entraîne aucune perte d'information.

Les tables sont créées et modifiées par des **migrations** (fichiers SQL numérotés dans `database/migrations/`), appliquées automatiquement au démarrage du serveur. Fonctionnement détaillé : [docs/base-de-donnees.md](docs/base-de-donnees.md).

---

## Fonctionnalités

### Socle minimal

- [x] Créer un compte, s'identifier / fermer sa session
- [x] Créer un agenda
- [x] Ajouter / supprimer / modifier un rendez-vous
- [x] Visualiser un nombre quelconque d'agendas simultanément (vues jour, semaine, mois et liste)

### Fonctionnalités avancées

- [ ] Rendez-vous récurrents
- [ ] Recherche de rendez-vous par différents critères
- [ ] Partage d'agendas entre utilisateurs (et annulation du partage)
- [ ] Import / export d'un agenda (format à définir)

### Fonctionnalités supplémentaires

- *À définir*

---

## API

Les données sont échangées en JSON. En cas d'erreur, la réponse contient `{ "erreur": "message" }`.

### Connexion

À la connexion ou à l'inscription, le serveur dépose un cookie `accessToken` (jeton JWT valable 30 minutes) qui identifie l'utilisateur.

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/register` | Crée un compte (`userName`, `email`, `password`, `confirmPassword`) et connecte l'utilisateur |
| `POST` | `/login` | Connecte l'utilisateur (`email`, `password`) |
| `POST` | `/logout` | Ferme la session (efface le cookie) et redirige vers `/login` |

### Agendas et activités

Toutes les routes `/api/...` demandent d'être connecté : sinon elles répondent `401`. Chaque utilisateur ne voit et ne modifie que ses propres agendas.

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/agendas` | Liste les agendas de l'utilisateur connecté |
| `POST` | `/api/agendas` | Crée un agenda (`nom`, `couleur` au format `#RRGGBB`, `description` facultative) |
| `GET` | `/api/agendas/:idAgenda/activites?start=...&end=...` | Liste les activités de l'agenda qui chevauchent la période donnée |
| `POST` | `/api/agendas/:idAgenda/activites` | Crée une activité (`titre`, `debut`, `fin`, `lieu` et `description` facultatifs) |
| `PUT` | `/api/activites/:idActivite` | Modifie une activité (mêmes champs, sans changer d'agenda) |
| `DELETE` | `/api/activites/:idActivite` | Supprime une activité |

### Pages Web

| Route | Page |
|---|---|
| `/` | Le calendrier (redirige vers `/login` si on n'est pas connecté) |
| `/login` | Connexion (redirige vers `/` si on est déjà connecté) |
| `/register` | Inscription (redirige vers `/` si on est déjà connecté) |

> Les routes sont ajoutées à ces tableaux au fur et à mesure de leur développement.

---

## Méthodologie (Scrum)

Le projet est organisé en sprints de 2 semaines. Pour chaque sprint, un dossier `sprints/sprintN/` contient :

- `backlog-sprint.md` — backlog du sprint ;
- `conception.md` — conception envisagée pour le sprint ;
- `sprint-review.md` — revue du sprint (fonctionnalités réalisées et validées, ou non) et rétrospective (ce qui a bien ou mal fonctionné, décisions pour le sprint suivant).

Le suivi des tâches se fait dans le [GitHub Project](https://github.com/users/Flachboy88/projects/2) de l'équipe : Backlog → In progress → Testing → In review → Done.

### Travail avec Git

- On ne pousse jamais directement sur `main` : chaque tâche est faite sur une branche, puis fusionnée par une **pull request**.
- Une tâche est terminée quand elle a été testée par son développeur, relue et testée par un collègue, puis fusionnée.
- Dans la description de la PR, `Closes #N` ferme automatiquement l'issue correspondante à la fusion.

### Versions

À la fin de chaque sprint, la branche principale est à jour et porte un tag correspondant au sprint :

| Tag | Contenu | Semaines |
|---|---|---|
| `v1` | Sprint 0 | s40 -> s42 |
| `v2` | Sprint 1 | s42 -> s45 |
| `v3` | Sprint 2 | s45 -> s47 |
| `v4` | Sprint 3 | s47 -> s50 |
| `release` | Version finale | s50 |
