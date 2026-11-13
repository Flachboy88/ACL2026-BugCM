import express from "express";
import database from "../database.js";
import bcrypt from "bcrypt";
import { createJWT } from "../middlewares/auth.js";
import crypto from "crypto";
import { sendEMail } from "../mailer.js";

const router = express.Router();

// True when the client sent a non-empty text for this field
function isFilled(value) {
    return typeof value === "string" && value.trim() !== "";
}

const BASE_URL = process.env.BASE_URL;
const RESET_LIFETIME = 60 * 60 * 1000; // 1 h

// Adresse du serveur telle que le client l'a utilisée (IP du réseau local, localhost...)
function adresseServeur(request) {
    if (BASE_URL) {
        return BASE_URL;
    }
    const host = request.get("host");
    // Garde-fou : seulement un nom ou une IP, avec un port éventuel
    if (typeof host !== "string" || !/^[A-Za-z0-9.-]+(:\d{1,5})?$/.test(host)) {
        return "http://localhost:3000";
    }
    return request.protocol + "://" + host;
}

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}



// Sanitize username to prevent html interpreter
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function resetMailHtml(nom, link) {
    return `
<div style="background:#f5f7fa;padding:24px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#1f2937;">
  <div style="max-width:480px;margin:0 auto;">
    <h1 style="text-align:center;font-size:24px;margin:0 0 20px;">Agenda BugCM</h1>
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;">
      <h2 style="font-size:20px;margin:0 0 16px;">Réinitialisation du mot de passe</h2>
      <p style="margin:0 0 12px;line-height:1.5;">Bonjour ${escapeHtml(nom)},</p>
      <p style="margin:0 0 24px;line-height:1.5;">Vous avez demandé à choisir un nouveau mot de passe. Ce lien est valable 1 heure.</p>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${escapeHtml(link)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:12px 24px;border-radius:8px;">Changer mon mot de passe</a>
      </div>
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Le bouton ne fonctionne pas ? Copiez cette adresse dans votre navigateur :</p>
      <p style="margin:0;font-size:13px;word-break:break-all;"><a href="${escapeHtml(link)}" style="color:#2563eb;">${escapeHtml(link)}</a></p>
    </div>
    <p style="text-align:center;font-size:12px;color:#6b7280;margin:16px 0 0;">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe ne sera pas modifié.</p>
  </div>
</div>`;
}

router.post("/login", function (request, response){
    // request.body is undefined when the client does not send JSON
    const {email, password} = request.body ?? {};

    if(!isFilled(email) || !isFilled(password)){
        return response.status(400).json({erreur: "Champs manquants"});
    }

    const user = database.prepare("SELECT * FROM utilisateur WHERE email = ?").get(email);
    if(typeof(user) === "undefined" || !bcrypt.compareSync(password, user.mot_de_passe_hash)){
        return response.status(401).json({erreur: "Identifiants incorrects"});
    } else {
        const token = createJWT({id: user["id_utilisateur"], username: user.nom});
        const lifetime = 1000 * 60 * 30;
        response.cookie("accessToken", token, {httpOnly: true, maxAge: lifetime});
        return response.status(200).json({path: "/"});
    }
});

// Validation du format d'email
function isEmailValide(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Validation de la force du mot de passe (8 caractères minimum, 1 lettre, 1 chiffre)
function isMdpValide(mdp) {
    const mdpRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return mdpRegex.test(mdp);
}

router.post("/register", function (request, response){
    const {userName, email, password, confirmPassword} = request.body ?? {};
    if(!isFilled(userName) || !isFilled(email) || !isFilled(password) || !isFilled(confirmPassword)){
        return response.status(400).json({erreur: "Champs manquants"});
    }
        if (!isEmailValide(email)) {
        return response.status(400).json({ erreur: "Email mal formé" });
    }
    if (!isMdpValide(password)) {
        return response.status(400).json({ erreur: "Mot de passe mal formé (au moins 8 caractères, 1 lettre et 1 chiffre)" });
    }
    const userExists = database.prepare("SELECT email FROM utilisateur WHERE email = ?").get(email);
    if(typeof(userExists) === "undefined"){
        if(password === confirmPassword){
            const passwordHash = bcrypt.hashSync(password,10);
            const user = database.prepare("INSERT INTO utilisateur (nom, email, mot_de_passe_hash) VALUES (?, ?, ?)").run(userName, email, passwordHash);
            const lifetime = 1000 * 60 * 30;
            const token = createJWT({id: user.lastInsertRowid, username: userName});
            response.cookie("accessToken", token, {httpOnly: true, maxAge: lifetime});
            return response.status(200).json({path: "/"});
        } else {
            return response.status(400).json({erreur: "Mot de passe différents"});
        }
    } else {
        return response.status(400).json({erreur: "Email déjà pris"});
    }
});

router.post("/logout" ,function logout(req,res) {
    // Efface le cookie du jeton : le navigateur le supprime vraiment (au lieu de le mettre à "null")
    res.clearCookie("accessToken");
    res.redirect("/login");
});

router.post("/forget", async function (request, response) {
    const { email } = request.body ?? {};
    if (!isFilled(email)){
        return response.status(400).json({erreur: "Champs manquants"});
    }
    let previewUrl = null; 
    const user = database.prepare("SELECT * FROM utilisateur WHERE email = ?").get(email);
    if(typeof(user) !== "undefined"){
        const token = crypto.randomBytes(32).toString("hex");
        database.prepare(
            "UPDATE utilisateur SET reset_token_hash = ?, reset_expires = ? WHERE email = ?"
        ).run(hashToken(token), Date.now() + RESET_LIFETIME, email);

        const link = `${adresseServeur(request)}/reset?token=${token}`;

        try {
            previewUrl = await sendEMail({
                to: user.email,
                subject: "Réinitialisation de votre mot de passe",
                text: `Bonjour ${user.nom},\n\nPour choisir un nouveau mot de passe (lien valable 1 h) :\n${link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
                html: resetMailHtml(user.nom, link)
            });
        } catch (error) {
            console.error("Envoi du mail de reset impossible : " + error.message);
        }
    }
    return response.status(200).json({ message: "Si ce compte existe, un mail a été envoyé.", previewUrl });
});

router.post("/reset", function (request, response) {
    const {token, password, confirmPassword} = request.body ?? {};
    if (!isFilled(token) || !isFilled(password) || !isFilled(confirmPassword)) {
        return response.status(400).json({erreur: "Champs manquants"});
    }
    if (!isMdpValide(password)) {
        return response.status(400).json({ erreur: "Mot de passe mal formé (au moins 8 caractères, 1 lettre et 1 chiffre)" });
    }
    if (password !== confirmPassword) {
        return response.status(400).json({erreur: "Mot de passe différents"});
    }

    const user = database.prepare(
        "SELECT id_utilisateur FROM utilisateur WHERE reset_token_hash = ? AND reset_expires > ?"
    ).get(hashToken(token), Date.now());
    if (typeof(user) === "undefined") {
        return response.status(400).json({erreur: "Lien invalide ou expiré"});
    }

    database.prepare(
        "UPDATE utilisateur SET mot_de_passe_hash = ?, reset_token_hash = NULL, reset_expires = NULL WHERE id_utilisateur = ?"
    ).run(bcrypt.hashSync(password, 10), user.id_utilisateur);

    return response.status(200).json({message: "Mot de passe modifié"});
});


export default router;
