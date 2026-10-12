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

`npm start` crée ou met à jour la base de données (un fichier SQLite), puis lance le serveur sur le port **3000** :

- en local : http://localhost:3000
- depuis une autre machine du réseau local : `http://<IP-de-la-machine-hôte>:3000`

Plusieurs clients peuvent utiliser l'application simultanément.

Base de données, création des tables et dépannage : voir [docs/base-de-donnees.md](docs/base-de-donnees.md).

Creation autolatique via script (setup_env.js) d'un fichier .env avec une clé secrète

### Lancement mode dev

```bash
npm install && npm run dev
```

Permet de ne pas voir à relancé le serveur à chaque modification des fichiers observé par le module (/server).
Module intégré à node 22. Pour les autres fichiers il suffit de recharger la page pour les rechargé.
Si necessaire rajouter à la suite du premier watch un watch path, la ligne doit ressembler  ce qui suit :
```bash
"dev": "node --watch --watch-path=server --watch-path=DIRECTORY_TO_OBSERVE_CHANGE server/server.js"
```

---

## Architecture

Un **serveur unique** (Express) assure deux rôles, sur des routes distinctes :

| Rôle | Préfixe de route | Description |
|---|---|---|
| API | `/api/...` | Fournit les données et opérations de l'application |
| Pages Web | `/` | Sert le client (HTML, CSS, JS) depuis le dossier `client/` |

```
.
├── client/                 
│   ├── css                 # Fichier de style
│   ├── views/               # Fichier ejs, contient les fichier html
│   │   ├── partial         # Fichier de template en ejs (ex:header)
│   │   └── ... .ejs
│   └── js/                  # Script d'affichage directe
├── server/
│   ├── server.js           # Point d'entrée : routes API + pages Web
│   ├── database.js         # Connexion à la base SQLite
│   ├── migrations.js       # Application des migrations au démarrage
│   ├── resetDatabase.js    # Effacement de la base locale (npm run db:reset)
│   ├── setup_env.js        # Mise en place d'une clé secrète
│   └── route/              # Recrée le callendar de l'utilisateur connecté à partir de la DB
├── database/
│   └── migrations/         # Fichiers SQL numérotés qui créent / modifient les tables
├── data/                   # Fichier de la base (agenda.db), créé au démarrage, pas dans Git
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

- [ ] S'identifier / fermer sa session
- [ ] Créer un agenda
- [ ] Ajouter / supprimer / modifier un rendez-vous
- [ ] Visualiser un nombre quelconque d'agendas simultanément

### Fonctionnalités avancées

- [ ] Rendez-vous récurrents
- [ ] Recherche de rendez-vous par différents critères
- [ ] Partage d'agendas entre utilisateurs (et annulation du partage)
- [ ] Import / export d'un agenda (format à définir)

### Fonctionnalités supplémentaires

- *À définir*

---

## API

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/status` | Indique que le serveur fonctionne |

> Les routes sont ajoutées à ce tableau au fur et à mesure de leur développement.

---

## Méthodologie (Scrum)

Le projet est organisé en sprints de 2 semaines. Pour chaque sprint, un dossier `sprints/sprintN/` contient :

- `backlog-sprint.md` — backlog du sprint courant ;
- `conception.md` — conception envisagée pour le sprint courant ;
- `revue.md` — revue du sprint précédent (fonctionnalités réalisées et validées, ou non) ;
- `retrospective.md` — rétrospective du sprint précédent (ce qui a bien ou mal fonctionné, décisions pour le sprint courant).

Le suivi des tâches se fait dans le [GitHub Project](https://github.com/users/Flachboy88/projects/2) de l'équipe : Backlog → In progress → Testing → In review → Done.

### Travail avec Git

- On ne pousse jamais directement sur `main` : chaque tâche est faite sur une branche, puis fusionnée par une **pull request**.
- Une tâche est terminée quand elle a été testée par son développeur, relue et testée par un collègue, puis fusionnée.
- Dans la description de la PR, `Closes #N` ferme automatiquement l'issue correspondante à la fusion.

### Versions

À la fin de chaque sprint, la branche principale est à jour et porte un tag correspondant au sprint :

| Tag | Contenu | semaine |
|---|---|---|
| `v1` | Sprint 0 | s40 -> s42 |
| `v2` | Sprint 1 | s42 -> s45 |
| `v3` | Sprint 2 | s45 -> s47 |
| `v4` | Sprint 3 | s47 -> s50 |
| `release` | Version finale | s50 |
