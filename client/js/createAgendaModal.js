// Window to create an agenda (name, color, description)

const modal = document.getElementById('create_agenda_modal');
const form = document.getElementById('create_agenda_form');
const cancelButton = document.getElementById('create_agenda_modal_annuler');
const erreur = document.getElementById('create_agenda_erreur');
const email = document.getElementById('share_agenda');

let onCreated = null; //callback given by main.js

export function openCreateAgendaModal(callback) {
    onCreated = callback;
    form.reset();
    erreur.textContent = '';
    modal.showModal();
}

form.addEventListener('submit', async function (event) {
    event.preventDefault(); // prevent navigator to recharge the page
    erreur.textContent = '';

    const response = await fetch('/api/agendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nom: document.getElementById('agenda_nom').value,
            couleur: document.getElementById('agenda_couleur').value,
            description: document.getElementById('agenda_description').value.trim() || null
        })
    });
    const donnees = await response.json();
    if (!response.ok) {
        erreur.textContent = donnees.erreur;
        return;
    }

    //add agenda to agenda_panel without reload page
    if (onCreated) onCreated(donnees);

    //share if only an email is give
    if (email.value.trim()) {
        const responseShare = await fetch(`/api/agendas/${donnees.idAgenda}/partages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('share_agenda').value,
                droit: document.getElementById('rights').value
            })
        });
        if (!responseShare.ok) {
            const donneesShare = await responseShare.json();
            erreur.textContent = donneesShare.erreur + ". L'agenda a bien été créé quand même.";
            return; //keep modal open to see error
        }
    }
    modal.close();
});


// Cancel closes without saving (the Escape key does the same)
cancelButton.addEventListener('click', function () {
    modal.close();
});
