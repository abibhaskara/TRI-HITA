import { useData } from '../context/DataContext';
import { useLang } from '../context/LanguageContext';
import './SprinklerControl.css';

export default function SprinklerControl({ zoneId, zoneName }) {
    const { sprinklers, toggleSprinkler } = useData();
    const { t } = useLang();
    const isActive = sprinklers[zoneId];

    return (
        <div className={`sprinkler ${isActive ? 'sprinkler--active' : ''}`}>
            <div className="sprinkler__info">
                <div className="sprinkler__icon">
                    {isActive ? '💧' : '🚿'}
                </div>
                <div className="sprinkler__text">
                    <span className="sprinkler__name">{zoneName}</span>
                    <span className={`sprinkler__status ${isActive ? 'sprinkler__status--on' : ''}`}>
                        {isActive ? t('irrigating') : t('standby')}
                    </span>
                </div>
            </div>
            <label className="toggle">
                <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleSprinkler(zoneId)}
                />
                <span className="toggle-slider" />
            </label>
            {isActive && (
                <div className="sprinkler__wave">
                    <div className="sprinkler__wave-bar" />
                    <div className="sprinkler__wave-bar" />
                    <div className="sprinkler__wave-bar" />
                </div>
            )}
        </div>
    );
}
