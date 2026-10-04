import type { Assumption, Decision, HistoryEvent, Person, Quote, Study } from './types';

/** The fictional "now" for the whole prototype. Keeps every date deterministic. */
export const TODAY = '2026-10-02';

export const HERO_ID = 'a1';
export const RETEST_STUDY_ID = 's7';
export const PRICING_DECISION_ID = 'd1';

/** Monday of each weekly confidence snapshot, oldest first. */
export const WEEKS = ['2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28'];
/** Index of the weekly snapshot where Maze flagged the hero assumption. */
export const DRIFT_WEEK_INDEX = 5;

export const PEOPLE = {
  dana: { name: 'Dana Okafor', initials: 'DO', role: 'Head of Product' },
  marcus: { name: 'Marcus Chen', initials: 'MC', role: 'Product Manager, Invoicing' },
  priya: { name: 'Priya Raman', initials: 'PR', role: 'Research Lead' },
  leo: { name: 'Leo Martins', initials: 'LM', role: 'Growth PM' },
  sofia: { name: 'Sofia Alvarez', initials: 'SA', role: 'Design Lead' },
  jonah: { name: 'Jonah Weiss', initials: 'JW', role: 'Product Marketing' },
} satisfies Record<string, Person>;

export const OWNERS: Person[] = Object.values(PEOPLE);

export const HERO_STATEMENT = "SMB owners choose Lumen mainly because it's the cheapest option.";
export const PROPOSED_STATEMENT = 'SMB owners choose Lumen mainly for fast, reliable payouts; price is secondary.';
export const PROPOSED_CONFIDENCE = 82;

function v1(statement: string, confidence: number, date: string): Assumption['versions'] {
  return [{ version: 1, statement, confidence, date, reason: 'Original assumption' }];
}

function assumptions(): Assumption[] {
  const list: Omit<Assumption, 'versions'>[] = [
    {
      id: HERO_ID,
      statement: HERO_STATEMENT,
      category: 'Pricing',
      owner: PEOPLE.dana,
      confidence: 41,
      history: [78, 78, 74, 69, 63, 56, 49, 41],
      status: 'Drifting',
      lastValidated: '2025-11-12',
      expiresOn: '2026-11-12',
      evidenceCount: 14,
      decisionIds: ['d1'],
      studyIds: ['s1', 's3', 's4', 's5'],
      createdAt: '2025-03-10',
    },
    {
      id: 'a2',
      statement: 'Most users complete onboarding on desktop.',
      category: 'Product',
      owner: PEOPLE.sofia,
      confidence: 64,
      history: [66, 66, 65, 65, 65, 64, 64, 64],
      status: 'Expired',
      lastValidated: '2025-08-06',
      expiresOn: '2026-08-06',
      evidenceCount: 6,
      decisionIds: ['d3'],
      studyIds: ['s2'],
      createdAt: '2025-06-02',
    },
    {
      id: 'a3',
      statement: 'Invoicing is the #1 reason users open the app weekly.',
      category: 'Product',
      owner: PEOPLE.marcus,
      confidence: 86,
      history: [83, 84, 84, 85, 85, 86, 86, 86],
      status: 'Holding',
      lastValidated: '2026-09-03',
      expiresOn: '2027-03-03',
      evidenceCount: 11,
      decisionIds: ['d2'],
      studyIds: ['s3'],
      createdAt: '2025-04-14',
    },
    {
      id: 'a4',
      statement: 'Accountants influence the buying decision.',
      category: 'Customer',
      owner: PEOPLE.leo,
      confidence: 50,
      history: [50, 50, 50, 50, 50, 50, 50, 50],
      status: 'Untested',
      lastValidated: null,
      expiresOn: null,
      evidenceCount: 0,
      decisionIds: ['d5'],
      studyIds: [],
      createdAt: '2026-09-15',
    },
    {
      id: 'a5',
      statement: 'Owners reconcile their books at least once a week.',
      category: 'Customer',
      owner: PEOPLE.priya,
      confidence: 74,
      history: [73, 73, 74, 74, 73, 74, 74, 74],
      status: 'Holding',
      lastValidated: '2026-06-18',
      expiresOn: '2026-12-18',
      evidenceCount: 8,
      decisionIds: [],
      studyIds: ['s4'],
      createdAt: '2025-09-22',
    },
    {
      id: 'a6',
      statement: 'Businesses with 1–10 employees make up most new sign-ups.',
      category: 'Market',
      owner: PEOPLE.leo,
      confidence: 81,
      history: [79, 80, 80, 80, 81, 81, 81, 81],
      status: 'Holding',
      lastValidated: '2026-07-30',
      expiresOn: '2027-01-30',
      evidenceCount: 5,
      decisionIds: [],
      studyIds: [],
      createdAt: '2025-05-08',
    },
    {
      id: 'a7',
      statement: 'Card readers are an add-on purchase, not a reason to sign up.',
      category: 'Product',
      owner: PEOPLE.marcus,
      confidence: 70,
      history: [71, 71, 70, 70, 70, 70, 70, 70],
      status: 'Holding',
      lastValidated: '2026-04-22',
      expiresOn: '2026-10-22',
      evidenceCount: 4,
      decisionIds: [],
      studyIds: [],
      createdAt: '2025-11-03',
    },
    {
      id: 'a8',
      statement: 'SMB owners prefer monthly billing over annual plans.',
      category: 'Pricing',
      owner: PEOPLE.jonah,
      confidence: 77,
      history: [76, 76, 77, 77, 77, 77, 77, 77],
      status: 'Holding',
      lastValidated: '2026-05-12',
      expiresOn: '2026-11-12',
      evidenceCount: 7,
      decisionIds: ['d4'],
      studyIds: ['s1'],
      createdAt: '2025-03-10',
    },
    {
      id: 'a9',
      statement: 'Most owners manage their finances without a full-time bookkeeper.',
      category: 'Customer',
      owner: PEOPLE.priya,
      confidence: 72,
      history: [72, 72, 72, 71, 72, 72, 72, 72],
      status: 'Holding',
      lastValidated: '2026-02-26',
      expiresOn: '2026-11-26',
      evidenceCount: 6,
      decisionIds: [],
      studyIds: [],
      createdAt: '2025-07-17',
    },
    {
      id: 'a10',
      statement: 'In-app reminders increase on-time invoice payments.',
      category: 'Product',
      owner: PEOPLE.marcus,
      confidence: 79,
      history: [74, 75, 76, 77, 78, 78, 79, 79],
      status: 'Holding',
      lastValidated: '2026-08-27',
      expiresOn: '2027-02-27',
      evidenceCount: 9,
      decisionIds: ['d2'],
      studyIds: ['s6'],
      createdAt: '2026-01-12',
    },
    {
      id: 'a11',
      statement: 'Owners expect to set up an account in under 10 minutes.',
      category: 'Customer',
      owner: PEOPLE.sofia,
      confidence: 91,
      history: [88, 89, 89, 90, 90, 91, 91, 91],
      status: 'Holding',
      lastValidated: '2026-09-17',
      expiresOn: '2027-03-17',
      evidenceCount: 10,
      decisionIds: [],
      studyIds: ['s2'],
      createdAt: '2025-06-02',
    },
    {
      id: 'a12',
      statement: 'Free-plan users upgrade after sending 10 invoices.',
      category: 'Pricing',
      owner: PEOPLE.leo,
      confidence: 52,
      history: [70, 69, 66, 63, 60, 57, 54, 52],
      status: 'Drifting',
      lastValidated: '2026-01-20',
      expiresOn: '2026-12-20',
      evidenceCount: 6,
      decisionIds: [],
      studyIds: [],
      createdAt: '2025-10-06',
    },
    {
      id: 'a13',
      statement: 'Restaurants are our fastest-growing customer segment.',
      category: 'Market',
      owner: PEOPLE.jonah,
      confidence: 55,
      history: [72, 71, 68, 64, 61, 58, 56, 55],
      status: 'Drifting',
      lastValidated: '2025-12-04',
      expiresOn: '2026-12-04',
      evidenceCount: 5,
      decisionIds: [],
      studyIds: [],
      createdAt: '2025-08-19',
    },
    {
      id: 'a14',
      statement: 'Owners prefer email support over in-app chat.',
      category: 'Customer',
      owner: PEOPLE.priya,
      confidence: 60,
      history: [61, 61, 60, 60, 60, 60, 60, 60],
      status: 'Expired',
      lastValidated: '2025-06-24',
      expiresOn: '2026-06-24',
      evidenceCount: 3,
      decisionIds: [],
      studyIds: [],
      createdAt: '2025-04-01',
    },
  ];
  return list.map((a) => ({
    ...a,
    versions: v1(a.statement, a.id === HERO_ID ? 70 : a.history[0], a.createdAt),
  }));
}

function studies(): Study[] {
  return [
    {
      id: 's1',
      name: 'Why SMBs pick Lumen: pricing perception survey',
      type: 'Survey',
      date: '2025-11-12',
      participants: 186,
      targetParticipants: 186,
      status: 'Completed',
      objective: 'Understand why new small-business customers chose Lumen over their bank and other payment apps.',
      createdBy: PEOPLE.priya,
    },
    {
      id: 's2',
      name: 'Onboarding flow v3 prototype test',
      type: 'Prototype test',
      date: '2025-08-06',
      participants: 32,
      targetParticipants: 32,
      status: 'Completed',
      objective: 'Find where owners drop off when connecting a bank account during sign-up.',
      createdBy: PEOPLE.sofia,
    },
    {
      id: 's3',
      name: 'Switching stories: SMB owner interviews',
      type: 'AI-moderated interviews',
      date: '2026-08-20',
      participants: 64,
      targetParticipants: 64,
      status: 'Completed',
      objective: 'Hear how owners who switched to Lumen in the last six months made the decision.',
      createdBy: PEOPLE.priya,
    },
    {
      id: 's4',
      name: 'Payout experience pulse survey',
      type: 'Survey',
      date: '2026-09-10',
      participants: 118,
      targetParticipants: 118,
      status: 'Completed',
      objective: 'Measure satisfaction with payout timing and see which parts of getting paid matter most.',
      createdBy: PEOPLE.leo,
    },
    {
      id: 's5',
      name: 'Instant payouts prototype test',
      type: 'Prototype test',
      date: '2026-09-24',
      participants: 30,
      targetParticipants: 30,
      status: 'Completed',
      objective: 'Test whether owners understand the instant payout option and its fee before turning it on.',
      createdBy: PEOPLE.sofia,
    },
    {
      id: 's6',
      name: 'Invoice reminders concept test',
      type: 'Prototype test',
      date: '2026-09-28',
      participants: 24,
      targetParticipants: 40,
      status: 'Live',
      objective: 'Check whether automatic reminders feel helpful or pushy to the clients receiving them.',
      createdBy: PEOPLE.marcus,
    },
  ];
}

function quotes(): Quote[] {
  return [
    {
      id: 'q1', participant: 'Maria Gonzalez', role: 'Owner, neighborhood bakery (4 employees)', studyId: 's1',
      date: '2025-11-04', text: 'It was the cheapest I found.', assumptionId: HERO_ID, era: 'earlier', theme: 'Price',
    },
    {
      id: 'q2', participant: 'Tom Becker', role: 'Owner, auto repair shop (9 employees)', studyId: 's1',
      date: '2025-11-05', text: 'The lower fees made it an easy choice.', assumptionId: HERO_ID, era: 'earlier', theme: 'Price',
    },
    {
      id: 'q3', participant: 'Aisha Khan', role: 'Founder, online boutique (2 employees)', studyId: 's1',
      date: '2025-11-07', text: 'I was comparing costs before I signed up.', assumptionId: HERO_ID, era: 'earlier', theme: 'Price',
    },
    {
      id: 'q4', participant: 'Daniel Ortiz', role: 'Co-owner, coffee roastery (6 employees)', studyId: 's1',
      date: '2025-11-10', text: 'Your card fees were about half of what my bank was charging me.', assumptionId: HERO_ID, era: 'earlier', theme: 'Price',
    },
    {
      id: 'q5', participant: 'Jasmine Lee', role: 'Owner, food truck (3 employees)', studyId: 's3',
      date: '2026-08-14', clipTime: '06:14', text: 'I switched because payouts are instant.', assumptionId: HERO_ID, era: 'recent', theme: 'Payout speed',
      transcript: [
        { speaker: 'Maze AI', text: 'What made you decide to move your payments to Lumen?' },
        { speaker: 'Participant', text: 'Honestly? I switched because payouts are instant.' },
        { speaker: 'Participant', text: 'With my old provider I’d wait three days, and on a food truck I’m buying stock every morning.' },
        { speaker: 'Maze AI', text: 'How did price factor into that choice?' },
        { speaker: 'Participant', text: 'I looked at it, but the fees were close enough. Speed was the thing.' },
      ],
    },
    {
      id: 'q6', participant: 'Rafael Souza', role: 'Owner, landscaping company (12 employees)', studyId: 's3',
      date: '2026-08-17', clipTime: '11:02', text: 'Price matters less than getting paid fast.', assumptionId: HERO_ID, era: 'recent', theme: 'Payout speed',
      transcript: [
        { speaker: 'Maze AI', text: 'If you had to rank fees, payout speed and security, how would you order them?' },
        { speaker: 'Participant', text: 'Speed first. Price matters less than getting paid fast.' },
        { speaker: 'Participant', text: 'I’ve got twelve people to pay every Friday. A few cents on a fee doesn’t compare to that.' },
      ],
    },
    {
      id: 'q7', participant: 'Kevin O’Neill', role: 'Owner, plumbing business (7 employees)', studyId: 's3',
      date: '2026-08-19', clipTime: '18:40', text: 'When a payout was late last year I had to float payroll on my credit card. I’m not doing that again.', assumptionId: HERO_ID, era: 'recent', theme: 'Trust',
      transcript: [
        { speaker: 'Maze AI', text: 'Tell me about a time a payment issue affected your business.' },
        { speaker: 'Participant', text: 'When a payout was late last year I had to float payroll on my credit card.' },
        { speaker: 'Participant', text: 'I’m not doing that again. Reliability is the first thing I ask about now.' },
      ],
    },
    {
      id: 'q8', participant: 'Grace Whitfield', role: 'Owner, physical therapy studio (5 employees)', studyId: 's4',
      date: '2026-09-08', text: 'I need to know the money will arrive when you say it will.', assumptionId: HERO_ID, era: 'recent', theme: 'Trust',
    },
    {
      id: 'q9', participant: 'Nadia Petrova', role: 'Owner, nail salon (8 employees)', studyId: 's5',
      date: '2026-09-23', clipTime: '03:27', text: 'Seeing the money land the same afternoon is the whole reason I tried the instant option.', assumptionId: HERO_ID, era: 'recent', theme: 'Payout speed',
      transcript: [
        { speaker: 'Maze AI', text: 'You turned on instant payouts in the prototype. What made you choose that?' },
        { speaker: 'Participant', text: 'Seeing the money land the same afternoon is the whole reason I tried the instant option.' },
        { speaker: 'Participant', text: 'I’d pay a little extra for that. Not a lot, but a little.' },
      ],
    },
    {
      id: 'q10', participant: 'Chris Adeyemi', role: 'Owner, design studio (4 employees)', studyId: 's3',
      date: '2026-08-18', clipTime: '09:51', text: 'Monday morning I open Lumen to chase whoever hasn’t paid their invoice.', assumptionId: 'a3', era: 'recent', theme: 'Workflow',
      transcript: [
        { speaker: 'Maze AI', text: 'Walk me through a typical week with Lumen.' },
        { speaker: 'Participant', text: 'Monday morning I open Lumen to chase whoever hasn’t paid their invoice.' },
      ],
    },
    {
      id: 'q11', participant: 'Helen Brooks', role: 'Owner, florist (3 employees)', studyId: 's2',
      date: '2025-08-05', clipTime: '02:18', text: 'I set it up on my laptop at the shop. It was easier to see everything.', assumptionId: 'a2', era: 'earlier', theme: 'Device',
      transcript: [
        { speaker: 'Maze AI', text: 'Where did you complete sign-up?' },
        { speaker: 'Participant', text: 'I set it up on my laptop at the shop. It was easier to see everything.' },
      ],
    },
    {
      id: 'q12', participant: 'Omar Haddad', role: 'Owner, IT consultancy (2 employees)', studyId: 's6',
      date: '2026-09-29', text: 'The reminder nudged my client and I got paid two days early.', assumptionId: 'a10', era: 'recent', theme: 'Workflow',
    },
  ];
}

/** Quotes that only exist once the simulated re-test study has run. */
export const RETEST_QUOTES: Quote[] = [
  {
    id: 'q13', participant: 'Participant 07', role: 'Owner, catering business (14 employees)', studyId: RETEST_STUDY_ID,
    date: TODAY, clipTime: '04:52', text: 'I switched because payouts are instant.', assumptionId: HERO_ID, era: 'retest', theme: 'Payout speed',
    transcript: [
      { speaker: 'Maze AI', text: 'What initially made you consider Lumen?' },
      { speaker: 'Participant', text: 'I switched because payouts are instant. Catering means big upfront costs, so waiting days to get paid hurt.' },
    ],
  },
  {
    id: 'q14', participant: 'Participant 19', role: 'Owner, dental practice (22 employees)', studyId: RETEST_STUDY_ID,
    date: TODAY, clipTime: '07:31', text: 'I need to know the money will arrive when you say it will.', assumptionId: HERO_ID, era: 'retest', theme: 'Trust',
    transcript: [
      { speaker: 'Maze AI', text: 'What matters most when choosing a financial tool for your business?' },
      { speaker: 'Participant', text: 'I need to know the money will arrive when you say it will. Predictability beats everything else.' },
    ],
  },
  {
    id: 'q15', participant: 'Participant 33', role: 'Owner, bike repair shop (5 employees)', studyId: RETEST_STUDY_ID,
    date: TODAY, clipTime: '05:09', text: 'Price matters less than getting paid fast.', assumptionId: HERO_ID, era: 'retest', theme: 'Payout speed',
    transcript: [
      { speaker: 'Maze AI', text: 'How would you compare payout speed, fees, and security?' },
      { speaker: 'Participant', text: 'Price matters less than getting paid fast. If fees doubled I’d notice, but a small difference wouldn’t move me.' },
    ],
  },
];

function decisions(): Decision[] {
  return [
    {
      id: PRICING_DECISION_ID,
      title: 'Q2 pricing page: lead with “lowest fees”',
      owner: PEOPLE.jonah,
      date: '2026-03-18',
      rationale:
        'Our November 2025 pricing survey found that 64% of new customers named price as the main reason they chose Lumen. We made “Lowest fees for small business” the pricing page headline and the core message of Q2 paid campaigns.',
      impact: 'Pricing page headline, Q2 paid search ads, sales one-pager',
      assumptionIds: [HERO_ID],
      status: 'At risk',
    },
    {
      id: 'd2',
      title: 'Prioritize invoice reminders in the mobile app',
      owner: PEOPLE.marcus,
      date: '2026-06-02',
      rationale: 'Invoicing drives weekly visits, and reminders were the most requested invoicing feature in Q1 interviews.',
      impact: 'Mobile roadmap, H2',
      assumptionIds: ['a3', 'a10'],
      status: 'On track',
    },
    {
      id: 'd3',
      title: 'Design the onboarding redesign desktop-first',
      owner: PEOPLE.sofia,
      date: '2025-09-15',
      rationale: 'Most owners in the onboarding prototype test completed sign-up on a laptop.',
      impact: 'Onboarding redesign, Q4',
      assumptionIds: ['a2'],
      status: 'At risk',
    },
    {
      id: 'd4',
      title: 'Keep monthly billing as the default plan',
      owner: PEOPLE.jonah,
      date: '2026-05-20',
      rationale: 'Owners told us they avoid annual commitments while cash flow is unpredictable.',
      impact: 'Plans and checkout',
      assumptionIds: ['a8'],
      status: 'On track',
    },
    {
      id: 'd5',
      title: 'Pilot an accountant referral program',
      owner: PEOPLE.leo,
      date: '2026-09-15',
      rationale: 'Sales believes accountants recommend payment tools to their SMB clients.',
      impact: 'Partnerships, Q1 2027',
      assumptionIds: ['a4'],
      status: 'On track',
    },
  ];
}

function events(): HistoryEvent[] {
  return [
    { id: 'e1', assumptionId: HERO_ID, date: '2025-03-10', kind: 'created', title: 'Assumption added by Dana Okafor', detail: 'Starting confidence: 70. Based on win/loss notes from sales.' },
    { id: 'e2', assumptionId: HERO_ID, date: '2025-11-12', kind: 'validated', title: 'Validated by “Why SMBs pick Lumen” survey', detail: '186 participants. 64% named price as the main reason. Confidence 70 → 78.' },
    { id: 'e3', assumptionId: HERO_ID, date: '2026-03-18', kind: 'linked', title: 'Linked to decision “Q2 pricing page: lead with lowest fees”' },
    { id: 'e4', assumptionId: HERO_ID, date: '2026-08-24', kind: 'confidence', title: 'Confidence 78 → 74', detail: 'Switching stories interviews: payout speed came up more often than price.' },
    { id: 'e5', assumptionId: HERO_ID, date: '2026-09-14', kind: 'confidence', title: 'Confidence 63 → 56', detail: 'Payout experience survey: 22% named price as their main reason.' },
    { id: 'e6', assumptionId: HERO_ID, date: '2026-09-14', kind: 'drift', title: 'Maze flagged this assumption as Drifting', detail: 'Confidence fell below 60 and dropped more than 20 points in five weeks.' },
    { id: 'e7', assumptionId: HERO_ID, date: '2026-09-28', kind: 'confidence', title: 'Confidence 49 → 41', detail: 'Instant payouts prototype test: owners chose speed even with a fee.' },
    { id: 'e8', assumptionId: 'a2', date: '2025-06-02', kind: 'created', title: 'Assumption added by Sofia Alvarez' },
    { id: 'e9', assumptionId: 'a2', date: '2025-08-06', kind: 'validated', title: 'Validated by onboarding prototype test', detail: '32 participants. 72% completed sign-up on desktop.' },
    { id: 'e10', assumptionId: 'a2', date: '2026-08-06', kind: 'drift', title: 'Assumption expired', detail: 'No new evidence in 12 months.' },
    { id: 'e11', assumptionId: 'a4', date: '2026-09-15', kind: 'created', title: 'Assumption added by Leo Martins', detail: 'No evidence linked yet.' },
  ];
}

export function createSeed() {
  return {
    assumptions: assumptions(),
    studies: studies(),
    quotes: quotes(),
    decisions: decisions(),
    events: events(),
  };
}

export const SAMPLE_PRD = `PRD: Instant payouts for all plans (draft)
Owner: Leo Martins · Last edited Sep 30, 2026

Problem
Owners on the Starter plan wait 2–3 business days for payouts. Support tickets about payout timing doubled since June.

Why now
We think owners will pay a small fee to get their money the same day. Most Starter customers check their balance on their phone between jobs, so the toggle should live in the mobile app first.

Bets
- A flat 1% instant payout fee won't push owners to cheaper competitors.
- Owners check their balance on mobile more than on desktop.
- Faster payouts will reduce payout-related support tickets by at least 30%.

Out of scope
Changes to card processing fees.`;

export const EXTRACTED_FROM_PRD = [
  { statement: 'A flat 1% instant payout fee won’t push owners to cheaper competitors.', category: 'Pricing' as const, confidence: 60 },
  { statement: 'Owners check their balance on mobile more than on desktop.', category: 'Customer' as const, confidence: 70 },
  { statement: 'Faster payouts will reduce payout-related support tickets by at least 30%.', category: 'Product' as const, confidence: 55 },
];
