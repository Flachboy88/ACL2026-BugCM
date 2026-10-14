# Backlog Sprint 1

Sprint 1 : s42 → s45. Version livrée : tag `v2`.

Objectif du sprint : **compléter la gestion des agendas, sécuriser les comptes, mettre en place les tests et commencer les fonctionnalités avancées avec les rendez-vous récurrents.**

---

## 1. Conventions

| Champ | Signification |
|---|---|
| **Priorité** | MoSCoW : **M**ust / **S**hould / **C**ould / **W**on't (pas maintenant) |
| **Sprint** | Sprint prévisionnel (indicatif, revu à chaque sprint planning) |

**Rôles :** *Visiteur* (non connecté), *Utilisateur* (connecté).

**Définition de « terminé »** : la story respecte ses critères d'acceptation (section 3), ses tests passent (`npm test`), elle a été relue et testée par 2 collègues dans la PR, puis fusionnée.

---

## 2. Stories par épic

### Épic 1 — Authentification et compte

| Story | Prio | Sprint |
|---|---|---|
| En tant qu'utilisateur, je veux que mon mot de passe soit enregistré de façon sécurisée (haché), afin que mon compte reste protégé même si la base de données est récupérée. | M | 1 |
| En tant qu'utilisateur, je veux modifier mon profil (nom, email, mot de passe), afin de garder mes informations à jour. | C | 1 |

### Épic 2 — Gestion des agendas

| Story | Prio | Sprint |
|---|---|---|
| En tant que nouvel utilisateur, je veux avoir un agenda créé automatiquement à l'inscription, afin de pouvoir ajouter un rendez-vous tout de suite. | M | 1 |
| En tant qu'utilisateur, je veux supprimer un agenda (avec confirmation), afin de retirer un agenda dont je ne me sers plus. | M | 1 |
| En tant qu'utilisateur, je veux modifier un agenda (nom, couleur, description), afin de le renommer ou de corriger ses informations. | S | 1 |

### Épic 3 — Gestion des rendez-vous

| Story | Prio | Sprint |
|---|---|---|
| En tant qu'utilisateur, je veux voir la description d'un rendez-vous dans le calendrier, afin de connaître ses détails sans ouvrir la fenêtre de modification. | S | 1 |
| En tant qu'utilisateur, je veux déplacer ou allonger un rendez-vous en le faisant glisser dans le calendrier, afin de le replanifier rapidement. | S | 1 |
| En tant qu'utilisateur, je veux créer un rendez-vous qui se répète (chaque jour, chaque semaine, chaque mois) jusqu'à une date de fin, afin de ne pas le saisir plusieurs fois. | S | 1 |

### Épic 4 — Visualisation et interface

| Story | Prio | Sprint |
|---|---|---|
| En tant qu'utilisateur, je veux choisir entre un thème clair et un thème sombre, afin d'adapter l'apparence de l'application à mes goûts. | C | 1 |
| En tant qu'utilisateur, je veux que l'application s'adapte à l'écran de mon téléphone (responsive), afin de consulter et modifier mes agendas en déplacement. | S | 1 |

### Tâches techniques

| Tâche | Prio | Sprint |
|---|---|---|
| Mettre en place les tests automatisés (`npm test`) et écrire les tests des routes existantes (connexion, inscription, agendas, rendez-vous). | M | 1 |
| Protéger la branche `main` sur GitHub : fusion impossible sans l'approbation d'un autre membre. | M | 1 |
| Supprimer le fichier `client/js/events.js` (rendez-vous d'exemple qui ne servent plus). | C | 1 |

---

## 3. Critères d'acceptation des stories du sprint 1

### Mot de passe haché

- Le mot de passe est haché à l'inscription avec `crypto.scrypt` (module intégré à Node.js : pas de dépendance à installer) et un sel différent pour chaque utilisateur.
- La connexion compare le hachage, plus le mot de passe en clair.
- Aucun mot de passe en clair n'apparaît dans la base.
- Les comptes déjà créés au sprint 0 ne sont pas conservés : on vide la base (`npm run db:reset`).

### Profil (Could)

- Une page « Mon profil » permet de changer le nom, l'email et le mot de passe.
- Changer le mot de passe demande l'ancien mot de passe.
- Un email déjà utilisé par un autre compte est refusé avec un message d'erreur.
- À faire **après** la story « mot de passe haché ».

### Agenda créé à l'inscription

- Après l'inscription, l'utilisateur a un agenda « Mon agenda » (couleur par défaut), coché et visible dans le panneau.

### Suppression d'un agenda

- Un bouton permet de supprimer un agenda, après une confirmation qui prévient que ses rendez-vous seront aussi supprimés.
- L'agenda et ses rendez-vous disparaissent du panneau et du calendrier sans recharger la page.
- On ne peut pas supprimer son dernier agenda (pour toujours avoir au moins un agenda).
- Nouvelle route `DELETE /api/agendas/:idAgenda` : `204`, ou `404` si l'agenda n'existe pas ou appartient à un autre utilisateur.

### Modification d'un agenda

- On peut changer le nom, la couleur et la description d'un agenda.
- La description peut aussi être saisie à la création (elle manque dans le formulaire actuel).
- Le panneau et les couleurs du calendrier se mettent à jour sans recharger la page.
- Nouvelle route `PUT /api/agendas/:idAgenda`.

### Description d'un rendez-vous

- La description (et le lieu) d'un rendez-vous sont visibles dans le calendrier, par exemple dans une infobulle au survol et dans la vue liste.
- Un rendez-vous sans description s'affiche comme aujourd'hui.

### Glisser-déposer

- On peut déplacer un rendez-vous à un autre créneau et changer sa durée en tirant sur son bord.
- La modification est enregistrée en base (route `PUT /api/activites/:idActivite` existante).
- Si l'enregistrement échoue, le rendez-vous revient à sa place et un message d'erreur s'affiche.

### Rendez-vous récurrents

- Dans la fenêtre d'un rendez-vous, on peut choisir une répétition : aucune, chaque jour, chaque semaine, chaque mois, et une date de fin.
- On enregistre la **règle** de répétition, pas une copie de chaque rendez-vous (voir la conception du sprint 0).
- Les répétitions s'affichent dans toutes les vues du calendrier.
- Modifier ou supprimer un rendez-vous récurrent agit sur toute la série (modifier une seule occurrence est prévu plus tard).
- La conception (table ou colonnes à ajouter, migration) est écrite dans `sprints/sprint1/conception.md` avant de coder.

### Thème clair / sombre (Could)

- Un bouton dans l'en-tête bascule entre thème clair et thème sombre.
- Le choix est conservé quand on recharge la page.

### Responsive (téléphone)

- Toutes les pages (connexion, inscription, calendrier) sont utilisables sur un écran de 375 px de large, sans défilement horizontal.
- Sur petit écran, le panneau des agendas se replie derrière un bouton et le calendrier s'ouvre en vue jour ou liste.
- Les fenêtres (création d'un rendez-vous, d'un agenda) tiennent dans l'écran.
- Vérifié avec le mode « appareil mobile » des outils de développement du navigateur, et sur au moins un vrai téléphone.

### Tests automatisés

- `npm test` lance les tests avec `node:test` (intégré à Node.js 22 : rien à installer).
- Les routes existantes ont au moins un test pour le cas normal et un test pour un cas d'erreur.
- Une courte explication pour écrire un test est ajoutée dans `docs/`, pour que toute l'équipe puisse s'y mettre.
- Cette tâche est faite **en premier** : les stories suivantes arrivent avec leurs tests.

