# Projet Agenda — Master Ingénierie Logicielle
 
Application Web de gestion d'agendas, basée sur une architecture client-serveur. Projet réalisé en équipe selon la méthode Scrum (sprints de 2 semaines).
 
## Équipe
 
| Membre |
|---|
| MINAROLI Corentin |
| BURNEL Mathias |
| VERGNAUD Ryan |
| SCHMITT Martin |
| HENRY Romaric |
| SIGNORINO-GELO Matteo |
 
Nom de l'équipe : BugCM
 
---
 
## Lancement
 
Prérequis : [Node.js](https://nodejs.org/) (version `<à préciser>`) et npm.
 
```bash
npm install && npm start
```
 
Le serveur écoute sur le port **3000**. L'application est accessible à l'adresse :
 
- en local : http://localhost:3000
- depuis une autre machine du réseau local : `http://<IP-de-la-machine-hôte>:3000`
Plusieurs clients peuvent utiliser l'application simultanément.
 
---
 
## Architecture
 
Un **serveur unique** assure deux rôles, sur des routes distinctes :
 
| Rôle | Préfixe de route | Description |
|---|---|---|
| Pages Web | `/` | Sert le client (HTML, CSS, JS) |
| API | `/api/...` | Fournit les données et opérations de l'application |
 
```
.
├── server/          # Code du serveur (routes Web + API)
├── client/          # Client Web (pages, scripts, styles)
├── data/            # Fichiers de sauvegarde (persistance)
├── sprints/         # Documents Scrum par sprint
│   ├── sprint-1/
│   ├── sprint-2/
│   └── ...
├── package.json
└── README.md
```
 
> Arborescence indicative, à ajuster selon l'implémentation.
 
### Technologies
 
- Serveur : `<à compléter — ex. Node.js + Express>`
- Client : `<à compléter>`
- Persistance : `<à compléter — fichiers JSON / base de données>`
### Persistance des données
 
Les données sont conservées d'une session à l'autre : un redémarrage du serveur n'entraîne aucune perte d'information. Elles sont stockées dans `<à compléter — ex. data/*.json>`.
 
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
- [ ] Import / export d'un agenda (format : `<à compléter — ex. JSON, iCalendar .ics>`)
### Fonctionnalités supplémentaires
 
- `<idées novatrices à ajouter>`
---
 
## API
 
| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Connexion |
| `POST` | `/api/auth/logout` | Déconnexion |
| `GET` | `/api/agendas` | Liste des agendas de l'utilisateur |
| `POST` | `/api/agendas` | Créer un agenda |
| `GET` | `/api/agendas/:id/events` | Rendez-vous d'un agenda |
| `POST` | `/api/agendas/:id/events` | Ajouter un rendez-vous |
| `PUT` | `/api/events/:id` | Modifier un rendez-vous |
| `DELETE` | `/api/events/:id` | Supprimer un rendez-vous |
 
> Routes indicatives, à mettre à jour au fil des sprints.
 
---
 
## Méthodologie (Scrum)
 
Le projet est organisé en sprints de 2 semaines. Pour chaque sprint, un dossier `sprints/sprint-N/` contient :
 
- `backlog.md` — backlog du sprint courant
- `conception.md` — conception envisagée pour le sprint courant
- `revue.md` — revue du sprint précédent (fonctionnalités réalisées et validées, ou non)
- `retrospective.md` — rétrospective du sprint précédent (ce qui a bien ou mal fonctionné, décisions pour le sprint courant)
### Versions
 
À la fin de chaque sprint, la branche principale est à jour et porte un tag correspondant au sprint :
 
| Tag | Contenu |
|---|---|
| `v1` | Sprint 0 |
| `v2` | Sprint 1 |
| ... | ... |
| `release` | Version finale |
 
---
