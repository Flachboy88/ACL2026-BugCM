document.getElementById("logout").addEventListener("click", async (e) => {
    e.preventDefault();
    const response = await fetch('/logout', {
        method: 'POST',
    });
    if (response.ok) {
        window.location.href = '/login'; 
    } else {
        console.error("Erreur lors de la déconnexion");
    }
});
