# n8n workflows for the Dleading AI assistant

The website chat talks to Claude directly (fast, fewer moving parts). n8n only
receives **leads** and **human handoffs**. Until these workflows exist and their
URLs are in Vercel, the chat still works — it just tells visitors to contact
Dleading directly instead of claiming the team was notified.

Both workflows: **Webhook (secret-header protected) → Format → Save to Google Sheet → Email the team → Respond OK**.
**No duplicates:** each conversation has one `lead_id`. If the visitor adds or corrects details later, the website sends `action: "update"` with the same `lead_id`, and the Sheet row is updated in place (the email subject says UPDATED). Each distinct handoff gets its own `handoff_id`; repeats of the same issue aren't sent.

If any step fails, n8n returns an error, and the AI honestly tells the visitor it couldn't pass the details on.

## One-time setup (≈15 minutes)

### 1. Make a shared secret
Create a long random string (e.g. from a password manager, 32+ characters). You'll paste it in two places: n8n and Vercel. Never put it in website code.

### 2. Make a Google Sheet
Create a sheet with two tabs named exactly `Leads` and `Handoffs`.
- `Leads` row 1 headers: `lead_id, action, version, timestamp, name, email, phone, business_name, needs, budget, preferred_contact, page, conversation_id, transcript`
- `Handoffs` row 1 headers: `handoff_id, lead_id, timestamp, reason, name, email, phone, preferred_contact, page, conversation_id, transcript`

### 3. Import each workflow (repeat for `lead-workflow.json` and `handoff-workflow.json`)
1. n8n → **Create workflow** → `…` menu → **Import from file** → choose the JSON.
2. **Webhook** node → Authentication: *Header Auth* → Credential → **Create new**:
   - Name: `x-dleading-secret`
   - Value: your secret from step 1
   (Create it once, reuse it in the second workflow.)
3. **Save to Google Sheet** node → connect your Google account → paste the sheet URL into *Document*.
4. **Email the team** node → connect your Gmail account → change *To* if alerts should go somewhere other than info@creativedleading.co.uk.
5. **Save**, then switch the workflow to **Active** (published). Inactive workflows don't receive website traffic.
6. Open the **Webhook** node → **Production URL** tab → copy the URL.

### 4. Add the URLs to Vercel
Vercel → your project → Settings → Environment Variables (Production + Preview):

| Name | Value |
|---|---|
| `N8N_LEAD_WEBHOOK_URL` | Production URL from the lead workflow |
| `N8N_HANDOFF_WEBHOOK_URL` | Production URL from the handoff workflow |
| `N8N_WEBHOOK_SECRET` | the secret from step 1 |

Then redeploy (Deployments → … → Redeploy) so the function picks them up.

## Debugging
- n8n → **Executions** shows every request the website sent, including failed ones.
- Wrong/missing secret → n8n rejects it (403) and the chat says it couldn't pass details on.
- Vercel → project → **Logs** shows lines starting with `[chat]` (no customer data is logged).

## What the website sends

Lead:
```json
{ "type": "lead", "action": "create|update", "lead_id": "lead_<conversation>", "version": 1, "timestamp": "ISO date", "conversation_id": "…", "page": "/pricing",
  "lead": { "name": "", "email": "", "phone": "", "business_name": "", "needs": "", "budget": "", "preferred_contact": "email|phone|whatsapp|" },
  "transcript": "Visitor: …\nAssistant: …" }
```
Handoff:
```json
{ "type": "handoff", "handoff_id": "<conversation>-h1", "lead_id": "", "timestamp": "…", "conversation_id": "…", "page": "…", "reason": "…",
  "customer": { "name": "", "email": "", "phone": "", "preferred_contact": "" },
  "transcript": "…" }
```
