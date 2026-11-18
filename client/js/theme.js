// /public/js/theme.js
document.addEventListener('DOMContentLoaded', () => {
    const btnOpen = document.getElementById('bouton_themes_ouvrir');
    const btnClose = document.getElementById('bouton_themes_fermer');
    const sidebar = document.getElementById('barre_themes_id');
    const themeButtons = document.querySelectorAll('.theme-option');
    const menuProfil = document.getElementById('menu_profil');


    // fonction qui renvoie le theme selectionné. ou claire par défaut
    function getSavedTheme() {
        return localStorage.getItem('selected_theme') || 'claire';
    }

    // fonction pour appliqué le theme sans le sauvgarder
    function applyThemeVisual(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
    }

    // fonction pour appliqué le theme et le sauvgarder 
    function applyTheme(themeName) {
        applyThemeVisual(themeName);
        localStorage.setItem('selected_theme', themeName);
        
        themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-set-theme') === themeName);
        });
    }

    // Meme code que dans le header
    const currentTheme = getSavedTheme();
    themeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-set-theme') === currentTheme);
    });

    // bouton pour ouvrir la barre latéral
    if (btnOpen && sidebar) {
        btnOpen.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.add('open');
            if (menuProfil) {
                menuProfil.hidden = true;
                const pastille = document.getElementById('pastille_profil');
                if (pastille) pastille.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Bouton pour fermer la barre latéral
    if (btnClose && sidebar) {
        btnClose.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }

    // gestion des actions sur les boutons de theme
    themeButtons.forEach(button => {
        const chosenTheme = button.getAttribute('data-set-theme');

        button.addEventListener('mouseenter', () => {
            applyThemeVisual(chosenTheme);
        });

        button.addEventListener('mouseleave', () => {
            applyThemeVisual(getSavedTheme());
        });

        button.addEventListener('click', () => {
            applyTheme(chosenTheme);
        });
    });
});