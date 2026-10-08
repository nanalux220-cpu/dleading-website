/**
 * /api/webhook/whatsapp — Meta WhatsApp Cloud API webhook (production alias).
 *
 * GET  → Meta verification: returns hub.challenge when hub.mode=subscribe and
 *        hub.verify_token equals the WHATSAPP_VERIFY_TOKEN env var (403 otherwise).
 * POST → incoming WhatsApp messages and delivery statuses. Each request is checked
 *        against Meta's X-Hub-Signature-256 (WHATSAPP_APP_SECRET), de-duplicated,
 *        saved, and answered by the Dleading AI assistant.
 *
 * Same handler as /api/whatsapp, so both URLs behave identically and stay in sync.
 */
export { GET, POST } from "../whatsapp.js";
