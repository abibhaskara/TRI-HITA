import { useEffect } from 'react';
import { useLang } from '../context/LanguageContext';
import './SplashScreen.css';

const LETTERS = 'TRI-HITA'.split('');

export default function SplashScreen({ onDone }) {
  const { t } = useLang();
  useEffect(() => {
    const timer = setTimeout(onDone, 2600); // 2.6s to allow the progress bar animation to complete smoothly
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="splash" aria-label="TRI-HITA loading">
      {/* Glowing atmospheric background orbs */}
      <div className="splash__glow-orb" />
      <div className="splash__glow-orb splash__glow-orb--2" />

      {/* Main Content */}
      <div className="splash__content">
        <div className="splash__logo">
          {LETTERS.map((l, i) => (
            <span
              key={i}
              className="splash__letter"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              {l}
            </span>
          ))}
        </div>
        
        <div className="splash__tagline">
          {t('tagline', 'Smart Plant Monitoring')}
        </div>

        {/* High-tech neon progress bar */}
        <div className="splash__loader-bar">
          <div className="splash__loader-progress" />
        </div>
      </div>
    </div>
  );
}
