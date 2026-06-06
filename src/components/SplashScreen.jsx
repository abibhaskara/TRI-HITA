import { useEffect } from 'react';
import './SplashScreen.css';

const LETTERS = 'TRI-HITA'.split('');

export default function SplashScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="splash" aria-label="TRI-HITA loading">
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
      <div className="splash__tagline">Smart Plant Monitoring</div>
      <div className="splash__dot" />
    </div>
  );
}
