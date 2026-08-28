import { Router } from "express";
export const contactsRouter = Router();
contactsRouter.use((_req, res) => {
    res.status(410).json({ error: "Contacts have been replaced by friends. Use /friends endpoints." });
});
