import express from "express";
import database from "../database.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// True when the client sent a non-empty text for this field
function isFilled(value) {
    return typeof value === "string" && value.trim() !== "";
}

// Creates a signed token with the user id and name, valid 30 minutes
function createJWT(user){
    return jwt.sign({id: user.id, username: user.username}, process.env.SECRET, {expiresIn: "30m"});
}

// Pages: a logged in user does not need the login or register page
function redirectIfLogin(req, res, next){
    if(res.locals.user !== undefined){
        return res.redirect("/");
    }
    next();
}

router.post("/register", function (request, response){
    const {userName, email, password, confirmPassword} = request.body ?? {};
    if(!isFilled(userName) || !isFilled(email) || !isFilled(password) || !isFilled(confirmPassword)){
        return response.status(400).json({erreur: "Champs manquants"});
    }
    const userExists = database.prepare("SELECT email FROM utilisateur WHERE email = ?").get(email);
    if(typeof(userExists) === "undefined"){
        if(password === confirmPassword){
            const user = database.prepare("INSERT INTO utilisateur (nom, email, mot_de_passe_hash) VALUES (?, ?, ?)").run(userName, email, password);
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

router.get("/register", redirectIfLogin, function (request, response) {
    response.render("register");
});

export default router;