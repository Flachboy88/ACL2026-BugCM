document.getElementById("form-forget-pwd").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("account-email").value;
    const message = document.getElementById("forget-message");
    const error = document.getElementById("forget-error");
    const res = await fetch("/forget", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email })
    });
    const data = await res.json();
    if(res.ok){
        message.textContent = data.message;
    } else {
        error.textContent = data.erreur;
    }
});
