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

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const RESET_LIFETIME = 60 * 60 * 1000; // 1 h

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
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

router.post("/register", function (request, response){
    const {userName, email, password, confirmPassword} = request.body ?? {};
    if(!isFilled(userName) || !isFilled(email) || !isFilled(password) || !isFilled(confirmPassword)){
        return response.status(400).json({erreur: "Champs manquants"});
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
    const user = database.prepare("SELECT * FROM utilisateur WHERE email = ?").get(email);
    if(typeof(user) !== "undefined"){
        const token = crypto.randomBytes(32).toString("hex");
        database.prepare(
            "UPDATE utilisateur SET reset_token_hash = ?, reset_expires = ? WHERE email = ?"
        ).run(hashToken(token), Date.now() + RESET_LIFETIME, email);

        try {
            await sendEMail({
                to: user.email,
                subject: "Réinitialisation de votre mot de passe",
                text: `Bonjour ${user.nom},\n\nPour choisir un nouveau mot de passe (lien valable 1 h) :\n${BASE_URL}/reset?token=${token}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`
            });
        } catch (error) {
            console.error("Envoi du mail de reset impossible : " + error.message);
        }
    }
    return response.status(200).json({ message: "Si ce compte existe, un mail a été envoyé." });
});

router.post("/reset", function (request, response) {
    const {token, password, confirmPassword} = request.body ?? {};
    if (!isFilled(token) || !isFilled(password) || !isFilled(confirmPassword)) {
        return response.status(400).json({erreur: "Champs manquants"});
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
