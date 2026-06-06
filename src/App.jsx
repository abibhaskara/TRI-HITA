import { useState, useCallback, useRef, createContext, useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { DataProvider } from './context/DataContext';
import { UserProvider, useUser } from './context/UserContext';
import { LanguageProvider } from './context/LanguageContext';
import LivingNavbar from './components/LivingNavbar';
import AIChatbot from './components/AIChatbot';
import SplashScreen from './components/SplashScreen';

import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import Settings from './pages/Settings';
import Account from './pages/Account';
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
    transition: { duration: 0.35, ease: 'easeOut' },
  },
  exit: (dir) => ({
    x: dir >= 0 ? '-100%' : '100%',
    transition: { duration: 0.3, ease: 'easeIn' },
  }),
};

function AnimatedRoutes({ direction }) {
  const location = useLocation();

  return (
    <AnimatePresence initial={false} custom={direction} mode="wait">
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
  const [splashDone, setSplashDone] = useState(true);
  const [direction, setDirection] = useState(0);
  const location = useLocation();
  const prevIndexRef = useRef(ROUTE_ORDER.indexOf(location.pathname) !== -1 ? ROUTE_ORDER.indexOf(location.pathname) : 1);

  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  const isOnboarded = true;

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

  return (
    <>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}


      {isOnboarded && (
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
            </div>
          </div>
        </NavDirectionContext.Provider>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <DataProvider>
          <LanguageProvider>
            <AppShell />
          </LanguageProvider>
        </DataProvider>
      </UserProvider>
    </BrowserRouter>
  );
}
