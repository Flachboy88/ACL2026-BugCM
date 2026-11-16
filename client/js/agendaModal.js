// Window to edit an agenda (name, color, description), then save the change with the API

const modal = document.getElementById('agenda_modal');
const form = document.getElementById('agenda_modal_form');
const nomInput = document.getElementById('agenda_modal_nom');
const couleurInput = document.getElementById('agenda_modal_couleur');
const descriptionInput = document.getElementById('agenda_modal_description');
const erreurText = document.getElementById('agenda_modal_erreur');
const cancelButton = document.getElementById('agenda_modal_annuler');
const deleteButton = document.getElementById('agenda_modal_supprimer');

// Agenda being edited and callbacks to run once the server accepted the change / the deletion
let editedId = null;
let onSaved = null;
let onDeleted = null;

// Opens the window filled with the current values of the given agenda
// ({ id, title, eventColor, description, droit, parDefaut })
export function openAgendaModal(agenda, onSavedCallback, onDeletedCallback) {
    form.reset();
    erreurText.textContent = '';
    editedId = agenda.id;
    onSaved = onSavedCallback;
    onDeleted = onDeletedCallback;
    // Only the owner can delete an agenda, and never the default one (« Mon agenda »)
    deleteButton.hidden = agenda.parDefaut || agenda.droit !== 'proprietaire';
    nomInput.value = agenda.title;
    couleurInput.value = agenda.eventColor;
    descriptionInput.value = agenda.description ?? '';
    modal.showModal();
}

// Save with PUT; on success the window closes and the caller refreshes the panel and the calendar
form.addEventListener('submit', async function (event) {
    event.preventDefault(); // otherwise the browser reloads the page
    const body = {
        nom: nomInput.value,
        couleur: couleurInput.value,
        description: descriptionInput.value.trim() === '' ? null : descriptionInput.value.trim()
    };

    const reponse = await fetch(`/api/agendas/${editedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const donnees = await reponse.json();

    // On error the window stays open with the server message
    if (!reponse.ok) {
        erreurText.textContent = donnees.erreur;
        return;
    }
    modal.close();
    onSaved(donnees); // { idAgenda, nom, couleur, description }
});

// Delete after confirmation; its activities and shares are deleted too by the server
deleteButton.addEventListener('click', async function () {
    if (!confirm('Supprimer cet agenda et tous ses rendez-vous ?')) {
        return;
    }
    const reponse = await fetch(`/api/agendas/${editedId}`, { method: 'DELETE' });
    if (!reponse.ok) {
        const donnees = await reponse.json();
        erreurText.textContent = donnees.erreur;
        return;
    }
    modal.close();
    onDeleted();
});

// Cancel closes without saving (the Escape key does the same)
cancelButton.addEventListener('click', function () {
    modal.close();
});
