# Sprint Review — Sprint 1

Sprint 1 : s42 → s45. Version livrée : tag `v2`. Réunion de revue le 4 novembre 2026.

Ce document compare ce qui a été livré au [backlog du sprint 1](backlog-sprint.md). Le bilan du fonctionnement de l'équipe est dans la [rétrospective](retrospective.md).

---

## 1. Bilan général

L'objectif du sprint était de compléter la gestion des agendas, de sécuriser les comptes, de mettre en place les tests et de commencer les fonctionnalités avancées avec les rendez-vous récurrents.

La plus grosse fonctionnalité du sprint, les **rendez-vous récurrents**, a été livrée avec succès. Les tests automatisés et la sécurité (hachage des mots de passe, protection des routes) sont en place.

Trois fonctionnalités n'ont pas été réalisées (thème clair / sombre, agenda créé automatiquement à l'inscription, suppression d'un agenda) : elles sont **décalées au sprint 2**. Le retard est léger, car ce sont des tâches simples à rattraper.

---

## 2. Stories du backlog

Légende : « Fait » = fait et validé, « Écart » = fait, mais différemment de ce qui était écrit, « Non réalisé » = décalé au sprint 2.

### Épic 1 — Authentification et compte

| Story | État | Remarque |
|---|---|---|
| Mot de passe enregistré de façon sécurisée (haché) | Fait | Hachage avec `crypto.scrypt` et un sel par utilisateur, base vidée |
| Modifier son profil (nom, email, mot de passe) | Fait | Page « Mon profil » ; changer le mot de passe demande l'ancien |

### Épic 2 — Gestion des agendas

| Story | État | Remarque |
|---|---|---|
| Agenda créé automatiquement à l'inscription | Non réalisé | Décalé au sprint 2 |
| Supprimer un agenda (avec confirmation, pas le dernier) | Non réalisé | Décalé au sprint 2 |
| Modifier un agenda (nom, couleur, description) | Fait | Mise à jour du panneau et des couleurs sans recharger la page |

### Épic 3 — Gestion des rendez-vous

| Story | État | Remarque |
|---|---|---|
| Voir la description (et le lieu) d'un rendez-vous dans le calendrier | Fait | Infobulle au survol et vue liste |
| Déplacer ou allonger un rendez-vous par glisser-déposer | Fait | Enregistré en base, retour en arrière si l'enregistrement échoue |
| Rendez-vous récurrents (jour / semaine / mois + date de fin) | Fait | La règle de répétition est stockée, pas une copie de chaque rendez-vous. Tests inclus |

### Épic 4 — Visualisation et interface

| Story | État | Remarque |
|---|---|---|
| Thème clair / sombre | Non réalisé | Décalé au sprint 2 |
| Application adaptée au téléphone (responsive) | Fait | Pages utilisables à 375 px, panneau repliable |

### Tâches techniques

| Tâche | État | Remarque |
|---|---|---|
| Mettre en place `npm test` + tests des routes existantes | Fait | `node:test`, base en mémoire |
| Protéger la branche `main` (pas de fusion sans approbation) | Fait | Fin des fusions automatiques, pipeline de test avant fusion |
| Supprimer `client/js/events.js` | Fait | Rendez-vous d'exemple retirés |

---

## 3. Non réalisé (décalé au sprint 2)

| Story | Prio | Décision |
|---|---|---|
| Thème clair / sombre | Could | Reporté au sprint 2 |
| Agenda créé automatiquement à l'inscription | Must | Reporté au sprint 2 |
| Supprimer un agenda | Must | Reporté au sprint 2 |

---

## 4. Écarts positifs (en plus du backlog)

Plusieurs choses non prévues dans le backlog ont été faites en cours de sprint :

| Ajout | Détail |
|---|---|
| Sécurisation des routes de l'API | La sécurité prévue « plus tard » (#22) est déjà là : routes `/api` réservées aux utilisateurs connectés (`401`), vérification que l'agenda appartient bien à l'utilisateur |
| Découpage des routes | Les routes sont réparties dans `server/routes/`, `server.js` est allégé |
| Script de peuplement de la base | Permet de remplir la base avec des données d'exemple pour tester |
| Passage des pages à EJS | Les pages sont générées avec EJS (`client/views/`), avec un en-tête réutilisable (`partials/header`) |
