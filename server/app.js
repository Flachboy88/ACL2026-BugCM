import path from "path";
import express from "express";
import cookieParser from "cookie-parser";
import { auth, requireApiLogin } from "./middlewares/auth.js";
import authRouter from "./routes/auth.js";
import pagesRouter from "./routes/pages.js";
import agendasRouter from "./routes/agendas.js";
import activitesRouter from "./routes/activites.js";

const CLIENT_FOLDER = path.join(import.meta.dirname, "..", "client");

// Builds the Express app without starting it: server.js starts it, the tests start their own copy
const app = express();

// Engine for templeate (include header), page are in client/views
app.set("view engine", "ejs");
app.set("views", path.join(CLIENT_FOLDER, "views"));

// Lets the API read JSON sent by the client
app.use(express.json());
// Reads the token cookie before any route, so every route knows the user
app.use(cookieParser()).use(auth);

// API routers: agendas and their activities (only for logged in users)
app.use("/api", requireApiLogin);
app.use("/api", agendasRouter);
app.use("/api", activitesRouter);

// Auth actions (login, register, logout) and EJS pages
app.use(authRouter);
app.use(pagesRouter);

// Assets statiques : seulement css et js (pas views/, sinon les .ejs seraient exposés)
app.use("/css", express.static(path.join(CLIENT_FOLDER, "css")));
app.use("/js", express.static(path.join(CLIENT_FOLDER, "js")));

export default app;
