
import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Droplets, Thermometer, Sun, Wind, Leaf, Zap, Bell,
  ChevronDown, Calendar, X, Check, Plus, Wifi, Bluetooth,
  MapPin, Activity, UserCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNavDirection } from '../App';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LanguageContext';
import './Dashboard.css';
import hydroImg from '../assets/hydroponic.jpg';

/* ── Chart data ──────────────────────────────────────────── */
const TIME_RANGES = ['3D', '1W', '1M', 'Custom'];

const SENSOR_HISTORY = {
  '3D': [
    { time: 'Mon AM', soil: 65, uv: 3.2 },
    { time: 'Mon PM', soil: 62, uv: 6.8 },
    { time: 'Tue AM', soil: 70, uv: 2.9 },
    { time: 'Tue PM', soil: 58, uv: 7.5 },
    { time: 'Wed AM', soil: 72, uv: 3.5 },
    { time: 'Wed PM', soil: 66, uv: 5.1 },
  ],
  '1W': [
    { time: 'Mon', soil: 64, uv: 4.2 },
    { time: 'Tue', soil: 70, uv: 5.8 },
    { time: 'Wed', soil: 68, uv: 3.1 },
    { time: 'Thu', soil: 72, uv: 6.4 },
    { time: 'Fri', soil: 60, uv: 7.2 },
    { time: 'Sat', soil: 75, uv: 4.0 },
    { time: 'Sun', soil: 69, uv: 5.5 },
  ],
  '1M': [
    { time: 'W1', soil: 66, uv: 4.5 },
    { time: 'W2', soil: 71, uv: 5.2 },
    { time: 'W3', soil: 68, uv: 6.1 },
    { time: 'W4', soil: 74, uv: 4.8 },
  ],
};

function generateDailyData() {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      time: `${d.getMonth() + 1}/${d.getDate()}`,
      soil: Math.round(55 + Math.random() * 25),
      uv: +(1.5 + Math.random() * 7).toFixed(1),
    });
  }
  return data;
}
const DAILY_DATA = generateDailyData();

/* ── Helpers ─────────────────────────────────────────────── */
const fmt = (val, unit = '', decimals = 1) =>
  val != null ? `${parseFloat(val).toFixed(decimals)}${unit}` : null;

function getHealthColor(score) {
  if (score == null) return '#9ca3af';
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

export default function Dashboard() {
  const {
    realWeather, sensorData, alerts, markAlertRead,
    esp32Connected, esp32Data, healthScore, backendConnected,
  } = useData();
  const { user, harvestInfo } = useUser();
  const { t } = useLang();
  const navigate = useNavigate();
  const { onNavChange } = useNavDirection();

  const plantName = user?.plantName || 'Hydroponic';

  const goToAccount = () => {
    onNavChange('/account');
    navigate('/account');
  };

  /* ── State ───────────────────────────────────── */
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanPhase, setScanPhase] = useState('idle');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [chartRange, setChartRange] = useState('1W');
  const [chartDropOpen, setChartDropOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  /* ── Derived values ──────────────────────────── */
  const isOnline = backendConnected || esp32Connected;
  const unreadCount = alerts.filter(a => !a.read).length;

  // Weather-sourced (OpenWeather)
  const weatherTemp     = sensorData.temperature;
  const weatherHumidity = sensorData.humidity;
  const weatherWind     = sensorData.windSpeed;
  const weatherUV       = sensorData.uvIndex;

  // ESP32 preferred, OWM fallback
  const displayTemp     = esp32Connected && esp32Data.temperature != null ? esp32Data.temperature : weatherTemp;
  const displayHumidity = esp32Connected && esp32Data.humidity    != null ? esp32Data.humidity    : weatherHumidity;

  const harvestProgress = harvestInfo.currentDay && harvestInfo.totalCycleDays
    ? Math.min(100, (harvestInfo.currentDay / harvestInfo.totalCycleDays) * 100)
    : 0;

  const chartData = chartRange === 'Custom'
    ? (customFrom && customTo ? DAILY_DATA.filter(d => {
        const dt = new Date(d.time); return dt >= new Date(customFrom) && dt <= new Date(customTo);
      }) : [])
    : chartRange === '1M' ? DAILY_DATA : SENSOR_HISTORY[chartRange] || [];

  /* ── Actions ─────────────────────────────────── */
  const startScan = () => {
    setDropdownOpen(false);
    setScanPhase('scanning');
    setScanOpen(true);
    setTimeout(() => setScanPhase('failed'), 3000);
  };
  const retryScan = () => { setScanPhase('scanning'); setTimeout(() => setScanPhase('failed'), 3000); };
  const exitScan  = () => { setScanOpen(false); setScanPhase('idle'); };

  const runAnalysis = async () => {
    if (aiLoading) return;
    setAiLoading(true); setAiResult(null); setAiError(null);
    try {
      const activeAlerts = alerts.filter(a => !a.read)
        .map(a => `[${a.type.toUpperCase()}] ${a.title}`).join('\n') || 'None';
      const currentTemp     = displayTemp;
      const currentHumidity = displayHumidity;
      const prompt = `You are TRI-HITA AI, an expert agronomist. Analyze this real-time plantation data.

Plant: ${user?.plantName || 'Hydroponic'} (${user?.plantType || 'Hydroponic System'})
Harvest: Day ${harvestInfo.currentDay}/${harvestInfo.totalCycleDays} — ${harvestInfo.daysToHarvest} days left

Sensor Data:
- Soil Moisture: ${sensorData.soilMoisture != null ? sensorData.soilMoisture.toFixed(1) : 'N/A'}% (optimal 60–80%)
- Temperature: ${currentTemp != null ? currentTemp.toFixed(1) : 'N/A'}°C (optimal 24–32°C)
- Humidity: ${currentHumidity != null ? currentHumidity.toFixed(0) : 'N/A'}% (optimal 70–90%)
- UV Index: ${weatherUV != null ? weatherUV.toFixed(1) : 'N/A'}, Wind: ${weatherWind != null ? weatherWind.toFixed(0) : 'N/A'} km/h
- Health Score: ${healthScore != null ? healthScore.toFixed(0) : 'N/A'}/100
${realWeather.description != null ? `Weather: ${realWeather.description}` : ''}
Active Alerts: ${activeAlerts}

Give 3–5 bullet points using 🟢🟡🔴 for status. End with one action recommendation. Be very concise.`;

      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      setAiResult(result.response.text());
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('429') || msg.includes('quota')) setAiError('⚠️ Quota exceeded. Try again later.');
      else if (msg.includes('403') || msg.includes('API key')) setAiError('⚠️ API key error.');
      else setAiError(`Error: ${msg}`);
    } finally {
      setAiLoading(false);
    }
  };

  /* ── Sensor tiles ────────────────────────────── */
  const sensors = [
    {
      icon: Droplets, label: 'Soil',
      value: fmt(esp32Connected ? sensorData.soilMoisture : null, '%', 0),
      unit: '%', rawVal: esp32Connected ? sensorData.soilMoisture : null,
      ok: esp32Connected && sensorData.soilMoisture >= 60 && sensorData.soilMoisture <= 80,
      source: 'esp32',
    },
    {
      icon: Leaf, label: 'Health',
      value: healthScore != null ? `${Math.round(healthScore)}` : null,
      unit: '/100', rawVal: healthScore,
      ok: healthScore != null && healthScore >= 75,
      color: getHealthColor(healthScore),
      source: 'computed',
    },
    {
      icon: Sun, label: 'UV',
      value: fmt(weatherUV, '', 1),
      unit: '', rawVal: weatherUV,
      ok: weatherUV != null && weatherUV <= 7,
      source: 'weather',
    },
    {
      icon: Thermometer, label: 'Temp',
      value: fmt(displayTemp, '', 1),
      unit: '°C', rawVal: displayTemp,
      ok: displayTemp != null && displayTemp >= 24 && displayTemp <= 32,
      source: displayTemp != null ? (esp32Connected && esp32Data.temperature != null ? 'esp32' : 'weather') : 'none',
    },
    {
      icon: Droplets, label: 'Humidity',
      value: fmt(displayHumidity, '', 0),
      unit: '%', rawVal: displayHumidity,
      ok: displayHumidity != null && displayHumidity >= 70 && displayHumidity <= 90,
      source: displayHumidity != null ? (esp32Connected && esp32Data.humidity != null ? 'esp32' : 'weather') : 'none',
    },
    {
      icon: Wind, label: 'Wind',
      value: fmt(weatherWind, '', 0),
      unit: 'km/h', rawVal: weatherWind,
      ok: weatherWind != null,
      source: 'weather',
    },
  ];

  /* ── Render ──────────────────────────────────── */
  return (
    <div className="db-root">

      {/* ══════════════ NOTIFICATION PANEL ══════════════ */}
      {notifOpen && (
        <div className="db-overlay" onClick={() => setNotifOpen(false)}>
          <div className="db-notif" onClick={e => e.stopPropagation()}>
            <div className="db-notif__head">
              <span className="db-notif__title">{t('notifications')}</span>
              <button className="db-icon-btn" onClick={() => setNotifOpen(false)}><X size={16} /></button>
            </div>
            <div className="db-notif__list">
              {alerts.map(a => (
                <div
                  key={a.id}
                  className={`db-notif__item db-notif__item--${a.type} ${a.read ? 'db-notif__item--read' : ''}`}
                  onClick={() => markAlertRead(a.id)}
                >
                  <div className="db-notif__dot" />
                  <div className="db-notif__body">
                    <span className="db-notif__item-title">{a.title}</span>
                    <span className="db-notif__meta">{a.zone} · {a.time}</span>
                  </div>
                  {!a.read && <Check size={13} className="db-notif__check" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ SCAN OVERLAY ══════════════ */}
      {scanOpen && (
        <div className="db-scan-overlay">
          <button className="db-scan-close" onClick={exitScan}><X size={20} /></button>
          {scanPhase === 'scanning' ? (
            <div className="db-scan-body">
              <div className="db-scan-ring-wrap">
                <div className="db-scan-core"><Bluetooth size={28} /></div>
                <div className="db-scan-wave" />
                <div className="db-scan-wave db-scan-wave--2" />
              </div>
              <p className="db-scan-title">{t('scanning')}</p>
              <p className="db-scan-sub">{t('scanning_sub')}</p>
            </div>
          ) : (
            <div className="db-scan-body">
              <div className="db-scan-ring-wrap db-scan-ring-wrap--fail">
                <div className="db-scan-core db-scan-core--fail"><Wifi size={28} /></div>
              </div>
              <p className="db-scan-title">{t('no_device_found')}</p>
              <p className="db-scan-sub">{t('no_device_sub')}</p>
              <button className="db-scan-retry" onClick={retryScan}>{t('retry')}</button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ HERO ══════════════ */}
      <div className="db-hero">
        <img src={hydroImg} alt="" className="db-hero__bg" />
        <div className="db-hero__overlay" />

        <div className="db-hero__content">
          {/* Top bar */}
          <div className="db-hero__topbar">
            <div className="db-hero__left">
              <button className="db-hero__account" onClick={goToAccount}>
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt="account" className="db-hero__account-img" />
                  : <UserCircle size={20} />}
              </button>
              <div className="db-hero__location">
                <MapPin size={12} />
                <span>
                  {realWeather.city
                    ? `${realWeather.city}${realWeather.country ? ', ' + realWeather.country : ''}`
                    : 'Detecting location…'}
                </span>
              </div>
            </div>
            <button
              className={`db-hero__bell ${unreadCount > 0 ? 'db-hero__bell--active' : ''}`}
              onClick={() => setNotifOpen(true)}
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="db-hero__badge">{unreadCount}</span>}
            </button>
          </div>

          {/* Title */}
          <div className="db-hero__titles">
            <p className="db-hero__greeting">{t('welcome_to')}</p>
            <h1 className="db-hero__name">TRI-HITA</h1>
            {realWeather.emoji && (
              <p className="db-hero__weather">
                {realWeather.emoji} {realWeather.description}
              </p>
            )}
          </div>

          {/* Stat pills */}
          <div className="db-hero__pills">
            <div className="db-hero__pill">
              <span className="db-hero__pill-val">
                {healthScore != null ? `${Math.round(healthScore)}` : '—'}
              </span>
              <span className="db-hero__pill-lbl">Health</span>
            </div>
            <div className="db-hero__pill">
              <span className="db-hero__pill-val">{isOnline ? 'Online' : 'Offline'}</span>
              <span className="db-hero__pill-lbl">Status</span>
            </div>
            <div
              className="db-hero__pill db-hero__pill--clickable"
              onClick={() => setNotifOpen(true)}
            >
              <span className="db-hero__pill-val">{unreadCount}</span>
              <span className="db-hero__pill-lbl">{t('alerts')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════ BODY ══════════════ */}
      <div className="db-body">

        {/* ── Field selector ── */}
        <div className="db-section-hd">
          <span className="db-section-title">{t('your_field')}</span>
          <span className="db-section-tag">{realWeather.description || t('live_data')}</span>
        </div>

        <div className="db-field-selector">
          <button
            className={`db-field-btn ${dropdownOpen ? 'db-field-btn--open' : ''}`}
            onClick={() => setDropdownOpen(o => !o)}
          >
            <img src={hydroImg} alt="" className="db-field-btn__thumb" />
            <div className="db-field-btn__info">
              <span className="db-field-btn__name">{t('field_name')}</span>
              <span className="db-field-btn__desc">{t('field_desc')}</span>
            </div>
            <ChevronDown size={18} className={`db-field-btn__chev ${dropdownOpen ? 'db-field-btn__chev--open' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="db-field-drop">
              <button className="db-field-drop__item" onClick={startScan}>
                <div className="db-field-drop__icon"><Plus size={18} /></div>
                <div>
                  <span className="db-field-drop__item-name">{t('add_new_device')}</span>
                  <span className="db-field-drop__item-desc">{t('tap_to_scan')}</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* ── Live sensor card ── */}
        <div className="db-sensor-card">
          <div className="db-sensor-card__img-wrap">
            <img src={hydroImg} alt={t('field_name')} className="db-sensor-card__img" />
            <div className="db-sensor-card__live-badge">
              <span className="db-sensor-card__live-dot" />
              <Leaf size={11} />
              <span>{t('live')}</span>
            </div>
            {!esp32Connected && (
              <div className="db-sensor-card__offline-tag">
                ESP32 Offline — Soil N/A · Weather active
              </div>
            )}
          </div>

          <div className="db-sensors">
            {sensors.map(s => {
              const hasVal = s.rawVal != null;
              return (
                <div
                  key={s.label}
                  className={`db-sensor ${!hasVal ? 'db-sensor--na' : s.ok ? 'db-sensor--ok' : 'db-sensor--warn'}`}
                >
                  <div className="db-sensor__icon-wrap">
                    <s.icon size={15} strokeWidth={1.8} />
                  </div>
                  <div className="db-sensor__vals">
                    {hasVal ? (
                      <span className="db-sensor__val">
                        {s.value}
                        <span className="db-sensor__unit">{s.unit}</span>
                      </span>
                    ) : (
                      <span className="db-sensor__na">N/A</span>
                    )}
                  </div>
                  <span className="db-sensor__lbl">{s.label}</span>
                  {s.source === 'weather' && hasVal && (
                    <span className="db-sensor__src" title="OpenWeatherMap">🌤</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── AI Analysis ── */}
        <div
          className={`db-ai ${aiResult || aiLoading ? 'db-ai--active' : ''}`}
          onClick={runAnalysis}
          style={{ cursor: aiLoading ? 'wait' : 'pointer' }}
        >
          <div className="db-ai__header">
            <div className="db-ai__icon"><Zap size={16} /></div>
            <span className="db-ai__label">AI ANALYSIS</span>
            {aiLoading
              ? <div className="db-ai__spinner" />
              : <span className="db-ai__hint">{aiResult ? t('re_analyze') : t('tap_to_analyze')}</span>
            }
          </div>
          {aiLoading && <p className="db-ai__status">{t('analyzing')}</p>}
          {!aiLoading && aiResult && (
            <div className="db-ai__result">
              {aiResult.split('\n').filter(l => l.trim()).map((line, i) => (
                <p key={i} className="db-ai__line">
                  {line.split(/\*\*(.*?)\*\*/).map((p, j) =>
                    j % 2 === 1 ? <strong key={j}>{p}</strong> : p
                  )}
                </p>
              ))}
            </div>
          )}
          {!aiLoading && aiError && <p className="db-ai__error">{aiError}</p>}
          {!aiLoading && !aiResult && !aiError && (
            <p className="db-ai__desc">{t('ai_analysis_desc')}</p>
          )}
        </div>

        {/* ── Harvest Progress ── */}
        <div className="db-section-hd" style={{ marginTop: 8 }}>
          <span className="db-section-title">{t('harvest_progress')}</span>
          <span className="db-section-tag">{harvestInfo.daysToHarvest} {t('days_left')}</span>
        </div>

        <div className="db-harvest">
          <div className="db-harvest__top">
            <span className="db-harvest__name">{plantName}</span>
            <span className="db-harvest__pct">{harvestProgress.toFixed(0)}%</span>
          </div>
          <p className="db-harvest__sub">{t('day')} {harvestInfo.currentDay} {t('of')} {harvestInfo.totalCycleDays}</p>
          <div className="db-harvest__track">
            <div className="db-harvest__fill" style={{ width: `${harvestProgress}%` }} />
          </div>
        </div>

        {/* ── Sensor History Chart ── */}
        <div className="db-section-hd" style={{ marginTop: 8 }}>
          <span className="db-section-title">{t('sensor_history')}</span>
          <div className="db-range-wrap">
            <div className="db-range-tabs">
              {TIME_RANGES.map(r => (
                <button
                  key={r}
                  className={`db-range-tab ${chartRange === r ? 'db-range-tab--active' : ''}`}
                  onClick={() => setChartRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {chartRange === 'Custom' && (
          <div className="db-date-row">
            <div className="db-date-field">
              <Calendar size={13} />
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            </div>
            <span className="db-date-sep">→</span>
            <div className="db-date-field">
              <Calendar size={13} />
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} />
            </div>
          </div>
        )}

        <div className="db-chart">
          {chartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSoil" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0c5e4a" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#0c5e4a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradUV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#bbb', fontSize: 10 }} />
                  <YAxis yAxisId="l" axisLine={false} tickLine={false} tick={{ fill: '#bbb', fontSize: 10 }} domain={[40, 100]} />
                  <YAxis yAxisId="r" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#bbb', fontSize: 10 }} domain={[0, 12]} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #f0f0f0',
                      borderRadius: 12,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                      fontSize: 12,
                    }}
                  />
                  <Area yAxisId="l" type="monotone" dataKey="soil" name="Soil %" stroke="#0c5e4a" strokeWidth={2.2} fill="url(#gradSoil)" dot={false} activeDot={{ r: 5, fill: '#0c5e4a' }} />
                  <Area yAxisId="r" type="monotone" dataKey="uv" name="UV" stroke="#f59e0b" strokeWidth={2.2} fill="url(#gradUV)" dot={false} activeDot={{ r: 5, fill: '#f59e0b' }} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="db-chart__legend">
                <span><span className="db-legend-dot" style={{ background: '#0c5e4a' }} />Soil Moisture</span>
                <span><span className="db-legend-dot" style={{ background: '#f59e0b' }} />UV Index</span>
              </div>
            </>
          ) : (
            <div className="db-chart__empty">
              <span>📊</span>
              <p>{t('no_data')}</p>
              {chartRange === 'Custom' && <p className="db-chart__empty-hint">{t('select_date_range')}</p>}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
