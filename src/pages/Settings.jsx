import { useState } from 'react';
import { Settings as SettingsIcon, Bell, Globe, Info, RefreshCw, Sliders, ChevronRight, Battery, Wifi, Shield, LogOut, User, MapPin, Compass } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LanguageContext';
import './Settings.css';

export default function Settings() {
    const { alerts, unreadAlertCount, markAlertRead, locationConfig, updateLocationConfig } = useData();
    const { user, logout } = useUser();
    const { lang, changeLang, t } = useLang();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [autoIrrigation, setAutoIrrigation] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState('3');
    const [showAlerts, setShowAlerts] = useState(false);

    const [latInput, setLatInput] = useState(locationConfig?.latitude ?? '');
    const [lonInput, setLonInput] = useState(locationConfig?.longitude ?? '');
    const [locError, setLocError] = useState(null);
    const [locLoading, setLocLoading] = useState(false);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocError('Geolocation not supported');
            return;
        }
        setLocLoading(true);
        setLocError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = parseFloat(pos.coords.latitude.toFixed(6));
                const lon = parseFloat(pos.coords.longitude.toFixed(6));
                setLatInput(lat);
                setLonInput(lon);
                updateLocationConfig({ latitude: lat, longitude: lon });
                setLocLoading(false);
            },
            (err) => {
                setLocError('Gagal mendeteksi lokasi');
                setLocLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleLatChange = (e) => {
        const val = e.target.value;
        setLatInput(val);
        const parsed = parseFloat(val);
        if (!isNaN(parsed) && parsed >= -90 && parsed <= 90) {
            updateLocationConfig({ latitude: parsed });
        }
    };

    const handleLonChange = (e) => {
        const val = e.target.value;
        setLonInput(val);
        const parsed = parseFloat(val);
        if (!isNaN(parsed) && parsed >= -180 && parsed <= 180) {
            updateLocationConfig({ longitude: parsed });
        }
    };

    return (
        <div className="page settings">

            {/* Dark green hero header */}
            <div className="page-hero animate-in">
                <div className="page-hero__top">
                    <div>
                        <div className="page-hero__label">Tri-Hita</div>
                        <h1 className="page-hero__title">{t('settings_title')}</h1>
                        <p className="page-hero__sub">{t('system_config')}</p>
                    </div>
                    <div className="settings__header-icon">
                        <SettingsIcon size={20} strokeWidth={1.5} />
                    </div>
                </div>
            </div>

            {/* White body */}
            <div className="page-body">



            {/* Auto Irrigation */}
            <div className="section animate-in animate-delay-2">
                <div className="glass-card settings__option">
                    <div className="settings__option-info">
                        <Sliders size={18} strokeWidth={1.5} className="settings__option-icon" />
                        <div>
                            <span className="settings__option-label">{t('auto_irrigation')}</span>
                            <span className="settings__option-desc">{t('auto_irrigation_desc')}</span>
                        </div>
                    </div>
                    <label className="toggle">
                        <input type="checkbox" checked={autoIrrigation} onChange={() => setAutoIrrigation(!autoIrrigation)} />
                        <span className="toggle-slider" />
                    </label>
                </div>
            </div>


            {/* Notifications */}
            <div className="section animate-in animate-delay-4">
                <div className="section-header">
                    <span className="section-title">
                        <Bell size={14} strokeWidth={1.5} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        {t('notifications')}
                    </span>
                    {unreadAlertCount > 0 && (
                        <span className="badge badge--danger">{unreadAlertCount} new</span>
                    )}
                </div>

                <div className="glass-card settings__option" style={{ marginBottom: 'var(--space-md)' }}>
                    <div className="settings__option-info">
                        <Bell size={18} strokeWidth={1.5} className="settings__option-icon" />
                        <div>
                            <span className="settings__option-label">{t('push_notifications')}</span>
                            <span className="settings__option-desc">{t('receive_alerts')}</span>
                        </div>
                    </div>
                    <label className="toggle">
                        <input type="checkbox" checked={notificationsEnabled} onChange={() => setNotificationsEnabled(!notificationsEnabled)} />
                        <span className="toggle-slider" />
                    </label>
                </div>

                <button
                    className="glass-card settings__option settings__option--clickable"
                    onClick={() => setShowAlerts(!showAlerts)}
                >
                    <div className="settings__option-info">
                        <Bell size={18} strokeWidth={1.5} className="settings__option-icon" />
                        <div>
                            <span className="settings__option-label">{t('alert_history')}</span>
                            <span className="settings__option-desc">{alerts.length} {t('alerts')}</span>
                        </div>
                    </div>
                    <ChevronRight size={16} strokeWidth={1.5} className={`settings__chevron ${showAlerts ? 'settings__chevron--open' : ''}`} />
                </button>

                {showAlerts && (
                    <div className="settings__alerts animate-in">
                        {alerts.map(alert => (
                            <div
                                key={alert.id}
                                className={`settings__alert ${alert.read ? '' : 'settings__alert--unread'}`}
                                onClick={() => markAlertRead(alert.id)}
                            >
                                <span className={`badge ${alert.type === 'warning' ? 'badge--warning' : alert.type === 'danger' ? 'badge--danger' : alert.type === 'success' ? 'badge--success' : 'badge--info'}`}>
                                    {alert.type}
                                </span>
                                <div className="settings__alert-content">
                                    <span className="settings__alert-title">{alert.title}</span>
                                    <span className="settings__alert-meta">{alert.zone} • {alert.time}</span>
                                </div>
                                {!alert.read && <span className="settings__alert-dot" />}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* System Config */}
            <div className="section animate-in">
                <div className="section-header">
                    <span className="section-title">{t('system')}</span>
                </div>

                <div className="settings__options-group glass-card">
                    <div className="settings__option-row">
                        <RefreshCw size={16} strokeWidth={1.5} className="settings__option-icon--sm" />
                        <span className="settings__option-label">{t('refresh_interval')}</span>
                        <select
                            className="settings__select"
                            value={refreshInterval}
                            onChange={(e) => setRefreshInterval(e.target.value)}
                        >
                            <option value="1">1 sec</option>
                            <option value="3">3 sec</option>
                            <option value="5">5 sec</option>
                            <option value="10">10 sec</option>
                        </select>
                    </div>

                    <div className="settings__divider" />

                    <div className="settings__option-row">
                        <Globe size={16} strokeWidth={1.5} className="settings__option-icon--sm" />
                        <span className="settings__option-label">{t('language')}</span>
                        <select
                            className="settings__select"
                            value={lang}
                            onChange={(e) => changeLang(e.target.value)}
                        >
                            <option value="en">English</option>
                            <option value="id">Bahasa Indonesia</option>
                        </select>
                    </div>

                    <div className="settings__divider" />

                    <div className="settings__option-row">
                        <Wifi size={16} strokeWidth={1.5} className="settings__option-icon--sm" />
                        <span className="settings__option-label">{t('network_status')}</span>
                        <span className="badge badge--success">{t('connected')}</span>
                    </div>

                    <div className="settings__divider" />

                    <div className="settings__option-row">
                        <Battery size={16} strokeWidth={1.5} className="settings__option-icon--sm" />
                        <span className="settings__option-label">{t('battery')}</span>
                        <span className="settings__option-value">—</span>
                    </div>

                    <div className="settings__divider" />

                    <div className="settings__option-row">
                        <Shield size={16} strokeWidth={1.5} className="settings__option-icon--sm" />
                        <span className="settings__option-label">{t('firmware')}</span>
                        <span className="settings__option-value">v2.4.1</span>
                    </div>
                </div>
            </div>

            {/* Lokasi Alat (IoT) */}
            <div className="section animate-in">
                <div className="section-header">
                    <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={16} strokeWidth={1.5} />
                        {lang === 'id' ? 'Lokasi Alat (IoT)' : 'Device Location (IoT)'}
                    </span>
                </div>

                <div className="settings__options-group glass-card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                            <span className="settings__option-label" style={{ display: 'block' }}>
                                {lang === 'id' ? 'Kunci Lokasi' : 'Lock Location'}
                            </span>
                            <span className="settings__option-desc" style={{ display: 'block', marginTop: 2 }}>
                                {lang === 'id' 
                                    ? 'Kunci koordinat ramalan cuaca di satu titik' 
                                    : 'Lock forecast coordinates to a fixed point'}
                            </span>
                        </div>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={locationConfig.isLocked}
                                onChange={(e) => updateLocationConfig({ isLocked: e.target.checked })}
                            />
                            <span className="toggle-slider" />
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 11, color: '#888', fontWeight: 600, display: 'block', marginBottom: 4 }}>LATITUDE</label>
                            <input
                                type="number"
                                step="any"
                                className="settings__location-input"
                                value={latInput}
                                onChange={handleLatChange}
                                placeholder="-8.4095"
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: 10,
                                    border: '1.5px solid #e8e8e8',
                                    background: '#f9f9f9',
                                    color: '#333',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    outline: 'none',
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 11, color: '#888', fontWeight: 600, display: 'block', marginBottom: 4 }}>LONGITUDE</label>
                            <input
                                type="number"
                                step="any"
                                className="settings__location-input"
                                value={lonInput}
                                onChange={handleLonChange}
                                placeholder="115.1889"
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: 10,
                                    border: '1.5px solid #e8e8e8',
                                    background: '#f9f9f9',
                                    color: '#333',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    outline: 'none',
                                }}
                            />
                        </div>
                    </div>

                    <button
                        className="settings__location-btn"
                        onClick={handleGetCurrentLocation}
                        disabled={locLoading}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#0c5e4a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            opacity: locLoading ? 0.7 : 1,
                        }}
                    >
                        <Compass size={14} className={locLoading ? "animate-spin" : ""} style={{ animation: locLoading ? 'spin 1s linear infinite' : 'none' }} />
                        {locLoading 
                            ? (lang === 'id' ? 'Memindai...' : 'Scanning...') 
                            : (lang === 'id' ? 'Gunakan Lokasi Saat Ini' : 'Use Current Location')}
                    </button>
                    {locError && (
                        <div style={{ color: '#dc6b6b', fontSize: 11, marginTop: 6, fontWeight: 500 }}>
                            ⚠️ {locError}
                        </div>
                    )}
                </div>
            </div>

            {/* Account */}
            <div className="section animate-in">
                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px' }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: 'linear-gradient(135deg,rgba(12,94,74,0.2),rgba(42,209,171,0.08))',
                        border: '1px solid rgba(12,94,74,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <User size={18} strokeWidth={1.5} style={{ color: '#2ad1ab' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{user?.name || 'User'}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>{user?.email || '—'}</div>
                    </div>
                    <button
                        onClick={logout}
                        style={{
                            background: 'rgba(239,83,80,0.12)', border: '1px solid rgba(239,83,80,0.25)',
                            color: '#ef5350', borderRadius: 10, padding: '8px 14px',
                            fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        }}
                        title="Reset account data and re-run onboarding"
                    >
                        <LogOut size={14} strokeWidth={2} /> {t('reset')}
                    </button>
                </div>
            </div>

            {/* About */}
            <div className="section animate-in">
                <div className="glass-card settings__about">
                    <Info size={16} strokeWidth={1.5} className="settings__about-icon" />
                    <div>
                        <span className="settings__about-title">TRI-HITA</span>
                        <span className="settings__about-desc">{t('about_desc')}</span>
                        <span className="settings__about-version">Version 1.0.0 • © 2026</span>
                    </div>
                </div>
            </div>
            </div>{/* /page-body */}
        </div>
    );
}
