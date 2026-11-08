document.getElementById("form-reset").addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = document.getElementById("reset-password1").value;
    const confirmPassword = document.getElementById("reset-password2").value;
    const message = document.getElementById("reset-message");
    const error = document.getElementById("reset-erreur");
    const button = e.target.querySelector("input[type=submit]");

    message.textContent = "";
    error.textContent = "";

    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
        error.textContent = "Lien invalide : refaites une demande de réinitialisation.";
        return;
    }
    if (password !== confirmPassword) {
        error.textContent = "Les mots de passe sont différents.";
        return;
    }

    button.disabled = true;
    try {
        const res = await fetch("/reset", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ token, password, confirmPassword })
        });
        const data = await res.json();
        if (res.ok) {
            message.textContent = data.message + " Redirection vers la connexion...";
            setTimeout(() => { window.location.href = "/login"; }, 3000);
            return; // le bouton reste désactivé pendant la redirection
        }
        error.textContent = data.erreur;
    } catch (err) {
        error.textContent = "Serveur injoignable, réessayez plus tard.";
    }
    button.disabled = false;
});
