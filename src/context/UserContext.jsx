import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'tri-hita_user';

const DEFAULT_USER = {
  name: 'Farmer Tri-Hita',
  email: 'farmer@tri-hita.ai',
  avatarUrl: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Sophie',
  onboarded: false,
  cropProfile: {
    cropName: 'Tomato',
    variety: 'Standard',
    growthStage: 'Vegetative',
    plantedAt: new Date().toISOString(),
    cycleDays: 90,
    irrigationMethod: 'Drip Irrigation',
    useCustomThresholds: false,
    optimalMoisture: 70,
    optimalTemp: 28,
    optimalHumidity: 80,
  }
};

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_USER;
  } catch {
    return DEFAULT_USER;
  }
}

function saveUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => loadUser());

  const updateUser = useCallback((partial) => {
    setUser(prev => {
      const next = { ...prev, ...partial };
      saveUser(next);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(DEFAULT_USER);
  }, []);

  const cropProfile = useMemo(() => {
    return user?.cropProfile || DEFAULT_USER.cropProfile;
  }, [user?.cropProfile]);

  const harvestInfo = useMemo(() => {
    const plantedAt = cropProfile?.plantedAt || new Date().toISOString();
    const totalCycleDays = Number(cropProfile?.cycleDays) || 90;
    const plantedDate = new Date(plantedAt);
    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    const currentDay = Math.max(1, Math.floor((now - plantedDate) / msPerDay));
    const capped = Math.min(currentDay, totalCycleDays);
    return {
      currentDay: capped,
      totalCycleDays,
      daysToHarvest: Math.max(0, totalCycleDays - capped),
    };
  }, [cropProfile?.plantedAt, cropProfile?.cycleDays]);

  return (
    <UserContext.Provider value={{ user, updateUser, logout, harvestInfo, cropProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
