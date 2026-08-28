import { Router } from "express";
import { createHmac } from "node:crypto";
import { env } from "../../config/env.js";
import { verifyAuthToken } from "../auth/auth.service.js";
export const callsRouter = Router();
const turnCredentialTtlSeconds = 24 * 60 * 60;
async function readUser(req) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
    return verifyAuthToken(token);
}
function sendCallError(res, error) {
    if (error instanceof Error)
        return res.status(400).json({ error: error.message });
    return res.status(500).json({ error: "Call request failed." });
}
function createTurnCredentials(userId) {
    if (!env.TURN_SECRET)
        return null;
    const expiresAt = Math.floor(Date.now() / 1000) + turnCredentialTtlSeconds;
    const username = `${expiresAt}:${userId}`;
    const credential = createHmac("sha1", env.TURN_SECRET).update(username).digest("base64");
    return { username, credential };
}
callsRouter.get("/ice-servers", async (req, res) => {
    try {
        const user = await readUser(req);
        if (!user)
            return res.status(401).json({ error: "Unauthorized." });
        const iceServers = [];
        if (env.STUN_URL)
            iceServers.push({ urls: env.STUN_URL });
        if (env.TURN_URL) {
            const turnCredentials = createTurnCredentials(user.id);
            if (!turnCredentials && (!env.TURN_USERNAME || !env.TURN_PASSWORD)) {
                return res.status(503).json({
                    error: "TURN_URL is configured, but TURN_SECRET or TURN_USERNAME/TURN_PASSWORD is required.",
                });
            }
            iceServers.push({
                urls: env.TURN_URL,
                username: turnCredentials?.username ?? env.TURN_USERNAME,
                credential: turnCredentials?.credential ?? env.TURN_PASSWORD,
            });
        }
        if (iceServers.length === 0) {
            return res.status(503).json({
                error: "STUN_URL or TURN_URL must be configured before calls can start.",
            });
        }
        return res.json({ iceServers });
    }
    catch (error) {
        return sendCallError(res, error);
    }
});
