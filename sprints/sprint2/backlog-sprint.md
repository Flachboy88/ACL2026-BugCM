# Backlog Sprint 2

Sprint 2 : s45 → s47. Version livrée : tag `v3`.

Objectif du sprint : **solder les stories non réalisées au sprint 1, livrer le partage d'agendas et la recherche d'activités, et renforcer la validation des comptes.**

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
| En tant que visiteur, je veux être averti si mon email est invalide ou si mon mot de passe est trop faible, afin de créer un compte sûr. | S | 2 |
| En tant qu'utilisateur, je veux réinitialiser mon mot de passe si je l'ai oublié, afin de retrouver l'accès à mon compte. | C | 2 (bonus) |

### Épic 2 — Gestion des agendas

| Story | Prio | Sprint |
|---|---|---|
| En tant que nouvel utilisateur, je veux avoir un agenda créé automatiquement à l'inscription, afin de pouvoir ajouter un rendez-vous tout de suite. | M | 2 *(reprise sprint 1)* |
| En tant qu'utilisateur, je veux supprimer un agenda (avec confirmation), afin de retirer un agenda dont je ne me sers plus. | M | 2 *(reprise sprint 1)* |
| En tant qu'utilisateur, je veux partager un de mes agendas avec un autre utilisateur (en lecture ou en écriture) et annuler ce partage, afin de travailler à plusieurs sur le même agenda. | S | 2 |
| En tant qu'utilisateur, je veux pouvoir partager mon agenda au moment de sa création, afin de ne pas avoir à le refaire ensuite. | S | 2 |

### Épic 3 — Gestion des rendez-vous

| Story | Prio | Sprint |
|---|---|---|
| En tant qu'utilisateur, je veux rechercher mes activités depuis une barre de recherche, avec des filtres, afin de retrouver rapidement un rendez-vous. | S | 2 |

### Épic 4 — Visualisation et interface

| Story | Prio | Sprint |
|---|---|---|
| En tant qu'utilisateur, je veux choisir entre un thème clair et un thème sombre, afin d'adapter l'apparence de l'application à mes goûts. | C | 2 *(reprise sprint 1)* |

---

## 3. Critères d'acceptation des stories du sprint 2

### Validation de l'email et du mot de passe

- À l'inscription, l'email doit avoir un format valide, sinon un message d'erreur s'affiche.
- Le mot de passe doit respecter une exigence minimale (par exemple au moins 8 caractères) ; un mot de passe trop faible est refusé avec un message clair.
- La validation est faite **côté serveur** (pas seulement dans le navigateur), pour qu'elle ne soit pas contournable.
- Un email déjà utilisé reste refusé (c'est déjà le cas).

### Mot de passe oublié (bonus)

- Depuis la page de connexion, un lien « Mot de passe oublié » lance une réinitialisation (mécanisme à définir : jeton, question de secours...).
- Story **bonus** : à faire seulement si le reste du sprint est terminé.

### Agenda créé à l'inscription *(reprise sprint 1)*

- Après l'inscription, l'utilisateur a un agenda « Mon agenda » (couleur par défaut), coché et visible dans le panneau.

### Suppression d'un agenda *(reprise sprint 1)*

- Un bouton permet de supprimer un agenda, après une confirmation qui prévient que ses rendez-vous seront aussi supprimés.
- L'agenda et ses rendez-vous disparaissent du panneau et du calendrier sans recharger la page.
- On ne peut pas supprimer son dernier agenda **possédé** (les agendas partagés avec soi ne comptent pas).
- Si l'agenda était partagé, il disparaît aussi chez les personnes avec qui il était partagé, **sans notification** : la suppression se propage automatiquement (`ON DELETE CASCADE` sur la table `partage`).
- Nouvelle route `DELETE /api/agendas/:idAgenda` : `204`, ou `404` si l'agenda n'existe pas ou n'appartient pas à l'utilisateur.

### Partage d'un agenda

- Dans la fenêtre de modification d'un agenda (le crayon), une section « Partage » permet d'ajouter une personne par son email avec un droit (**lecture** ou **écriture**), de voir la liste des partages et d'en annuler un.
- Seul le **propriétaire** peut partager son agenda et gérer ses partages ; lui seul peut modifier ou supprimer l'agenda lui-même.
- L'agenda partagé apparaît dans le panneau de la personne destinataire, avec un repère (« partagé par ... ») ; en **lecture seule**, elle ne peut pas modifier les rendez-vous.
- Droit **lecture** : voir les activités. Droit **écriture** : voir et créer / modifier / supprimer les activités.
- Annuler un partage (ou se retirer soi-même) fait disparaître l'agenda chez la personne.
- Un email inconnu est refusé avec un message ; on ne peut pas se partager un agenda à soi-même ; un partage déjà existant n'est pas dupliqué.
- Nouvelle table `partage` (agenda, utilisateur, droit) et nouvelles routes. La conception (table, migration) est écrite dans `sprints/sprint2/conception.md` avant de coder.

### Partage d'un agenda à la création

- Le formulaire de création d'un agenda a un champ **facultatif** pour partager tout de suite (emails + droit), qui réutilise le composant de partage.
- La création fonctionne avec ce champ vide, et un email inconnu ne bloque pas la création : il est signalé, mais l'agenda est bien créé.

### Recherche d'activités

- Une barre de recherche permet de retrouver ses activités par mots-clés (titre, lieu, description), avec des filtres (par exemple une période ou un agenda).
- Les résultats s'affichent en liste ; cliquer sur un résultat amène au rendez-vous dans le calendrier.
- La recherche ne porte que sur les activités auxquelles l'utilisateur a accès.
- Nouvelle route `GET /api/activites/recherche?...`.

### Thème clair / sombre *(reprise sprint 1)*

- Un bouton dans l'en-tête bascule entre thème clair et thème sombre.
- Le choix est conservé quand on recharge la page.
