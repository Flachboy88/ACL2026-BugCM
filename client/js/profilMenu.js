const pastille = document.getElementById("pastille_profil");
const menu = document.getElementById("menu_profil");

// Shows or hides the menu and keeps aria-expanded in sync
function setMenu(ouvert) {
    pastille.setAttribute("aria-expanded", String(ouvert));
    menu.hidden = !ouvert;
}

// A click on the avatar opens the menu, or closes it if it is already open
pastille.addEventListener("click", (event) => {
    event.stopPropagation();
    const dejaOuvert = pastille.getAttribute("aria-expanded") === "true";
    setMenu(!dejaOuvert);
});

// A click anywhere else closes the menu
document.addEventListener("click", (event) => {
    if (!menu.contains(event.target)) {
        setMenu(false);
    }
});
