import { readFileSync } from 'fs';
import { join } from 'path';
import { askQuestion } from './query.util';

const handbook = readFileSync(
  join(__dirname, '../../../../../../sample-data/acme-employee-handbook.txt'),
  'utf-8',
);

const chunks = [
  {
    content: handbook,
    chunkIndex: 0,
    document: { id: 'doc-1', title: 'acme-employee-handbook' },
  },
];

describe('askQuestion (RAG engine)', () => {
  it('answers vacation day questions', () => {
    const result = askQuestion('How many vacation days do employees get?', chunks);
    expect(result.suggestTicket).toBe(false);
    expect(result.answer.toLowerCase()).toContain('20 days');
    expect(result.answer.toLowerCase()).not.toContain('laptop');
  });

  it('answers short vacation policy questions', () => {
    const result = askQuestion('Vacation policy?', chunks);
    expect(result.suggestTicket).toBe(false);
    expect(result.answer.toLowerCase()).toMatch(/vacation|20 days/);
    expect(result.answer.toLowerCase()).not.toContain('laptop');
  });

  it('answers password policy questions', () => {
    const result = askQuestion('What is the password policy for company accounts?', chunks);
    expect(result.suggestTicket).toBe(false);
    expect(result.answer.toLowerCase()).toContain('12 characters');
    expect(result.answer.toLowerCase()).toContain('90 days');
    expect(result.answer.toLowerCase()).not.toContain('harassment');
  });

  it('answers remote work questions with full details', () => {
    const result = askQuestion('How do I request remote work?', chunks);
    expect(result.suggestTicket).toBe(false);
    expect(result.answer.toLowerCase()).toContain('three days');
    expect(result.answer.toLowerCase()).toContain('48 hours');
    expect(result.answer).toMatch(/according to/i);
  });

  it('answers expense reimbursement questions', () => {
    const result = askQuestion('What is the expense reimbursement process?', chunks);
    expect(result.suggestTicket).toBe(false);
    expect(result.answer.toLowerCase()).toContain('30 days');
    expect(result.answer.toLowerCase()).toContain('$25');
    expect(result.answer.toLowerCase()).not.toContain('password');
  });

  it('answers sick leave questions', () => {
    const result = askQuestion('How many sick leave days are available?', chunks);
    expect(result.suggestTicket).toBe(false);
    expect(result.answer.toLowerCase()).toContain('10 days');
  });

  it('handles greetings without suggesting a ticket', () => {
    const result = askQuestion('Hello!', chunks);
    expect(result.answer.toLowerCase()).toContain('hello');
    expect(result.suggestTicket).toBe(false);
  });

  it('suggests ticket for unrelated questions', () => {
    const result = askQuestion('What is the company stock option vesting schedule?', chunks);
    expect(result.suggestTicket).toBe(true);
  });
});
