const API_URL = "/api/activites/recherche";

/**
 * Récupère les IDs des agendas sélectionnés dans le panneau latéral
 */
function getAgendasSelectionnes(agendaListEl) {
    if (!agendaListEl) return [];

    const ids = [];
    agendaListEl.querySelectorAll(".agenda").forEach((div) => {
        const cb = div.querySelector('input[type="checkbox"]');
        if (cb && cb.checked && /^\d+$/.test(div.id)) {
            ids.push(div.id);
        }
    });
    return ids;
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
        params.set("start", new Date(start).toISOString());
    }
    if (end) {
        params.set("end", new Date(end).toISOString());
    }
    for (const id of idAgendas) {
        params.append("idAgenda", String(id));
    }

    const queryString = params.toString();
    let url = API_URL;
    if (queryString !== "") {
        url = `${API_URL}?${queryString}`;
    }

    const response = await fetch(url, { credentials: "include" });

    if (response.status === 401) {
        window.location.href = "/login";
        return null;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.erreur || "Erreur lors de la recherche");
    }

    return data;
}

/**
 * Déplace la vue du calendrier sur la date et l'heure d'une activité
 */
function naviguerVersActivite(calendar, debutIso) {
    if (!calendar) return;

    calendar.gotoDate(debutIso);

    const debut = new Date(debutIso);
    const heures = String(debut.getHours()).padStart(2, "0");
    const minutes = String(debut.getMinutes()).padStart(2, "0");

    // Exécuté après datesSet() de calendar.js pour ne pas être écrasé par l'heure actuelle
    setTimeout(() => {
        calendar.scrollToTime(`${heures}:${minutes}:00`);
    }, 0);
}

/**
 * Affiche la liste des activités trouvées et branche la navigation au clic
 */
function afficherResultats(activites, listEl, wrapperEl, calendar) {
    listEl.innerHTML = "";

    if (activites.length === 0) {
        const vide = document.createElement("li");
        vide.textContent = "Aucune activité trouvée";
        listEl.appendChild(vide);
        wrapperEl.hidden = false;
        return;
    }

    for (const act of activites) {
        const item = document.createElement("li");
        const debutDate = new Date(act.debut);
        const dateFormatee = debutDate.toLocaleString("fr-FR", {
            dateStyle: "short",
            timeStyle: "short"
        });

        const titre = document.createElement("strong");
        titre.textContent = act.titre;

        let texteDetails = ` — ${dateFormatee}`;
        if (act.lieu) {
            texteDetails += ` (${act.lieu})`;
        }

        item.append(titre, document.createTextNode(texteDetails));
        item.style.cursor = "pointer";

        item.addEventListener("click", () => {
            naviguerVersActivite(calendar, act.debut);
            wrapperEl.hidden = true;
        });

        listEl.appendChild(item);
    }

    wrapperEl.hidden = false;
}

/**
 * Initialise les écouteurs sur le champ de recherche et les filtres
 */
export function initSearch(calendar = null, agendaListId = "agenda_list") {
    const searchInput = document.getElementById("Recherche");
    const startInput = document.getElementById("search_start");
    const endInput = document.getElementById("search_end");
    const resultsList = document.getElementById("search_results");
    const resultsWrapper = document.getElementById("search_results_wrapper");
    const errorContainer = document.getElementById("search_erreur");
    const agendaListEl = document.getElementById(agendaListId);

    if (!searchInput || !resultsList || !resultsWrapper) return;

    const lancerRecherche = async () => {
        const q = searchInput.value;
        const start = startInput?.value || "";
        const end = endInput?.value || "";

        if (errorContainer) errorContainer.textContent = "";

        if (!q.trim() && !start && !end) {
            resultsWrapper.hidden = true;
            resultsList.innerHTML = "";
            return;
        }

        const totalAgendas = agendaListEl?.querySelectorAll(".agenda").length ?? 0;
        const idAgendas = getAgendasSelectionnes(agendaListEl);

        if (totalAgendas > 0 && idAgendas.length === 0) {
            afficherResultats([], resultsList, resultsWrapper, calendar);
            return;
        }

        try {
            const activites = await rechercherActivites({
                q,
                start,
                end,
                idAgendas
            });

            if (activites !== null) {
                afficherResultats(activites, resultsList, resultsWrapper, calendar);
            }
        } catch (err) {
            resultsWrapper.hidden = true;
            if (errorContainer) errorContainer.textContent = err.message;
        }
    };

    searchInput.addEventListener("input", lancerRecherche);
    startInput?.addEventListener("change", lancerRecherche);
    endInput?.addEventListener("change", lancerRecherche);
    agendaListEl?.addEventListener("change", lancerRecherche);
}