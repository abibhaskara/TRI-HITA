import { useState, useCallback } from 'react';
import {
  Settings as SettingsIcon, Bell, Globe, Info, RefreshCw,
  Sliders, ChevronRight, Battery, Wifi, Shield, LogOut,
  User, MapPin, Compass,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LanguageContext';
import './Settings.css';

export default function Settings() {
    const { alerts, unreadAlertCount, markAlertRead, locationConfig, updateLocationConfig } = useData();
    const { user, logout } = useUser();
    const { lang, changeLang, t } = useLang();

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [autoIrrigation,       setAutoIrrigation]       = useState(true);
    const [refreshInterval,      setRefreshInterval]      = useState('3');
    const [showAlerts,           setShowAlerts]           = useState(false);

    const [latInput,   setLatInput]   = useState(locationConfig?.latitude  ?? '');
    const [lonInput,   setLonInput]   = useState(locationConfig?.longitude ?? '');
    const [locError,   setLocError]   = useState(null);
    const [locLoading, setLocLoading] = useState(false);

    
    const handleCoordChange = useCallback((field, min, max, setValue) => (e) => {
        const val = e.target.value;
        setValue(val);
        const parsed = parseFloat(val);
        if (!isNaN(parsed) && parsed >= min && parsed <= max) {
            updateLocationConfig({ [field]: parsed });
        }
    }, [updateLocationConfig]);

    const handleGetCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) { setLocError('geolocation_unsupported'); return; }
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
            () => { setLocError('location_error'); setLocLoading(false); },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [updateLocationConfig]);

    return (
        <div className="page settings">

            
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

            
            <div className="page-body">

                
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
                            <input type="checkbox" checked={autoIrrigation} onChange={() => setAutoIrrigation(v => !v)} />
                            <span className="toggle-slider" />
                        </label>
                    </div>
                </div>

                
                <div className="section animate-in animate-delay-4">
                    <div className="section-header">
                        <span className="section-title">
                            <Bell size={14} strokeWidth={1.5} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                            {t('notifications')}
                        </span>
                        {unreadAlertCount > 0 && (
                            <span className="badge badge--danger">{unreadAlertCount} {t('new_alerts')}</span>
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
                            <input type="checkbox" checked={notificationsEnabled} onChange={() => setNotificationsEnabled(v => !v)} />
                            <span className="toggle-slider" />
                        </label>
                    </div>

                    <button
                        className="glass-card settings__option settings__option--clickable"
                        onClick={() => setShowAlerts(v => !v)}
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

                
                <div className="section animate-in">
                    <div className="section-header">
                        <span className="section-title">{t('system')}</span>
                    </div>
                    <div className="settings__options-group glass-card">
                        <div className="settings__option-row">
                            <RefreshCw size={16} strokeWidth={1.5} className="settings__option-icon--sm" />
                            <span className="settings__option-label">{t('refresh_interval')}</span>
                            <select className="settings__select" value={refreshInterval} onChange={(e) => setRefreshInterval(e.target.value)}>
                                <option value="1">1 {t('seconds_short')}</option>
                                <option value="3">3 {t('seconds_short')}</option>
                                <option value="5">5 {t('seconds_short')}</option>
                                <option value="10">10 {t('seconds_short')}</option>
                            </select>
                        </div>
                        <div className="settings__divider" />
                        <div className="settings__option-row">
                            <Globe size={16} strokeWidth={1.5} className="settings__option-icon--sm" />
                            <span className="settings__option-label">{t('language')}</span>
                            <select className="settings__select" value={lang} onChange={(e) => changeLang(e.target.value)}>
                                <option value="en">English</option>
                                <option value="id">Bahasa Indonesia</option>
                                <option value="ban">Basa Bali</option>
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

                
                <div className="section animate-in">
                    <div className="section-header">
                        <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={16} strokeWidth={1.5} />
                            {t('device_location')}
                        </span>
                    </div>

                    <div className="settings__options-group glass-card settings__loc-group">
                        <div className="settings__loc-lock-row">
                            <div>
                                <span className="settings__option-label">{t('lock_location')}</span>
                                <span className="settings__option-desc" style={{ display: 'block', marginTop: 2 }}>{t('lock_location_desc')}</span>
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

                        <div className="settings__loc-coords-row">
                            <div className="settings__loc-coord-field">
                                <label className="settings__loc-coord-label">LATITUDE</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="settings__loc-input"
                                    value={latInput}
                                    onChange={handleCoordChange('latitude', -90, 90, setLatInput)}
                                    placeholder="-8.4095"
                                />
                            </div>
                            <div className="settings__loc-coord-field">
                                <label className="settings__loc-coord-label">LONGITUDE</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="settings__loc-input"
                                    value={lonInput}
                                    onChange={handleCoordChange('longitude', -180, 180, setLonInput)}
                                    placeholder="115.1889"
                                />
                            </div>
                        </div>

                        <button
                            className="settings__loc-btn"
                            onClick={handleGetCurrentLocation}
                            disabled={locLoading}
                        >
                            <Compass size={14} className={locLoading ? 'settings__spin' : ''} />
                            {locLoading ? t('scanning') : t('use_current_location')}
                        </button>

                        {locError && (
                            <div className="settings__loc-error">⚠️ {t(locError)}</div>
                        )}
                    </div>
                </div>

                
                <div className="section animate-in">
                    <div className="glass-card settings__account-card">
                        <div className="settings__account-avatar">
                            <User size={18} strokeWidth={1.5} className="settings__account-avatar-icon" />
                        </div>
                        <div className="settings__account-info">
                            <span className="settings__account-name">{user?.name || 'User'}</span>
                            <span className="settings__account-email">{user?.email || '—'}</span>
                        </div>
                        <button
                            className="settings__account-logout"
                            onClick={logout}
                            title="Reset account data and re-run onboarding"
                        >
                            <LogOut size={14} strokeWidth={2} /> {t('reset')}
                        </button>
                    </div>
                </div>

                
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
            </div>
        </div>
    );
}
