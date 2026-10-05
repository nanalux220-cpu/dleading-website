# Dleading WhatsApp engine — setup guide

What it does:
- **AI replies** on WhatsApp. It's the same receptionist as the website chat, with the same knowledge and rules.
- **Every message saved.** A first message from a new number = a new lead, plus an alert to the team.
- **Human handoff.** After a handoff, the AI stays silent; reply from `/admin.html` (or your phone, if the app still works).
- **Website "speak to someone" button** goes straight to a human, and records which page the visitor came from.
- **Auto-replies** for keywords, **campaigns** (approved templates) with sent/delivered/read stats, **STOP/START** opt-out, and **CSV export**.

Architecture:

```
Customer's WhatsApp ─► Meta Cloud API ─► https://www.creativedleading.co.uk/api/whatsapp (Vercel)
                                              │  checks Meta's signature, ignores duplicates
                                              ├─► Upstash Redis (contacts, messages, AI memory, statuses)
                                              ├─► Claude (same receptionist AI as the website)
                                              ├─► n8n lead / handoff workflows (alerts + Google Sheet)
                                              └─► Meta Cloud API ─► reply to the customer
```
Meta talks to Vercel directly. That's the most reliable option, because the security signature has to be checked against the exact bytes Meta sends. n8n is used for the team alerts, as before.

---

## Step 1 — Upstash Redis (database), about 3 minutes
1. Go to **vercel.com** → open the **dleading-website** project → **Storage** tab → **Create Database**.
2. Choose **Upstash → Redis** → **Continue**. Accept the free plan, pick a region near London (e.g. `eu-west-1` / Ireland), and name it `dleading-whatsapp`. Click **Create**.
3. When it asks which project to connect, choose **dleading-website** and tick **Production** and **Preview** → **Connect**.
4. Done. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically. Check: **Settings → Environment Variables** should now list them.

(If you created the database on upstash.com instead, open it → **REST API** section, and copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` into Vercel with those exact names.)

## Step 2 — a permanent WhatsApp token (the 24-hour one will stop working)
1. Go to **business.facebook.com** → **Settings** (gear icon) → **Users → System users** → **Add**. Name it `dleading-api` and choose role **Admin**.
2. Select it → **Assign assets** → **Apps** → your app (ID `1565214158224377`) → **Full control** → **Save**.
3. Assign assets again: **WhatsApp accounts** → your account (`562742200250790`) → **Full control** → **Save**.
4. Click **Generate new token** → choose your app → expiry **Never** → tick `whatsapp_business_messaging` and `whatsapp_business_management` → **Generate**. Copy it straight into Vercel (Step 4). Never paste it anywhere else.

## Step 3 — the App Secret
**developers.facebook.com** → **My Apps** → your app → **App settings → Basic** → **App secret** → **Show**. Copy it into Vercel (Step 4).

## Step 4 — Vercel environment variables
**Vercel → dleading-website → Settings → Environment Variables.** Add each one below, tick **Production** and **Preview**, then click **Save**:

| Name | Value |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | the permanent token from Step 2 |
| `WHATSAPP_APP_SECRET` | the App Secret from Step 3 |
| `WHATSAPP_PHONE_NUMBER_ID` | `1385944931264059` |
| `WHATSAPP_VERIFY_TOKEN` | the verify token Claude gave you (keep it private) |
| `WHATSAPP_API_VERSION` | `v21.0` |
| `ADMIN_TOKEN` | the admin password Claude gave you (24+ characters; this is the password for /admin.html) |

Already set from earlier: `ANTHROPIC_API_KEY`. Optional: `N8N_LEAD_WEBHOOK_URL`, `N8N_HANDOFF_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET` for team email alerts and the Google Sheet (see `n8n/README.md`). Without them, everything still works and is visible in `/admin.html`.

Then go to **Deployments** → latest **Production** → **⋯ → Redeploy** so the new variables take effect.

## Step 5 — connect Meta to the webhook
1. **developers.facebook.com** → your app → **WhatsApp → Configuration** (in some layouts: **Use cases → Connect on WhatsApp → Customize → Configuration**).
2. Under **Webhook** → **Edit**:
   - **Callback URL:** `https://www.creativedleading.co.uk/api/whatsapp`
   - **Verify token:** exactly the same value as `WHATSAPP_VERIFY_TOKEN`
   - Click **Verify and save**. If it fails, the redeploy in Step 4 hasn't finished, or the token doesn't match exactly.
3. Under **Webhook fields** → **Manage** → tick **messages** → **Done**. This one field carries both incoming messages and sent/delivered/read statuses.
4. Make sure your WhatsApp Business Account is subscribed to the app. In the API Setup page this is usually automatic. If test messages never arrive, see Troubleshooting.

## Step 6 — test from your phone (use a DIFFERENT phone from the business number)
1. Send **Hi** to +44 7427 259935. You should get a short AI reply within a few seconds.
2. Open **https://www.creativedleading.co.uk/admin.html** and sign in with `ADMIN_TOKEN`. Your number should appear under Contacts.
3. Send **I need a website for my cleaning company**. The AI should ask your name (one question), then confirm the team will be in touch.
4. Send **Can I speak to someone?**. The AI should ask your name if needed, then confirm a person will reply here, and then **stop replying**. In admin the contact shows **Needs human**. Reply from admin, then click **Hand back to AI**.
5. Send something rude, e.g. **you're useless idiot**. You should get one short, polite warning. If you keep going, it closes the chat and stops replying for 24 hours.
6. Send **STOP**. You should get an unsubscribe confirmation, and the contact shows "Opted out".

## Campaigns (broadcasts)
WhatsApp only allows business-initiated messages through **approved templates**, sent to people who **opted in**.
- Create templates in **WhatsApp Manager → Account tools → Message templates**. `hello_world` (language `en_US`) exists by default for testing.
- Then use **/admin.html → Campaigns**.
- Opted-out numbers are skipped automatically.
- The limit is 100 numbers per send. Your Meta messaging tier also limits daily new conversations.

## Website embed code (optional)
Your site already has its floating WhatsApp button, and the AI chat's "Chat on WhatsApp" button now pre-fills a reference + page. To add a WhatsApp button **on another site or landing page**, paste this before `</body>`:

```html
<!-- Dleading: Start Chat on WhatsApp (pre-filled, tracks the page) -->
<a id="dl-wa" href="#" target="_blank" rel="noopener"
   style="position:fixed;right:20px;bottom:20px;z-index:9999;display:flex;align-items:center;gap:8px;
          background:#25D366;color:#fff;font:600 15px system-ui,sans-serif;padding:12px 18px;
          border-radius:999px;box-shadow:0 6px 24px rgba(37,211,102,.45);text-decoration:none">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.2.5.1.6-.1l.9-1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.1 1.3z"/></svg>
  Start Chat on WhatsApp
</a>
<script>
  (function () {
    var text = "Hi Dleading, I have a question. (page: " + location.pathname + ")";
    document.getElementById("dl-wa").href = "https://wa.me/447427259935?text=" + encodeURIComponent(text);
  })();
</script>
```
The `(page: …)` part is saved as the contact's **From page** in admin.

## Troubleshooting
- **Verify and save fails:** `WHATSAPP_VERIFY_TOKEN` isn't set or doesn't match exactly, or you didn't redeploy after adding it.
- **No reply to "Hi":** check **Vercel → Logs**, filtered by `/api/whatsapp`:
  - `bad or missing signature` → wrong `WHATSAPP_APP_SECRET`.
  - `store not configured` → Step 1 not done.
  - `send failed … code=190` → token expired or wrong (Step 2).
  - `code=131047` → more than 24h since the customer's last message (needs a template).
  - No `/api/whatsapp` log lines at all → Meta isn't sending. Re-check Step 5, including that **messages** is ticked.
- **Messages never reach the webhook even though the configuration is right:** subscribe the WhatsApp account to the app. In Graph API Explorer (with your token), run `POST /562742200250790/subscribed_apps`.
- Logs never contain tokens or message text, only error codes.

## Limits to know
- **Free-text replies only work within 24 hours** of the customer's last message. This is Meta's rule.
- **Your phone's WhatsApp Business app:** if the number was moved to the Cloud API *without* coexistence, the app on the phone may no longer receive messages. Reply to customers from `/admin.html` instead.
- After a handoff, the AI stays silent for 24 hours (`WHATSAPP_HANDOFF_HOURS`) or until you click **Hand back to AI**.

## Connecting the existing WhatsApp Business App number (Coexistence)
The number stays on the WhatsApp Business App with its chats. Use **/connect-whatsapp.html**:
Meta Embedded Signup v4 with `extras: { version: "v4", featureType: "whatsapp_business_app_onboarding" }`.
- Vercel env needed: `META_ES_CONFIG_ID` (Configuration ID from Embedded Signup Builder), `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` (setup key).
- Meta app → Facebook Login for Business → Settings: add `https://www.creativedleading.co.uk` to Allowed domains for the JavaScript SDK, and turn on Login with the JavaScript SDK.
- Webhook fields to subscribe: `messages`, `smb_message_echoes` (your replies from the phone app), `history`, `smb_app_state_sync`.
- When you reply to a customer from the phone app, the AI stops replying to that customer (for WHATSAPP_HANDOFF_HOURS, default 24h, or until "Hand back to AI" in /admin.html).
- The old register/PIN flow (/api/connect-number) is disabled because it would take the number off the app.
