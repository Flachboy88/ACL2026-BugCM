import express from "express";
import database from "../database.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Pages: a logged in user does not need the login or register page
function redirectIfLogin(req, res, next){
    if(res.locals.user !== undefined){
        return res.redirect("/");
    }
    next();
}

// True when the client sent a non-empty text for this field
function isFilled(value) {
    return typeof value === "string" && value.trim() !== "";
}

// Creates a signed token with the user id and name, valid 30 minutes
function createJWT(user){
    return jwt.sign({id: user.id, username: user.username}, process.env.SECRET, {expiresIn: "30m"});
}

router.post("/login", function (request, response){
    // request.body is undefined when the client does not send JSON
    const {email, password} = request.body ?? {};
    if(!isFilled(email) || !isFilled(password)){
        return response.status(400).json({erreur: "Champs manquants"});
    }
    const user = database.prepare("SELECT * FROM utilisateur WHERE email = ? AND mot_de_passe_hash = ?").get(email, password);
    if(typeof(user) === "undefined"){
        return response.status(401).json({erreur: "Identifiants incorrects"});
    } else {
        const token = createJWT({id: user["id_utilisateur"], username: user.nom});
        const lifetime = 1000 * 60 * 30;
        response.cookie("accessToken", token, {httpOnly: true, maxAge: lifetime});
        return response.status(200).json({path: "/"});
    }
});

router.post("/logout" ,function logout(req,res) {
    res.cookie('accessToken', null);
    res.redirect('/login');
});

// Web pages (rendered with EJS)
router.get("/login", redirectIfLogin, function (request, response) {
    response.render("login");
});

export default router;