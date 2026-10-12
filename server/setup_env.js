import fs from "fs";
import path from "path";
import crypto from "crypto";

const ENV_PATH = path.join(import.meta.dirname, "..", ".env");


function ensureEnv() {
    const content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
    if (/^SECRET=\S+/m.test(content)) {
        return;
    }
    const secret = crypto.randomBytes(64).toString("hex");
    const separator = content === "" || content.endsWith("\n") ? "" : "\n";
    fs.appendFileSync(ENV_PATH, separator + "SECRET=" + secret + "\n");
    console.log(".env : SECRET généré");
}

ensureEnv();
