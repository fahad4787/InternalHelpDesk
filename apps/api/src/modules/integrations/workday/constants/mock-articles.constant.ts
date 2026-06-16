import { WorkdayArticle } from '../types/workday-article.type';

export const MOCK_WORKDAY_ARTICLES: WorkdayArticle[] = [
  {
    externalId: 'wd-help-001',
    title: 'How to Request Time Off',
    category: 'Time Off',
    source: 'workday',
    sourceUrl: 'https://workday.example/help/wd-help-001',
    lastUpdated: '2025-01-15T10:00:00.000Z',
    tags: ['time-off', 'pto', 'vacation', 'leave'],
    content: `How to Request Time Off

1. Open Workday from your company portal or go to workday.com and sign in.
2. In the search bar, type "Request Time Off" and select the task.
3. Choose your time off type: Paid Time Off, Sick Leave, or Personal Leave.
4. Select the start date and end date for your request.
5. Enter the number of hours or days you are requesting.
6. Add a comment for your manager if required by company policy.
7. Review your remaining PTO balance shown on the request form.
8. Click Submit. Your manager receives a notification to approve or deny the request.
9. Track status under My Tasks or Inbox until the request is approved.

Notes:
- Submit requests at least 48 hours in advance when possible.
- Emergency sick leave may be entered after the absence with manager approval.
- Approved time off appears on your calendar and payroll records automatically.`,
  },
  {
    externalId: 'wd-help-002',
    title: 'How to Update Personal Information',
    category: 'Personal Data',
    source: 'workday',
    sourceUrl: 'https://workday.example/help/wd-help-002',
    lastUpdated: '2025-01-10T09:00:00.000Z',
    tags: ['personal-info', 'address', 'contact', 'profile'],
    content: `How to Update Personal Information

1. Sign in to Workday and open your profile by clicking your name or photo.
2. Select View Profile or Personal Information.
3. To update your home address, click Edit on the Address section.
4. Enter your new street address, city, state, and postal code.
5. To update phone or personal email, click Edit on Contact Information.
6. To update emergency contacts, open Emergency Contacts and click Add or Edit.
7. Some changes such as legal name or tax withholding may require HR verification.
8. Click Submit after each section. You may receive a confirmation email.
9. Allow up to 2 business days for HR to approve restricted field changes.

Notes:
- Keep your mailing address current for payroll and benefits documents.
- Work email cannot be changed by employees; contact IT for work email updates.`,
  },
  {
    externalId: 'wd-help-003',
    title: 'How to Submit Expenses',
    category: 'Expenses',
    source: 'workday',
    sourceUrl: 'https://workday.example/help/wd-help-003',
    lastUpdated: '2025-01-12T14:00:00.000Z',
    tags: ['expenses', 'reimbursement', 'receipts', 'finance'],
    content: `How to Submit Expenses

1. Sign in to Workday and search for "Create Expense Report".
2. Click Create Expense Report and enter a report title and business purpose.
3. Click Add Expense to enter each line item.
4. Select the expense type: Meals, Travel, Lodging, Supplies, or Other.
5. Enter the amount, date, and merchant name for each expense.
6. Attach a receipt for any expense over $25. PDF or photo formats are accepted.
7. Select the correct cost center or project if prompted.
8. Review the report total and verify all receipts are attached.
9. Click Submit. Finance and your manager review the report for approval.
10. Reimbursement is deposited to your payroll account within 30 days of approval.

Notes:
- Submit expenses within 30 days of the purchase date.
- Personal expenses cannot be submitted on company expense reports.
- International expenses should list the original currency and exchange rate.`,
  },
  {
    externalId: 'wd-help-004',
    title: 'How to View Payslips',
    category: 'Payroll',
    source: 'workday',
    sourceUrl: 'https://workday.example/help/wd-help-004',
    lastUpdated: '2025-01-08T08:00:00.000Z',
    tags: ['payslip', 'payroll', 'pay stub', 'compensation'],
    content: `How to View Payslips

1. Sign in to Workday from your company portal.
2. Search for "Payslips" or navigate to Pay > Payslips.
3. Select the pay period you want to view from the list of available payslips.
4. Click View or Download to open the payslip as a PDF.
5. Review gross pay, deductions, taxes, and net pay for the period.
6. To see year-to-date totals, open the YTD Summary tab on the payslip detail page.
7. For direct deposit details, go to Pay > Payment Elections.
8. Payslips are available by 9:00 AM local time on each scheduled pay date.
9. Contact Payroll if a payslip is missing 24 hours after the pay date.

Notes:
- Payslips from prior years are available under Payment History.
- Printed payslips are not mailed unless required by local law.`,
  },
  {
    externalId: 'wd-help-005',
    title: 'How Approvals Work',
    category: 'Workflow',
    source: 'workday',
    sourceUrl: 'https://workday.example/help/wd-help-005',
    lastUpdated: '2025-01-14T11:00:00.000Z',
    tags: ['approvals', 'workflow', 'manager', 'inbox'],
    content: `How Approvals Work

1. When you submit a request in Workday, it routes to the appropriate approver based on company policy.
2. Common approval types include time off, expenses, job changes, and compensation actions.
3. Approvers receive notifications in their Workday Inbox and by email if enabled.
4. Managers approve or deny from Inbox > Awaiting My Action.
5. Multi-step approvals route sequentially: first manager, then department head, then HR or Finance.
6. If an approver is unavailable, Workday may route to their delegate or backup approver.
7. You can check request status under My Tasks or by opening the submitted item.
8. Denied requests include a comment explaining the reason when the approver provides one.
9. Approved requests update automatically in the related Workday module.

Notes:
- Approvers should respond within 3 business days.
- Escalation rules apply if a request is not actioned within 5 business days.
- Employees can cancel pending requests before final approval from My Tasks.`,
  },
];
