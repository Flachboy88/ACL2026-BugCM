/**
* Function to display a redirect button to fake smtp Ethereal
*/
function addRedirectButton(url){
    const link = document.getElementById("demo_button");
    link.hidden = false;
    link.href = url;
}

document.getElementById("form-forget-pwd").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("account-email").value;
    const message = document.getElementById("forget-message");
    const error = document.getElementById("forget-error");
    const button = e.target.querySelector("input[type=submit]");
    const link = document.getElementById("demo_button");
    message.textContent = "";
    error.textContent = "";
    button.disabled = true;
    link.hidden = true;

    try {
        const res = await fetch("/forget", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
            message.textContent = data.message;
            /*
                Button for demo Email
                Suppress if we add a real SMTP
           */
            if (data.previewUrl) {
                addRedirectButton(data.previewUrl);
            }
        } else {
            error.textContent = data.erreur;
        }
    } catch (err) {
        error.textContent = "Serveur injoignable, réessayez plus tard.";
    } finally {
        button.disabled = false;
    }
});
