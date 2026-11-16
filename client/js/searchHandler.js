const API_URL = "/activites/recherche";

/**
 * Recupère les agendas selectionnées depuis index.ejs
 */
function getAgendasSelectionnes() {
    // Permet de relancer quand l'utilisateur selectionne un agenda
    if (!agendaListEl) return [];
    // Recherche dans la div agenda_list de index.ejs 
    const checkboxes = document.querySelectorAll('#agenda_list input[type="checkbox"]:checked');
    return Array.from(checkboxes)
        .map((cb) => cb.value || cb.dataset.id)
        .filter(Boolean);
}

/**
 * Appelle le backend et gère les codes de retour (200, 400, 401, 404)
 */
async function rechercherActivites({ q, start, end, idAgendas = [] }) {
    const params = new URLSearchParams();

    if (q && q.trim() !== "") {
        params.set("q", q.trim());
    }
    if (start) {
        // Conversion explicite en ISO UTC comme attendu par toUtc() côté serveur
        params.set("start", new Date(start).toISOString());
    }
    if (end) {
        params.set("end", new Date(end).toISOString());
    }
    for (const id of idAgendas) {
        params.append("idAgenda", String(id));
    }

    // Conversion en string pour le html
    const queryString = params.toString();
    let url = API_URL;
    if (queryString !== "") {
        // Cree une string du style : "/activites/recherche?q=r%C3%A9union&idAgenda=1"
        url = `${API_URL}?${queryString}`;
    }
    
    // Oblige l'envoi de cookies avec la requête (accesToken)
    const response = await fetch(url, { credentials: "include" });

    if (response.status === 401) {
        window.location.href = "/login";
        return null;
    }

    const data = await response.json();

    if (!response.ok) {
        // Gère 400 ("Période invalide") et 404 ("Agenda introuvable")
        throw new Error(data.erreur || "Erreur lors de la recherche");
    }

    return data;
}

/**
 * Affiche la liste des activités trouvées et permet de naviguer vers leur date
 */
function afficherResultats(activites, container, calendar) {
    container.innerHTML = "";

    if (activites.length === 0) {
        container.innerHTML = "<p>Aucune activité trouvée.</p>";
        container.hidden = false;
        return;
    }

    const liste = document.createElement("ul");

    for (const act of activites) {
        const item = document.createElement("li");
        const debutDate = new Date(act.debut);
        const dateFormatee = debutDate.toLocaleString("fr-FR", {
            dateStyle: "short",
            timeStyle: "short"
        });

        const titre = document.createElement("strong");
        titre.textContent = act.titre;

        const details = document.createElement("span");
        details.textContent = ` — ${dateFormatee}${act.lieu ? ` (${act.lieu})` : ""}`;

        item.append(titre, details);

        // Au clic, on déplace le calendrier directement à la date de l'activité
        if (calendar) {
            item.style.cursor = "pointer";
            item.addEventListener("click", () => {
                calendar.gotoDate(act.debut);
                container.hidden = true;
            });
        }

        liste.appendChild(item);
    }

    container.appendChild(liste);
    container.hidden = false;
}

/**
 * Initialise les écouteurs sur le champ de recherche et les filtres
 */
export function initSearch(calendar = null, agendaListId = "agenda_list") {
    const searchInput = document.getElementById("Recherche");
    const startInput = document.getElementById("search_start");
    const endInput = document.getElementById("search_end");
    const resultsContainer = document.getElementById("search_results");
    const errorContainer = document.getElementById("search_erreur");
    const agendaListEl = document.getElementById(agendaListId);

    if (!searchInput || !resultsContainer) return;

    const lancerRecherche = async () => {
        const q = searchInput.value;
        const start = startInput?.value || "";
        const end = endInput?.value || "";

        if (errorContainer) errorContainer.textContent = "";

        // Si aucun critère n'est renseigné, on masque les résultats
        if (!q.trim() && !start && !end) {
            resultsContainer.hidden = true;
            resultsContainer.innerHTML = "";
            return;
        }

        try {
            const activites = await rechercherActivites({
                q,
                start,
                end,
                idAgendas: getAgendasSelectionnes()
            });

            if (activites !== null) {
                afficherResultats(activites, resultsContainer, calendar);
            }
        } catch (err) {
            resultsContainer.hidden = true;
            if (errorContainer) errorContainer.textContent = err.message;
        }
    };

    searchInput.addEventListener("input", lancerRecherche);
    startInput?.addEventListener("change", lancerRecherche);
    endInput?.addEventListener("change", lancerRecherche);
    agendaListEl?.addEventListener("change", lancerRecherche);
}