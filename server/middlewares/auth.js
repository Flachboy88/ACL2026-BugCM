import jwt from "jsonwebtoken";

// Creates a signed token with the user id and name, valid 30 minutes
export function createJWT(user){
    return jwt.sign({id: user.id, username: user.username}, process.env.SECRET, {expiresIn: "30m"});
}

// Puts the user of a valid token in res.locals.user (stays undefined otherwise)
export function auth(req, res, next){
    try {
        const token = req.cookies.accessToken;
        const user = jwt.verify(token, process.env.SECRET);
        res.locals.user = user;
    } catch {

    }
    next();
}

// Pages: sends a visitor who is not logged in to the login page
export function requireLogin(req, res, next){
    if(res.locals.user === undefined){
        return res.redirect("/login");
    }
    next();
}

// API: answers 401 to a visitor who is not logged in (no redirect, the client expects JSON)
export function requireApiLogin(req, res, next){
    if(res.locals.user === undefined){
        return res.status(401).json({erreur: "Non connecté"});
    }
    next();
}

// Pages: a logged in user does not need the login or register page
export function redirectIfLogin(req, res, next){
    if(res.locals.user !== undefined){
        return res.redirect("/");
    }
    next();
}
