import database from "./database.js";

// Which agendas a user can access, and with which right.
// This is the single place that knows the access rules: the agendas route, the
// activites routes and the search (#94) all rely on it instead of rewriting the query.

// All agendas a user can see: their own (right 'proprietaire') plus the ones shared with them.
export function agendasAccessibles(idUtilisateur) {
    return database.prepare(
        "SELECT a.*, 'proprietaire' AS droit FROM agenda a WHERE a.id_utilisateur = ? " +
        "UNION ALL " +
        "SELECT a.*, p.droit AS droit FROM agenda a " +
        "JOIN partage p ON p.id_agenda = a.id_agenda WHERE p.id_utilisateur = ? " +
        "ORDER BY nom"
    ).all(idUtilisateur, idUtilisateur);
}

// The right a user has on one agenda: 'proprietaire', 'ecriture', 'lecture', or null if no access.
export function droitSurAgenda(idUtilisateur, idAgenda) {
    const agenda = database.prepare(
        "SELECT id_utilisateur FROM agenda WHERE id_agenda = ?"
    ).get(idAgenda);
    if (agenda === undefined) {
        return null;
    }
    if (agenda.id_utilisateur === idUtilisateur) {
        return "proprietaire";
    }
    const partage = database.prepare(
        "SELECT droit FROM partage WHERE id_agenda = ? AND id_utilisateur = ?"
    ).get(idAgenda, idUtilisateur);
    return partage === undefined ? null : partage.droit;
}

// True when the right lets the user create, modify or delete activities (not read-only).
export function peutEcrire(droit) {
    return droit === "proprietaire" || droit === "ecriture";
}
