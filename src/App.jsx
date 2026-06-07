import { useState, useCallback, useRef, createContext, useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { DataProvider, useData } from './context/DataContext';
import { UserProvider } from './context/UserContext';
import { LanguageProvider, useLang } from './context/LanguageContext';
import LivingNavbar from './components/LivingNavbar';
import AIChatbot from './components/AIChatbot';
import SplashScreen from './components/SplashScreen';
import { Bluetooth, Wifi, X } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import Settings from './pages/Settings';
import Account from './pages/Account';
import Onboarding from './pages/Onboarding';
import { useUser } from './context/UserContext';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

/* ── Route order — determines slide direction ───────────────── */
const ROUTE_ORDER = ['/account', '/', '/analysis', '/settings'];

export const NavDirectionContext = createContext({ direction: 0 });
export function useNavDirection() { return useContext(NavDirectionContext); }

/* ── Animated page wrapper ──────────────────────────────────── */
const variants = {
  enter: (dir) => ({
    x: dir >= 0 ? '100%' : '-100%',
  }),
  center: {
    x: 0,
    transition: {
      x: { type: 'spring', stiffness: 70, damping: 14, mass: 0.8 },
    },
  },
  exit: (dir) => ({
    x: dir >= 0 ? '-100%' : '100%',
    transition: {
      x: { type: 'spring', stiffness: 70, damping: 14, mass: 0.8 },
    },
  }),
};

function AnimatedRoutes({ direction }) {
  const location = useLocation();

  return (
    <AnimatePresence custom={direction} mode="popLayout">
      <motion.div
        key={location.pathname}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        style={{ width: '100%', willChange: 'transform, opacity' }}
      >
        <Routes location={location}>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/account"  element={<Account />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

/** Inner shell — reads user from context */
function AppShell() {
  const { user } = useUser();
  const [direction, setDirection] = useState(0);
  const location = useLocation();
  const prevIndexRef = useRef(ROUTE_ORDER.indexOf(location.pathname) !== -1 ? ROUTE_ORDER.indexOf(location.pathname) : 1);
  const { scanOpen, scanPhase, exitScan, retryScan } = useData();
  const { t } = useLang();

  // Track location changes to automatically compute slide transition direction
  useEffect(() => {
    const toPath = location.pathname;
    const toIndex = ROUTE_ORDER.indexOf(toPath);
    const fromIndex = prevIndexRef.current;
    if (toIndex !== -1 && toIndex !== fromIndex) {
      const dir = toIndex >= fromIndex ? 1 : -1;
      setDirection(dir);
      prevIndexRef.current = toIndex;
    }
  }, [location.pathname]);

  /* Called by LivingNavbar before navigating to compute direction */
  const handleNavChange = useCallback((toPath) => {
    const toIndex = ROUTE_ORDER.indexOf(toPath);
    const fromIndex = prevIndexRef.current;
    const dir = toIndex >= fromIndex ? 1 : -1;
    setDirection(dir);
    prevIndexRef.current = toIndex;
  }, []);

  if (!user?.onboarded) {
    return <Onboarding />;
  }

  return (
    <NavDirectionContext.Provider value={{ direction, onNavChange: handleNavChange }}>
      <div className="app-container" style={{ overflowX: 'hidden', overflowY: 'auto', position: 'relative', minHeight: '100dvh' }}>
        <AnimatedRoutes direction={direction} />
      </div>
      <div className="fixed-overlay-wrapper">
        <div className="fixed-overlay-content">
          <div className="fixed-nav-cluster">
            <LivingNavbar />
            <AIChatbot />
          </div>
          {scanOpen && (
            <div className="db-scan-overlay" style={{ pointerEvents: 'auto' }}>
              <button className="db-scan-close" onClick={exitScan}><X size={20} /></button>
              {scanPhase === 'scanning' ? (
                <div className="db-scan-body">
                  <div className="db-scan-ring-wrap">
                    <div className="db-scan-core"><Bluetooth size={28} /></div>
                    <div className="db-scan-wave" />
                    <div className="db-scan-wave db-scan-wave--2" />
                  </div>
                  <p className="db-scan-title">{t('scanning')}</p>
                  <p className="db-scan-sub">{t('scanning_sub')}</p>
                </div>
              ) : (
                <div className="db-scan-body">
                  <div className="db-scan-ring-wrap db-scan-ring-wrap--fail">
                    <div className="db-scan-core db-scan-core--fail"><Wifi size={28} /></div>
                  </div>
                  <p className="db-scan-title">{t('no_device_found')}</p>
                  <p className="db-scan-sub">{t('no_device_sub')}</p>
                  <button className="db-scan-retry" onClick={retryScan}>{t('retry')}</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </NavDirectionContext.Provider>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <LanguageProvider>
        <SplashScreen onDone={() => setShowSplash(false)} />
      </LanguageProvider>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <UserProvider>
          <LanguageProvider>
            <DataProvider>
              <AppShell />
            </DataProvider>
          </LanguageProvider>
        </UserProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
