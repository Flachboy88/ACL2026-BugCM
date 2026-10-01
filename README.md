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

Prérequis :

- [Node.js](https://nodejs.org/) **20 ou plus** (avec npm) ;
- [Docker](https://www.docker.com/) avec Docker Compose, **lancé** (sous Windows : Docker Desktop doit être ouvert).

```bash
npm install && npm start
```

`npm start` démarre la base de données (conteneur Docker), met à jour ses tables, puis lance le serveur sur le port **3000** :

- en local : http://localhost:3000
- depuis une autre machine du réseau local : `http://<IP-de-la-machine-hôte>:3000`

Plusieurs clients peuvent utiliser l'application simultanément.

Installation de Docker, commandes utiles et dépannage : voir [docs/base-de-donnees.md](docs/base-de-donnees.md).

---

## Architecture

Un **serveur unique** (Express) assure deux rôles, sur des routes distinctes :

| Rôle | Préfixe de route | Description |
|---|---|---|
| API | `/api/...` | Fournit les données et opérations de l'application |
| Pages Web | `/` | Sert le client (HTML, CSS, JS) depuis le dossier `client/` |

```
.
├── client/                 # Client Web : pages HTML, styles CSS, scripts JS
├── server/
│   ├── server.js           # Point d'entrée : routes API + pages Web
│   ├── database.js         # Connexion à PostgreSQL
│   └── migrations.js       # Application des migrations au démarrage
├── database/
│   └── migrations/         # Fichiers SQL numérotés qui créent / modifient les tables
├── docs/                   # Documentation de l'équipe
├── sprints/                # Documents Scrum, un dossier par sprint
├── docker-compose.yml      # Conteneur PostgreSQL
├── .env.example            # Valeurs de connexion à la base (à copier en .env si besoin)
└── package.json
```

### Technologies

| Partie | Choix |
|---|---|
| Serveur | Node.js + Express 5 |
| Client | HTML, CSS et JavaScript, sans framework |
| Affichage du calendrier | FullCalendar (en cours d'intégration) |
| Base de données | PostgreSQL 17 dans un conteneur Docker |

### Persistance des données

Les données sont stockées dans PostgreSQL, dans un volume Docker : un redémarrage du serveur, du conteneur ou de la machine n'entraîne aucune perte d'information.

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

| Tag | Contenu |
|---|---|
| `v1` | Sprint 0 |
| `v2` | Sprint 1 |
| ... | ... |
| `release` | Version finale |
