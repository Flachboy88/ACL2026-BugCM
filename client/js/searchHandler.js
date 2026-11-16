const API_URL = "/api/activites/recherche";

/**
 * Recupère les agendas selectionnées depuis index.ejs
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
        // Gère 400 ("Période invalide") et 404 ("Agenda introuvable 1")
        throw new Error(data.erreur || "Erreur lors de la recherche");
    }

    return data;
}

/**
 * Affiche la liste des activités trouvées dans le menu déroulant
 */
function afficherResultats(activites, selectEl, wrapperEl) {
    selectEl.innerHTML = "";

    if (activites.length === 0) {
        const vide = document.createElement("option");
        vide.value = "";
        vide.textContent = "Aucune activité trouvée";
        selectEl.appendChild(vide);
        wrapperEl.hidden = false;
        return;
    }

    // Option par défaut pour que la sélection du 1er résultat déclenche bien "change"
    const placeholder = document.createElement("option");
    placeholder.value = "";

    if (activites.length != 1 ){
        placeholder.textContent = `${activites.length} activité(s) trouvée(s) — choisir...`;
        selectEl.appendChild(placeholder);
    }

    for (const act of activites) {
        const item = document.createElement("option");
        const debutDate = new Date(act.debut);
        const dateFormatee = debutDate.toLocaleString("fr-FR", {
            dateStyle: "short",
            timeStyle: "short"
        });

        item.value = act.debut;
        item.textContent = `${act.titre} — ${dateFormatee}${act.lieu ? ` (${act.lieu})` : ""}`;
        selectEl.appendChild(item);
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
    const resultsSelect = document.getElementById("search_results");
    const resultsWrapper = document.getElementById("search_results_wrapper");
    const errorContainer = document.getElementById("search_erreur");
    const agendaListEl = document.getElementById(agendaListId);

    if (!searchInput || !resultsSelect || !resultsWrapper) return;

    // Navigation vers la date choisie dans le dropdown
    resultsSelect.addEventListener("change", () => {
        if (!resultsSelect.value) return;
        if (calendar) {
            calendar.gotoDate(resultsSelect.value);
        }
        resultsWrapper.hidden = true;
    });

    const lancerRecherche = async () => {
        const q = searchInput.value;
        const start = startInput?.value || "";
        const end = endInput?.value || "";

        if (errorContainer) errorContainer.textContent = "";

        if (!q.trim() && !start && !end) {
            resultsWrapper.hidden = true;
            resultsSelect.innerHTML = "";
            return;
        }

        const totalAgendas = agendaListEl?.querySelectorAll(".agenda").length ?? 0;
        const idAgendas = getAgendasSelectionnes(agendaListEl);

        if (totalAgendas > 0 && idAgendas.length === 0) {
            afficherResultats([], resultsSelect, resultsWrapper);
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
                afficherResultats(activites, resultsSelect, resultsWrapper);
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