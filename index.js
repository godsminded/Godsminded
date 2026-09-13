const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")
const pino = require("pino")
const qrcode = require("qrcode-terminal")

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: true,
        auth: state,
        browser: ["Godsmind", "Chrome", "1.0.0"]
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            console.log("Connection closed. Reconnecting:", shouldReconnect)
            if (shouldReconnect) startBot()
        } else if (connection === "open") {
            console.log("✅ Godsmind Bot is now connected!")
        }
    })

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0]
        if (!m.message || m.key.fromMe) return

        const from = m.key.remoteJid
        const body = m.message.conversation || m.message.extendedTextMessage?.text || ""
        const command = body.startsWith(".") ? body.slice(1).trim().split(" ")[0].toLowerCase() : ""

        if (command === "ping") {
            await sock.sendMessage(from, { text: "🏓 Pong! Godsmind is alive." })
        }

        if (command === "menu" || command === "help") {
            const menu = `╭───『 *GODSMIND BOT* 』───╮
│ 
│  .ping
│  .menu
│  .alive
│  .owner
│ 
╰──────────────────────╯
*Created by you*`
            await sock.sendMessage(from, { text: menu })
        }

        if (command === "alive") {
            await sock.sendMessage(from, { text: "✅ *Godsmind Bot is Active!*" })
        }

        if (command === "owner") {
            await sock.sendMessage(from, { text: "👑 This bot belongs to *You*." })
        }
    })
}

startBot()
