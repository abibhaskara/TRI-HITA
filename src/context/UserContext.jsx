import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'tri-hita_user';

const PLANT_TYPES = {
  'Hydroponic System':    { cycleDays: 180, daysToHarvest: 30  },
  'Banana':      { cycleDays: 90,  daysToHarvest: 15  },
  'Dahlia':      { cycleDays: 60,  daysToHarvest: 10  },
  'Succulent':   { cycleDays: 365, daysToHarvest: 60  },
  'Pink Gerbera':{ cycleDays: 75,  daysToHarvest: 12  },
  'Nest Fern':   { cycleDays: 120, daysToHarvest: 20  },
  'Custom':      { cycleDays: 90,  daysToHarvest: 14  },
};

export { PLANT_TYPES };

const DEFAULT_USER = {
  name: 'Farmer Tri-Hita',
  email: 'farmer@tri-hita.ai',
  avatarUrl: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Sophie',
  plantName: 'My Hydroponic',
  plantType: 'Hydroponic System',
  plantedAt: new Date().toISOString(),
  onboarded: true,
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

  /** Computed harvest info derived from plant type & planted date */
  const harvestInfo = (() => {
    if (!user?.plantType || !user?.plantedAt) {
      return { currentDay: 40, totalCycleDays: 50, daysToHarvest: 10 };
    }
    const baseData = PLANT_TYPES[user.plantType] || PLANT_TYPES['Custom'];
    const totalCycleDays = (user.plantType === 'Custom' && user.customCycleDays) 
      ? Number(user.customCycleDays) 
      : baseData.cycleDays;

    const plantedDate = new Date(user.plantedAt);
    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    const currentDay = Math.max(1, Math.floor((now - plantedDate) / msPerDay));
    const capped = Math.min(currentDay, totalCycleDays);
    const daysLeft = Math.max(0, totalCycleDays - capped);
    return {
      currentDay: capped,
      totalCycleDays: totalCycleDays,
      daysToHarvest: daysLeft,
    };
  })();

  return (
    <UserContext.Provider value={{ user, updateUser, logout, harvestInfo }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
