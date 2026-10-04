import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import {
  createSeed, HERO_ID, PRICING_DECISION_ID, PROPOSED_CONFIDENCE, PROPOSED_STATEMENT, RETEST_QUOTES, RETEST_STUDY_ID, TODAY, PEOPLE,
} from '../data/seed';
import type { Assumption, Category, Decision, HistoryEvent, Quote, Status, Study, StudyType } from '../data/types';

export type Screen = 'home' | 'assumptions' | 'detail' | 'builder' | 'progress' | 'results' | 'wrapup';
export type DetailTab = 'overview' | 'evidence' | 'decisions' | 'history';
export type SortKey = 'default' | 'confidence-asc' | 'confidence-desc' | 'validated-recent' | 'validated-oldest';
export type MethodId = 'interviews-survey' | 'interviews' | 'survey' | 'prototype';

export const METHODS: Record<MethodId, { label: string; studyType: StudyType; description: string }> = {
  'interviews-survey': {
    label: 'AI-moderated interviews + short survey',
    studyType: 'Interviews + survey',
    description: 'Combine open-ended responses about customer priorities with structured feedback to compare the importance of price, payout speed, and trust.',
  },
  interviews: {
    label: 'AI-moderated interviews',
    studyType: 'AI-moderated interviews',
    description: 'Deep, open-ended conversations. Rich reasons, but harder to compare drivers side by side.',
  },
  survey: {
    label: 'Survey',
    studyType: 'Survey',
    description: 'Fast, structured ranking of drivers. Shows what changed, but less about why.',
  },
  prototype: {
    label: 'Prototype test',
    studyType: 'Prototype test',
    description: 'Watch owners react to a pricing page that leads with speed. Best once you know what to test.',
  },
};

export interface Question { id: string; text: string; original?: string; flagged?: boolean }

export const LEADING_QUESTION = "How much do Lumen's low fees influence your decision to keep using it?";
export const BIAS_REWRITE = 'What factors influence your decision to keep using Lumen?';

const DEFAULT_OBJECTIVE = 'Find out what drives SMB owners to choose Lumen today, and how price ranks against payout speed and trust.';

function defaultQuestions(): Question[] {
  return [
    { id: 'qq1', text: 'What initially made you consider Lumen?' },
    { id: 'qq2', text: 'What matters most when choosing a financial tool for your business?' },
    { id: 'qq3', text: LEADING_QUESTION, flagged: true },
    { id: 'qq4', text: 'How would you compare payout speed, fees, and security?' },
    { id: 'qq5', text: 'Tell us about the last time a delayed payout affected your business.' },
    { id: 'qq6', text: 'What would make you consider switching to another provider?' },
  ];
}

export interface Filters { query: string; status: Status | 'all'; category: Category | 'all'; sort: SortKey }

export interface BuilderState {
  step: number;
  objective: string;
  method: MethodId;
  questions: Question[];
  bias: 'pending' | 'accepted' | 'kept';
  sampleSize: number;
  freshEyes: boolean;
}

export interface AppState {
  screen: Screen;
  selectedId: string;
  detailTab: DetailTab;
  assumptions: Assumption[];
  studies: Study[];
  quotes: Quote[];
  decisions: Decision[];
  events: HistoryEvent[];
  filters: Filters;
  builder: BuilderState;
  research: { phase: 'idle' | 'running' | 'done'; responses: number };
  proposal: { statement: string; confidence: number; edited: boolean };
  signalFeedback: null | { kind: 'agree' | 'disagree'; note?: string };
  journey: { openedHero: boolean; viewedEvidence: boolean; launched: boolean; accepted: boolean };
  nextId: number;
}

const DEFAULT_FILTERS: Filters = { query: '', status: 'all', category: 'all', sort: 'default' };

export function createInitialState(): AppState {
  return {
    screen: 'home',
    selectedId: HERO_ID,
    detailTab: 'overview',
    ...createSeed(),
    filters: DEFAULT_FILTERS,
    builder: {
      step: 0,
      objective: DEFAULT_OBJECTIVE,
      method: 'interviews-survey',
      questions: defaultQuestions(),
      bias: 'pending',
      sampleSize: 40,
      freshEyes: true,
    },
    research: { phase: 'idle', responses: 0 },
    proposal: { statement: PROPOSED_STATEMENT, confidence: PROPOSED_CONFIDENCE, edited: false },
    signalFeedback: null,
    journey: { openedHero: false, viewedEvidence: false, launched: false, accepted: false },
    nextId: 100,
  };
}

export interface NewAssumption { statement: string; category: Category; ownerName: string; confidence: number; expiresOn: string | null }

export type Action =
  | { type: 'navigate'; screen: Screen }
  | { type: 'openAssumption'; id: string; tab?: DetailTab }
  | { type: 'setTab'; tab: DetailTab }
  | { type: 'setFilters'; filters: Partial<Filters> }
  | { type: 'clearFilters' }
  | { type: 'addAssumptions'; items: NewAssumption[] }
  | { type: 'builder/set'; patch: Partial<Omit<BuilderState, 'questions'>> }
  | { type: 'builder/question'; id: string; text: string }
  | { type: 'builder/addQuestion' }
  | { type: 'builder/removeQuestion'; id: string }
  | { type: 'builder/bias'; resolution: 'accepted' | 'kept' }
  | { type: 'research/launch' }
  | { type: 'research/tick' }
  | { type: 'research/complete' }
  | { type: 'proposal/set'; statement: string; confidence: number }
  | { type: 'update/accept' }
  | { type: 'decision/markReview'; id: string }
  | { type: 'signal/feedback'; kind: 'agree' | 'disagree'; note?: string }
  | { type: 'reset' };

function statusFor(confidence: number): Status {
  return confidence >= 60 ? 'Holding' : 'Drifting';
}

function event(state: AppState, e: Omit<HistoryEvent, 'id'>): [HistoryEvent[], number] {
  return [[...state.events, { ...e, id: `e${state.nextId}` }], state.nextId + 1];
}

function completeResearch(state: AppState): AppState {
  return {
    ...state,
    research: { phase: 'done', responses: state.builder.sampleSize },
    studies: state.studies.map((s) =>
      s.id === RETEST_STUDY_ID ? { ...s, status: 'Completed', participants: state.builder.sampleSize } : s,
    ),
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'navigate':
      return { ...state, screen: action.screen };
    case 'openAssumption':
      return {
        ...state,
        screen: 'detail',
        selectedId: action.id,
        detailTab: action.tab ?? 'overview',
        journey: {
          ...state.journey,
          openedHero: state.journey.openedHero || action.id === HERO_ID,
          viewedEvidence: state.journey.viewedEvidence || (action.id === HERO_ID && action.tab === 'evidence'),
        },
      };
    case 'setTab':
      return {
        ...state,
        detailTab: action.tab,
        journey: {
          ...state.journey,
          viewedEvidence: state.journey.viewedEvidence || (state.selectedId === HERO_ID && action.tab === 'evidence'),
        },
      };
    case 'setFilters':
      return { ...state, filters: { ...state.filters, ...action.filters } };
    case 'clearFilters':
      return { ...state, filters: DEFAULT_FILTERS };
    case 'addAssumptions': {
      let nextId = state.nextId;
      const created: Assumption[] = action.items.map((item) => {
        const owner = Object.values(PEOPLE).find((p) => p.name === item.ownerName) ?? PEOPLE.dana;
        const id = `a${nextId++}`;
        return {
          id,
          statement: item.statement,
          category: item.category,
          owner,
          confidence: item.confidence,
          history: Array(8).fill(item.confidence),
          status: 'Untested',
          lastValidated: null,
          expiresOn: item.expiresOn,
          evidenceCount: 0,
          decisionIds: [],
          studyIds: [],
          createdAt: TODAY,
          versions: [{ version: 1, statement: item.statement, confidence: item.confidence, date: TODAY, reason: 'Original assumption' }],
        };
      });
      const events = [
        ...state.events,
        ...created.map((a, i) => ({
          id: `e${nextId + i}`, assumptionId: a.id, date: TODAY, kind: 'created' as const,
          title: `Assumption added by ${a.owner.name}`, detail: `Starting confidence: ${a.confidence}. No evidence linked yet.`,
        })),
      ];
      return { ...state, assumptions: [...created, ...state.assumptions], events, nextId: nextId + created.length };
    }
    case 'builder/set':
      return { ...state, builder: { ...state.builder, ...action.patch } };
    case 'builder/question':
      return {
        ...state,
        builder: { ...state.builder, questions: state.builder.questions.map((q) => (q.id === action.id ? { ...q, text: action.text } : q)) },
      };
    case 'builder/addQuestion':
      return {
        ...state,
        nextId: state.nextId + 1,
        builder: { ...state.builder, questions: [...state.builder.questions, { id: `qq${state.nextId}`, text: '' }] },
      };
    case 'builder/removeQuestion':
      return { ...state, builder: { ...state.builder, questions: state.builder.questions.filter((q) => q.id !== action.id) } };
    case 'builder/bias': {
      const accepted = action.resolution === 'accepted';
      return {
        ...state,
        builder: {
          ...state.builder,
          bias: action.resolution,
          questions: state.builder.questions.map((q) =>
            q.flagged ? { ...q, text: accepted ? BIAS_REWRITE : LEADING_QUESTION, original: LEADING_QUESTION } : q,
          ),
        },
      };
    }
    case 'research/launch': {
      if (state.research.phase !== 'idle') return state;
      const study: Study = {
        id: RETEST_STUDY_ID,
        name: 'Re-test: What drives SMB owners to choose Lumen?',
        type: METHODS[state.builder.method].studyType,
        date: TODAY,
        participants: 0,
        targetParticipants: state.builder.sampleSize,
        status: 'Live',
        objective: state.builder.objective,
        createdBy: PEOPLE.dana,
        simulated: true,
      };
      const [events, nextId] = event(state, {
        assumptionId: HERO_ID, date: TODAY, kind: 'research',
        title: 'Re-test launched with Maze',
        detail: `${METHODS[state.builder.method].label} · ${state.builder.sampleSize} SMB owners from the Maze panel${state.builder.freshEyes ? ' · Fresh Eyes on' : ''}.`,
      });
      return {
        ...state,
        studies: state.studies.some((s) => s.id === RETEST_STUDY_ID) ? state.studies : [study, ...state.studies],
        research: { phase: 'running', responses: 0 },
        journey: { ...state.journey, launched: true },
        events,
        nextId,
      };
    }
    case 'research/tick': {
      if (state.research.phase !== 'running') return state;
      const step = Math.max(1, Math.round(state.builder.sampleSize / 40));
      const responses = Math.min(state.builder.sampleSize, state.research.responses + step);
      if (responses >= state.builder.sampleSize) return completeResearch(state);
      return {
        ...state,
        research: { ...state.research, responses },
        studies: state.studies.map((s) => (s.id === RETEST_STUDY_ID ? { ...s, participants: responses } : s)),
      };
    }
    case 'research/complete':
      return state.research.phase === 'running' ? completeResearch(state) : state;
    case 'proposal/set':
      return { ...state, proposal: { statement: action.statement, confidence: action.confidence, edited: true } };
    case 'update/accept': {
      if (state.journey.accepted) return state;
      const { statement, confidence } = state.proposal;
      const status = statusFor(confidence);
      const quotesToAdd = RETEST_QUOTES.filter((q) => !state.quotes.some((x) => x.id === q.id));
      const assumptions = state.assumptions.map((a) => {
        if (a.id !== HERO_ID) return a;
        const current = a.versions[a.versions.length - 1];
        return {
          ...a,
          statement,
          confidence,
          status,
          lastValidated: TODAY,
          expiresOn: '2027-04-02',
          retestPoint: { date: TODAY, value: confidence },
          evidenceCount: a.evidenceCount + 1 + quotesToAdd.length,
          studyIds: a.studyIds.includes(RETEST_STUDY_ID) ? a.studyIds : [...a.studyIds, RETEST_STUDY_ID],
          versions: [
            ...a.versions,
            {
              version: current.version + 1,
              statement,
              confidence,
              date: TODAY,
              reason: `Re-test with ${state.builder.sampleSize} SMB owners found payout speed (46%) and trust (27%) outrank price (18%).`,
              studyId: RETEST_STUDY_ID,
            },
          ],
        };
      });
      const decisions = state.decisions.map((d) => (d.id === PRICING_DECISION_ID ? { ...d, status: 'Needs review' as const } : d));
      let nextId = state.nextId;
      const events: HistoryEvent[] = [
        ...state.events,
        { id: `e${nextId++}`, assumptionId: HERO_ID, date: TODAY, kind: 'updated', title: 'Updated assumption accepted (v2)', detail: `Confidence 41 → ${confidence}. Status: ${status}.` },
        { id: `e${nextId++}`, assumptionId: HERO_ID, date: TODAY, kind: 'decision', title: 'Q2 pricing page decision marked Needs review' },
      ];
      return {
        ...state,
        assumptions,
        decisions,
        events,
        nextId,
        quotes: [...state.quotes, ...quotesToAdd],
        journey: { ...state.journey, accepted: true },
      };
    }
    case 'decision/markReview': {
      const decision = state.decisions.find((d) => d.id === action.id);
      if (!decision || decision.status === 'Needs review') return state;
      const [events, nextId] = event(state, {
        assumptionId: decision.assumptionIds[0], date: TODAY, kind: 'decision', title: `“${decision.title}” marked Needs review`,
      });
      return { ...state, decisions: state.decisions.map((d) => (d.id === action.id ? { ...d, status: 'Needs review' } : d)), events, nextId };
    }
    case 'signal/feedback': {
      const [events, nextId] = event(state, {
        assumptionId: HERO_ID, date: TODAY, kind: 'feedback',
        title: action.kind === 'agree' ? 'Dana Okafor confirmed the drift signal' : 'Dana Okafor marked the drift signal for investigation',
        detail: action.note || undefined,
      });
      return { ...state, signalFeedback: { kind: action.kind, note: action.note }, events, nextId };
    }
    case 'reset':
      return createInitialState();
  }
}

const StoreContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export function getHero(state: AppState) {
  return state.assumptions.find((a) => a.id === HERO_ID)!;
}

export function countByStatus(assumptions: Assumption[]) {
  const counts: Record<Status, number> = { Holding: 0, Drifting: 0, Expired: 0, Untested: 0 };
  for (const a of assumptions) counts[a.status] += 1;
  return counts;
}
