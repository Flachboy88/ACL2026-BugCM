// Asks the API if the server is running and shows the answer on the page
async function showServerStatus() {
    const statusElement = document.getElementById("server-status");

    try {
        const response = await fetch("/api/status");
        const data = await response.json();
        statusElement.textContent = data.status;
        statusElement.className = data.status === "ok" ? "status-ok" : "status-error";
    } catch (error) {
        statusElement.textContent = "injoignable";
        statusElement.className = "status-error";
    }
}

showServerStatus();
