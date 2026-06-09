import { useEffect, useState } from 'react';
import './SplashScreen.css';

export default function SplashScreen({ onDone }) {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2100);

    const doneTimer = setTimeout(onDone, 2600);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div className={`splash ${isFading ? 'splash--fading' : ''}`} aria-label="TRI-HITA loading">
      <div className="splash__logo-wrap">
        <div className="splash__logo-scale">
          <img
            src="/favicon.png"
            alt="TRI-HITA"
            className="splash__logo-img"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
