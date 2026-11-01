import express from "express";
import database from "../database.js";
import bcrypt from "bcrypt";
import { createJWT } from "../middlewares/auth.js";

const router = express.Router();

// True when the client sent a non-empty text for this field
function isFilled(value) {
    return typeof value === "string" && value.trim() !== "";
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
    res.cookie('accessToken', null);
    res.redirect('/login');
});

export default router;
