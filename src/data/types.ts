export type Status = 'Holding' | 'Drifting' | 'Expired' | 'Untested';
export type Category = 'Customer' | 'Market' | 'Product' | 'Pricing';

export interface Person {
  name: string;
  initials: string;
  role: string;
}

export interface AssumptionVersion {
  version: number;
  statement: string;
  confidence: number;
  date: string;
  reason: string;
  studyId?: string;
}

export interface Assumption {
  id: string;
  statement: string;
  category: Category;
  owner: Person;
  confidence: number;
  /** Eight weekly confidence snapshots, oldest first. */
  history: number[];
  /** Point added after the latest snapshot when a re-test is accepted. */
  retestPoint?: { date: string; value: number };
  status: Status;
  lastValidated: string | null;
  expiresOn: string | null;
  evidenceCount: number;
  decisionIds: string[];
  studyIds: string[];
  createdAt: string;
  versions: AssumptionVersion[];
}

export type StudyType = 'Survey' | 'Prototype test' | 'AI-moderated interviews' | 'Interviews + survey';
export type StudyStatus = 'Completed' | 'Live' | 'Draft';

export interface Study {
  id: string;
  name: string;
  type: StudyType;
  date: string;
  participants: number;
  targetParticipants: number;
  status: StudyStatus;
  objective: string;
  createdBy: Person;
  simulated?: boolean;
}

export type Theme = 'Price' | 'Payout speed' | 'Trust' | 'Workflow' | 'Device';

export interface Quote {
  id: string;
  participant: string;
  role: string;
  studyId: string;
  date: string;
  /** Position inside a session recording, when one exists. */
  clipTime?: string;
  text: string;
  assumptionId: string;
  era: 'earlier' | 'recent' | 'retest';
  theme: Theme;
  transcript?: { speaker: 'Maze AI' | 'Participant'; text: string }[];
}

export type DecisionStatus = 'On track' | 'At risk' | 'Needs review';

export interface Decision {
  id: string;
  title: string;
  owner: Person;
  date: string;
  rationale: string;
  impact: string;
  assumptionIds: string[];
  status: DecisionStatus;
}

export type EventKind = 'created' | 'validated' | 'linked' | 'confidence' | 'drift' | 'feedback' | 'research' | 'updated' | 'decision';

export interface HistoryEvent {
  id: string;
  assumptionId: string;
  date: string;
  kind: EventKind;
  title: string;
  detail?: string;
}
