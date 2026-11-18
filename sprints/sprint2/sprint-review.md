# Sprint Review — Sprint 2

Sprint 2 : s45 → s47. Version livrée : tag `v3`. Réunion de revue le 18 novembre 2026.

Ce document compare ce qui a été livré au [backlog du sprint 2](backlog-sprint.md). Le bilan du fonctionnement de l'équipe est dans la [rétrospective](retrospective.md).

---

## 1. Bilan général

L'objectif du sprint était de solder les stories non réalisées au sprint 1, de livrer le partage d'agendas et la recherche d'activités, et de renforcer la validation des comptes.

**Toutes les stories du backlog ont été réalisées**, y compris les trois reprises du sprint 1 et la story bonus (mot de passe oublié). Le **partage d'agendas fonctionne** de bout en bout (backend, droits lecture / écriture, partage à la création).

Quelques ajouts non prévus ont aussi été faits (fenêtre modale de création d'agenda, correctifs responsive, corrections de plantages au lancement) : ils sont à vérifier pendant la revue.

---

## 2. Stories du backlog

Légende : « Fait » = fait et validé, « Écart » = fait, mais différemment de ce qui était écrit, « Non réalisé » = décalé au sprint 3.

### Épic 1 — Authentification et compte

| Story | État | Remarque |
|---|---|---|
| Être averti si l'email est invalide ou le mot de passe trop faible | Fait | Validation par regex côté serveur, tests ajoutés (#105) |
| Réinitialiser son mot de passe oublié (bonus) | Fait | Lien envoyé par email avec un jeton, page de réinitialisation (#98). Changer son mot de passe une fois connecté demande l'ancien (#101) |

### Épic 2 — Gestion des agendas

| Story | État | Remarque |
|---|---|---|
| Agenda créé automatiquement à l'inscription *(reprise sprint 1)* | Fait | Agenda par défaut, non supprimable (migration `007_ajouter_par_defaut_a_agenda`, #107) |
| Supprimer un agenda (avec confirmation) *(reprise sprint 1)* | Fait | Route `DELETE /api/agendas/:idAgenda`, suppression en cascade des activités et des partages, tests inclus (#107) |
| Partager un agenda (lecture / écriture) et annuler ce partage | Écart | Backend complet : table `partage`, routes `POST` / `GET` / `DELETE`, droits vérifiés (#102). Côté interface, on partage à la création, mais la liste des partages existants et leur annulation ne sont pas encore dans la fenêtre de modification : repris au sprint 3 |
| Partager son agenda au moment de sa création | Fait | Champ facultatif dans le formulaire de création (#103) |

### Épic 3 — Gestion des rendez-vous

| Story | État | Remarque |
|---|---|---|
| Rechercher ses activités avec une barre de recherche et des filtres | Fait | Route `GET /api/activites/recherche` sur les agendas accessibles (#106), recherche dans les agendas sélectionnés, résultats en liste déroulante (#108). Tests inclus |

### Épic 4 — Visualisation et interface

| Story | État | Remarque |
|---|---|---|
| Thème clair / sombre *(reprise sprint 1)* | Fait | PR #113, correctifs en cours avant fusion |

---

## 3. Non réalisé (décalé au sprint 3)

Aucune story n'est décalée. Seule la **gestion des partages existants dans l'interface** (voir la liste, couper un partage) reste à faire : elle devient une story du sprint 3.

---

## 4. Écarts positifs (en plus du backlog)

| Ajout | Détail |
|---|---|
| Fenêtre modale de création d'agenda | Le formulaire de création est dans une modale, ouverte par un bouton (#112) |
| Correctifs responsive | Plusieurs corrections d'affichage sur téléphone (#110) |
| Correction de plantages au lancement | Création automatique du dossier `data` et gestion d'erreur au démarrage (#99, #100) |
| Accès depuis un autre appareil du réseau | Le serveur est joignable depuis un autre appareil du réseau local |
| README à jour | Partage, réinitialisation du mot de passe et recherche documentés |
