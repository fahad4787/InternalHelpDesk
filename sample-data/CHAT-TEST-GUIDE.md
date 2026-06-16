# AI Chat Test Guide

Use the sample document `acme-employee-handbook.txt` to verify chat is working.

## Step 1 — Upload the document

1. Log in to the app.
2. Go to **Knowledge Base → Upload** (`/knowledge-base/upload`).
3. Upload `sample-data/acme-employee-handbook.txt`.
4. Wait until status is **READY** on the documents list (processing usually takes a few seconds).

## Step 2 — Ask these questions

The MVP chat uses **keyword matching** (words longer than 3 characters). Use the questions below as written so keywords match the document.

---

### Should find an answer (with sources)

| # | Question to ask | What you should see |
|---|-----------------|---------------------|
| 1 | `How many vacation days do employees get?` | Answer mentioning **20 days** of paid vacation. Source: *Acme Employee Handbook*. |
| 2 | `What is the password policy for company accounts?` | Answer about **12 characters**, change every **90 days**, MFA required. |
| 3 | `How do I request remote work?` | Answer about **three days per week**, manager approval, **48 hours** notice. |
| 4 | `What is the expense reimbursement process?` | Answer about **30 days**, receipts over **$25**, Finance portal. |
| 5 | `How many sick leave days are available?` | Answer mentioning **10 days** paid sick leave. |
| 6 | `What happens during onboarding for new hires?` | Answer about orientation, IT setup, buddy program, compliance training. |

---

### Should suggest creating a ticket (no match)

| # | Question to ask | What you should see |
|---|-----------------|---------------------|
| 7 | `What is the company stock option vesting schedule?` | Message that no relevant info was found + **suggest ticket** banner. |
| 8 | `Who won the World Cup in 2022?` | Same — no match, ticket suggestion. |

---

## Step 3 — Quick checklist

- [ ] Document shows status **READY** with chunk count > 0
- [ ] Questions 1–6 return an answer (not the “couldn't find” message)
- [ ] Answers show **Sources** with document title and excerpt
- [ ] Questions 7–8 show **suggest ticket** option
- [ ] **Create Ticket** link works from chat when no answer is found

## Tips

- If chat always fails, confirm the document status is **READY** (not PENDING or FAILED).
- Ask using words from the handbook (vacation, password, remote, expense, sick, onboarding).
- Short questions with clear keywords work better than very vague ones like “tell me about work.”

## Expected answers (reference)

**Q1:** Full-time employees receive 20 days of paid vacation per calendar year.

**Q2:** Passwords must be at least 12 characters, changed every 90 days, with MFA enabled.

**Q3:** Remote work up to three days per week with manager approval 48 hours in advance.

**Q4:** Submit expenses within 30 days via Finance portal; receipts required over $25.

**Q5:** 10 days of paid sick leave per year; does not roll over.

**Q6:** Day-one orientation, day-two IT setup, HR benefits meeting, 30-day buddy, compliance training within two weeks.
