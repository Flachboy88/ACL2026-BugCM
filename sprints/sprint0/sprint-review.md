# Sprint Review — Sprint 0

Sprint 0 : du 1er au 15 octobre 2026 (s40 → s42). Version livrée : tag `v1`.

Ce document compare ce qui a été livré au [backlog du sprint 0](backlog-sprint.md). Le bilan du fonctionnement de l'équipe est dans la [rétrospective](retrospective.md).

---

## 1. Bilan général

Toutes les stories prévues au sprint 0 sont livrées et fusionnées sur `main`. L'application permet de créer un compte, de se connecter, de créer des agendas et de gérer des rendez-vous affichés dans un calendrier.

Deux points sont livrés différemment de ce qui était écrit dans le backlog (voir section 3), et une partie de la sécurité prévue pour plus tard a déjà été faite (section 4).

---

## 2. Stories du backlog

Légende : « Fait » = fait et validé, « Écart » = fait, mais différemment de ce qui était écrit dans le backlog.

### Épic 1 — Authentification

| Story | État | Remarque |
|---|---|---|
| Créer un compte (identifiant + mot de passe) | Fait | Nom, email, mot de passe et confirmation. L'utilisateur est connecté directement après l'inscription |
| S'identifier | Fait | Connexion par email + mot de passe |
| Fermer sa session | Fait | Bouton de déconnexion dans l'en-tête, retour à la page de connexion |

Des **messages d'erreur** s'affichent sur les formulaires de connexion et d'inscription (champs manquants, identifiants incorrects, email déjà pris, mots de passe différents).

### Épic 2 — Gestion des agendas

| Story | État | Remarque |
|---|---|---|
| Créer un agenda (nom, couleur, description facultative) | Écart | Nom et couleur depuis le panneau de gauche. La description existe en base mais n'est pas encore dans le formulaire |
| Voir la liste de mes agendas | Fait | Liste dans le panneau de gauche, chaque agenda avec sa couleur |

### Épic 3 — Gestion des rendez-vous

| Story | État | Remarque |
|---|---|---|
| Ajouter / modifier un rendez-vous | Fait | Sélection d'un créneau → fenêtre de création. Clic sur un rendez-vous → fenêtre de modification (titre, début, fin, agenda, lieu, description) |
| Supprimer un rendez-vous avec confirmation | Écart | Fait, mais avec un bouton « Supprimer » dans la fenêtre du rendez-vous au lieu du clic droit prévu (voir section 3) |

### Épic 4 — Visualisation

| Story | État | Remarque |
|---|---|---|
| Liste chronologique des rendez-vous des agendas sélectionnés | Fait | Vue « liste » de FullCalendar |
| Afficher plusieurs agendas en même temps, chacun avec sa couleur | Fait | Cases à cocher dans le panneau de gauche |
| Calendrier affiché semaine par semaine | Fait | Vue semaine par défaut, avec aussi les vues jour et mois |

---

## 3. Écarts par rapport au backlog

| Écart | Décision |
|---|---|
| Suppression d'un rendez-vous : bouton « Supprimer » dans la fenêtre du rendez-vous au lieu d'un clic droit | Gardé : un clic droit n'est pas découvrable par l'utilisateur et ne marche pas sur téléphone |
| La description d'un rendez-vous est enregistrée et modifiable, mais **pas affichée** dans le calendrier (seul le titre est visible) | Reporté au sprint 1 |
| La description d'un agenda n'est pas dans le formulaire de création | Reporté au sprint 1, avec la modification d'un agenda |


