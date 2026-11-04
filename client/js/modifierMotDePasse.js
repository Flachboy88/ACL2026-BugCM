const boutonModifier = document.querySelector(".bouton_modifier_mdp");
const formulaire = document.getElementById("form_mot_de_passe");
const message = document.getElementById("message_mdp");

// Shows a message under the form (error in red, success in green)
function afficherMessage(texte, estErreur) {
    message.textContent = texte;
    message.classList.toggle("erreur", estErreur);
    message.classList.toggle("succes", !estErreur);
    message.hidden = false;
}

// The pencil opens or closes the password form
boutonModifier.addEventListener("click", () => {
    const ouvert = formulaire.hidden;
    formulaire.hidden = !ouvert;
    boutonModifier.setAttribute("aria-expanded", String(ouvert));
    message.hidden = true;
});

// Sends the new password to the server
formulaire.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = document.getElementById("nouveau_mdp").value;
    const confirmPassword = document.getElementById("confirmer_mdp").value;

    const reponse = await fetch("/api/mot-de-passe", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword })
    });
    const donnees = await reponse.json();

    if (reponse.ok) {
        afficherMessage("Mot de passe modifié", false);
        formulaire.reset();
        // Close the form once the success message has been seen
        setTimeout(() => {
            formulaire.hidden = true;
            message.hidden = true;
            boutonModifier.setAttribute("aria-expanded", "false");
        }, 1500);
    } else {
        afficherMessage(donnees.erreur, true);
    }
});
