# Backlog Sprint 3

Sprint 3 : s47 → s**?**. Version livrée : tag `v4`.

Objectif du sprint : **livrer l'import / export d'agendas au format JSON, et donner à l'utilisateur la main sur ses partages (accepter, refuser, voir, couper).**

---

## 1. Conventions

| Champ | Signification |
|---|---|
| **Priorité** | MoSCoW : **M**ust / **S**hould / **C**ould / **W**on't (pas maintenant) |
| **Sprint** | Sprint prévisionnel (indicatif, revu à chaque sprint planning) |

**Rôles :** *Visiteur* (non connecté), *Utilisateur* (connecté).

**Définition de « terminé »** : la story respecte ses critères d'acceptation (section 3), ses tests passent (`npm test`), elle a été relue et testée par 2 collègues dans la PR, puis fusionnée **par un membre qui n'a pas encore fusionné de PR** (action de la [rétrospective du sprint 2](../sprint2/retrospective.md)).

**Répartition :** le backend de l'import / export est pris par les membres qui ont eu le moins de charge au sprint 2.

---

## 2. Stories par épic

### Épic 2 — Gestion des agendas

| Story | Prio | Sprint |
|---|---|---|
| En tant qu'utilisateur, je veux recevoir les partages dans une boîte de réception et les accepter ou les refuser, afin de ne pas voir apparaître un agenda sans mon accord. | S | 3 |
| En tant que propriétaire d'un agenda, je veux voir avec qui il est partagé, changer le droit d'une personne ou couper son partage, afin de garder le contrôle sur qui accède à mon agenda. | S | 3 *(reste du sprint 2)* |
| En tant qu'utilisateur, je veux gérer une liste d'amis, afin de partager un agenda sans retaper leur email. | C | 3 (bonus) |

### Épic 3 — Gestion des rendez-vous

| Story | Prio | Sprint |
|---|---|---|
| En tant qu'utilisateur, je veux créer un événement « réunion » et y inviter d'autres utilisateurs, afin qu'il apparaisse aussi dans leur calendrier. | C | 3 (bonus) |

### Épic 5 — Import / export *(nouveau)*

| Story | Prio | Sprint |
|---|---|---|
| En tant qu'utilisateur, je veux exporter un agenda (personnel ou partagé avec moi) dans un fichier JSON, afin d'en garder une sauvegarde ou de le transférer. | M | 3 |
| En tant qu'utilisateur, je veux importer un agenda depuis un fichier JSON, afin de récupérer une sauvegarde ou un agenda exporté par quelqu'un d'autre. | M | 3 |

### Épic 4 — Visualisation et interface

| Story | Prio | Sprint |
|---|---|---|
| En tant qu'utilisateur, je veux voir l'icône du site dans l'onglet du navigateur, afin de le retrouver facilement parmi mes onglets. | C | 3 |

### Tâches techniques

| Tâche | Prio | Sprint |
|---|---|---|
| Servir le site en HTTPS | S | 3 |
| Écrire le format JSON d'import / export dans `sprints/sprint3/conception.md` avant de coder | M | 3 |

---

## 3. Critères d'acceptation des stories du sprint 3

### Format JSON (conception)

- Le format du fichier est décrit dans `sprints/sprint3/conception.md` **avant** de coder l'import et l'export, pour que les deux parties soient faites en parallèle sur la même base.
- Le fichier contient l'agenda (nom, couleur, description) et ses activités (titre, dates, lieu, description, **règle de récurrence**), plus un numéro de version du format.
- Il ne contient **aucune donnée personnelle des autres utilisateurs** (pas d'emails, pas d'identifiants internes, pas de partages).

### Export d'un agenda

- Un bouton « Exporter » sur un agenda télécharge un fichier `.json` nommé d'après l'agenda.
- On peut exporter ses propres agendas **et** ceux partagés avec soi (lecture ou écriture).
- Les rendez-vous récurrents sont exportés sous forme de règle, pas comme une copie de chaque occurrence.
- Nouvelle route `GET /api/agendas/:idAgenda/export` : `200` avec le JSON, ou `404` si l'agenda n'existe pas ou n'est pas accessible.

### Import d'un agenda

- Un bouton « Importer » permet de choisir un fichier `.json`, qui crée un **nouvel agenda** appartenant à l'utilisateur, avec toutes ses activités.
- L'agenda importé apparaît dans le panneau et le calendrier sans recharger la page.
- Un fichier invalide (pas du JSON, mauvais format, champs manquants, dates incorrectes) est refusé avec un message clair, et **rien n'est créé** (pas d'agenda à moitié importé).
- Un fichier exporté puis réimporté redonne le même agenda (test aller-retour).
- Nouvelle route `POST /api/agendas/import` : `201`, ou `400` si le fichier est invalide.

### Boîte de réception des partages

- Quand un agenda est partagé avec quelqu'un, le partage est **en attente** : l'agenda n'apparaît pas encore dans son panneau.
- Un indicateur dans l'en-tête signale les partages en attente ; une boîte de réception les liste (agenda, propriétaire, droit) avec « Accepter » et « Refuser ».
- Accepter fait apparaître l'agenda dans le panneau ; refuser supprime le partage.
- Le propriétaire voit l'état de chaque partage (en attente / accepté).
- Nouvelle colonne d'état sur la table `partage` (nouvelle migration) ; les partages existants passent à « accepté ».

### Voir et gérer les partages d'un agenda

- Dans la fenêtre de modification d'un agenda (le crayon), le propriétaire voit la liste des personnes avec qui il est partagé, avec leur droit.
- Il peut changer le droit (lecture / écriture) ou couper un partage ; l'agenda disparaît alors chez la personne.
- L'agenda partagé apparaît chez la personne destinataire avec un repère « partagé par ... ».
- Les routes existent déjà (`GET` / `POST` / `DELETE /api/agendas/:idAgenda/partages`) : la story est surtout côté interface.

### Favicon

- Une icône s'affiche dans l'onglet sur toutes les pages (connexion, inscription, calendrier, profil), via l'en-tête commun.

### Serveur en HTTPS (tâche technique)

- Le site est accessible en `https://`, et l'accès en `http://` redirige vers `https://`.
- Le certificat et la clé ne sont **pas** versionnés dans Git ; la façon de les générer est expliquée dans le README.
- Les tests (`npm test`) passent toujours.

### Liste d'amis (bonus)

- Un utilisateur peut ajouter un ami par son email et le retirer.
- Au moment de partager un agenda, on peut choisir un ami dans une liste au lieu de taper son email.
- Story **bonus** : à faire seulement si le reste du sprint est terminé.

### Événement « réunion » (bonus)

- À la création d'un rendez-vous, on peut inviter d'autres utilisateurs par leur email.
- Le rendez-vous apparaît dans le calendrier des invités, en lecture seule.
- Story **bonus** : à faire seulement si le reste du sprint est terminé. Sa conception est à écrire avant de coder (nouvelle table d'invitations).
