import nodemailer from "nodemailer";

let transporterPromise = null;

async function createTransporter() {
    try {
        const account = await nodemailer.createTestAccount();
        return nodemailer.createTransport({
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            auth: { user: account.user, pass: account.pass }
        });
    } catch (error) {
        console.warn('Ethereal injoignable (' + error.message + '), mode console : aucun mail envoyé.');
        return nodemailer.createTransport({ jsonTransport: true });
    }
}

function getTransporter() {
    if (transporterPromise === null) {
        transporterPromise = createTransporter();
    }
    return transporterPromise;
}

export async function sendEMail({ to, subject, text, html }) {
    try {
        const transporter = await getTransporter();

        const info = await transporter.sendMail({
            from: 'Agenda <no-reply@bugcm>',
            to,
            subject,
            text,
            html
        });

        const previewUrl = nodemailer.getTestMessageUrl(info); // false en mode console
        if (previewUrl) {
            console.log('Preview URL: %s', previewUrl);
            return previewUrl;
        }

        console.log('[Mode console] Mail non envoyé. Destinataire : %s\n%s', to, text);
        return null;
    } catch (error) {
        console.error('Failed to send mail. ' + error.message);
        throw error;
    }
}
