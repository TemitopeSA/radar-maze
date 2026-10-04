import { useEffect, useRef } from 'react';
import { StoreProvider, useStore } from '../state/store';
import { ToastProvider } from '../components/Toast';
import { Sidebar } from '../components/Sidebar';
import { HomePage } from '../features/home/HomePage';
import { AssumptionsPage } from '../features/assumptions/AssumptionsPage';
import { AssumptionDetailPage } from '../features/assumptions/AssumptionDetailPage';
import { StudyBuilder } from '../features/research/StudyBuilder';
import { ResearchProgress, useResearchSimulation } from '../features/research/ResearchProgress';
import { ResearchResults } from '../features/research/ResearchResults';
import { WrapUpPage } from '../features/wrap-up/WrapUpPage';
import { TourProvider } from '../features/tour/TourProvider';
import { TourOverlay } from '../features/tour/TourOverlay';
import { GuideButton, WelcomeModal } from '../features/tour/TourChrome';

function Screen() {
  const { state } = useStore();
  const mainRef = useRef<HTMLElement>(null);
  const key = `${state.screen}:${state.screen === 'detail' ? state.selectedId : ''}`;

  // Start each screen at the top, like a page navigation would.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [key]);

  useResearchSimulation();

  return (
    <main ref={mainRef} className="main" id="main" key={key}>
      {state.screen === 'home' && <HomePage />}
      {state.screen === 'assumptions' && <AssumptionsPage />}
      {state.screen === 'detail' && <AssumptionDetailPage />}
      {state.screen === 'builder' && <StudyBuilder />}
      {state.screen === 'progress' && <ResearchProgress />}
      {state.screen === 'results' && <ResearchResults />}
      {state.screen === 'wrapup' && <WrapUpPage />}
    </main>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <TourProvider>
          <a href="#main" className="skip-link">Skip to content</a>
          <div className="app">
            <Sidebar />
            <Screen />
          </div>
          <div className="disclosure" role="note">Concept prototype, not a Maze product</div>
          <GuideButton />
          <WelcomeModal />
          <TourOverlay />
        </TourProvider>
      </ToastProvider>
    </StoreProvider>
  );
}
