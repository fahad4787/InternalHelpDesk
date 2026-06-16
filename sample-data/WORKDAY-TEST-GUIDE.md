# Workday Integration Test Guide

Use this guide to verify the Workday integration module in **mock mode** (no real Workday tenant required).

## Prerequisites

- App running: `npm run dev`
- Logged in as **Company Admin** or **Super Admin**
- `WORKDAY_MODE=mock` in `apps/api/.env` (default)

## Step 1 — Open Workday Integration

1. Go to **Integrations** (`/integrations`)
2. Click **Configure** on the Workday card
3. Confirm you see **Mock Mode Active** badge and the blue info banner

## Step 2 — Save connection

1. Optionally fill Tenant URL, Client ID, Client Secret (any values work in mock mode)
2. Select **Sandbox** environment
3. Click **Test Connection** → should succeed
4. Click **Save Connection** → status shows **Connected**

## Step 3 — Sync articles

1. Click **Sync Articles**
2. Wait for toast: `Sync complete: 5 created, 0 updated, 0 failed`
3. Verify **Total Synced Articles** = 5
4. **Synced Articles** panel lists all 5 titles
5. **Sync Logs** table shows a SUCCESS row

## Step 4 — Verify knowledge base

1. Go to **Documents** (`/knowledge-base`)
2. Confirm 5 documents with **Workday** badge
3. Each should show status **READY** with chunks > 0

## Step 5 — Test AI chat

Ask these questions in **AI Chat** (`/chat`):

| Question | Expected source |
|----------|-----------------|
| How do I request time off? | Workday - How to Request Time Off |
| How do I update my personal information? | Workday - How to Update Personal Information |
| How do I submit expenses? | Workday - How to Submit Expenses |
| Where can I view my payslips? | Workday - How to View Payslips |
| How do approvals work in Workday? | Workday - How Approvals Work |

## Step 6 — Re-sync (update test)

1. Return to **Integrations → Workday**
2. Click **Sync Articles** again
3. Toast should show: `0 created, 5 updated, 0 failed`
4. No duplicate documents in knowledge base

## Step 7 — Ticket suggestion

Ask: `What is the company stock option vesting schedule?`

Expected: No answer found + **Create Ticket** suggestion banner.

## Checklist

- [ ] Mock Mode badge visible
- [ ] Test Connection succeeds
- [ ] Save Connection works
- [ ] Sync imports 5 articles
- [ ] Sync logs recorded
- [ ] Knowledge base shows Workday documents
- [ ] Chat answers with Workday source references
- [ ] Re-sync updates without duplicates
- [ ] Unmatched questions suggest ticket

## Environment variables

```env
# apps/api/.env
WORKDAY_MODE=mock
ENCRYPTION_KEY=your-secure-32-char-minimum-key-here
```

When real Workday credentials are available, set `WORKDAY_MODE=live` and implement the real provider API calls.
