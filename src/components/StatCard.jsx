import './StatCard.css';

export default function StatCard({ icon: Icon, label, value, unit, trend, status, compact, onClick }) {
    return (
        <div
            className={`stat-card ${status ? `stat-card--${status}` : ''} ${compact ? 'stat-card--compact' : ''} ${onClick ? 'stat-card--clickable' : ''}`}
            onClick={onClick}
        >
            {Icon && (
                <div className="stat-card__icon">
                    <Icon size={compact ? 16 : 18} strokeWidth={1.5} />
                </div>
            )}
            <div className="stat-card__value">
                {value}
                {unit && <span className="stat-card__unit">{unit}</span>}
            </div>
            <div className="stat-card__label">{label}</div>
            {trend !== undefined && (
                <div className={`stat-card__trend ${trend >= 0 ? 'stat-card__trend--up' : 'stat-card__trend--down'}`}>
                    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                </div>
            )}
        </div>
    );
}
