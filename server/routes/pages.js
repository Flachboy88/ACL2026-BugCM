import express from "express";
import { requireLogin, redirectIfLogin } from "../middlewares/auth.js";

const router = express.Router();

// Web pages (rendered with EJS)
router.get("/", requireLogin, function (request, response) {
    response.render("index");
});
router.get("/login", redirectIfLogin, function (request, response) {
    response.render("login");
});
router.get("/register", redirectIfLogin, function (request, response) {
    response.render("register");
});

export default router;
