import { useState, useMemo, useCallback } from 'react';
import {
  Droplets, Thermometer, Sun, Wind, Leaf, Zap, Bell,
  ChevronDown, Calendar, X, Check, Plus, MapPin, Activity, UserCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNavDirection } from '../App';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LanguageContext';
import { parseGeminiError, executeWithGeminiFallback } from '../lib/geminiUtils';
import './Dashboard.css';
import hydroImg from '../assets/hydroponic.jpg';


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


const DAILY_DATA = (() => {
  const now = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    return {
      time: `${d.getMonth() + 1}/${d.getDate()}`,
      soil: 55 + ((i * 7 + 13) % 26),         
      uv:   parseFloat((1.5 + (i * 3 % 7)).toFixed(1)),
    };
  });
})();


const fmt = (val, unit = '', decimals = 1) =>
  val != null ? `${parseFloat(val).toFixed(decimals)}${unit}` : null;

function getHealthColor(score) {
  if (score == null) return '#9ca3af';
  if (score >= 80)   return '#22c55e';
  if (score >= 60)   return '#f59e0b';
  return '#ef4444';
}

export default function Dashboard() {
  const {
    realWeather, sensorData, alerts, markAlertRead,
    esp32Connected, esp32Data, healthScore, backendConnected,
    startScan,
  } = useData();
  const { user, harvestInfo, cropProfile } = useUser();
  const { lang, t } = useLang();
  const navigate  = useNavigate();
  const { onNavChange } = useNavDirection();

  const plantName = cropProfile?.cropName || 'Hydroponic';

  
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult,  setAiResult]  = useState(null);
  const [aiError,   setAiError]   = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [chartRange,   setChartRange]   = useState('1W');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo,   setCustomTo]   = useState('');

  
  const isOnline    = backendConnected || esp32Connected;
  const unreadCount = useMemo(() => alerts.filter(a => !a.read).length, [alerts]);

  const weatherTemp     = sensorData.temperature;
  const weatherHumidity = sensorData.humidity;
  const weatherWind     = sensorData.windSpeed;
  const weatherUV       = sensorData.uvIndex;

  const displayTemp     = esp32Connected && esp32Data.temperature != null ? esp32Data.temperature : weatherTemp;
  const displayHumidity = esp32Connected && esp32Data.humidity    != null ? esp32Data.humidity    : weatherHumidity;

  const harvestProgress = harvestInfo.currentDay && harvestInfo.totalCycleDays
    ? Math.min(100, (harvestInfo.currentDay / harvestInfo.totalCycleDays) * 100)
    : 0;

  const chartData = useMemo(() => {
    if (chartRange === 'Custom') {
      return (customFrom && customTo)
        ? DAILY_DATA.filter(d => {
            const dt = new Date(d.time);
            return dt >= new Date(customFrom) && dt <= new Date(customTo);
          })
        : [];
    }
    return chartRange === '1M' ? DAILY_DATA : (SENSOR_HISTORY[chartRange] || []);
  }, [chartRange, customFrom, customTo]);

  
  const sensors = useMemo(() => [
    {
      icon: Droplets, label: t('soil'),
      value: fmt(esp32Connected ? sensorData.soilMoisture : null, '%', 0),
      unit: '%', rawVal: esp32Connected ? sensorData.soilMoisture : null,
      ok: esp32Connected && sensorData.soilMoisture >= 60 && sensorData.soilMoisture <= 80,
    },
    {
      icon: Leaf, label: t('health'),
      value: healthScore != null ? `${Math.round(healthScore)}` : null,
      unit: '/100', rawVal: healthScore,
      ok: healthScore != null && healthScore >= 75,
      color: getHealthColor(healthScore),
    },
    {
      icon: Sun, label: t('uv'),
      value: fmt(weatherUV, '', 1),
      unit: '', rawVal: weatherUV,
      ok: weatherUV != null && weatherUV <= 7,
    },
    {
      icon: Thermometer, label: t('temp'),
      value: fmt(displayTemp, '', 1),
      unit: '°C', rawVal: displayTemp,
      ok: displayTemp != null && displayTemp >= 24 && displayTemp <= 32,
    },
    {
      icon: Droplets, label: t('humidity'),
      value: fmt(displayHumidity, '', 0),
      unit: '%', rawVal: displayHumidity,
      ok: displayHumidity != null && displayHumidity >= 70 && displayHumidity <= 90,
    },
    {
      icon: Wind, label: t('wind'),
      value: fmt(weatherWind, '', 0),
      unit: 'km/h', rawVal: weatherWind,
      ok: weatherWind != null,
    },
  ], [t, esp32Connected, sensorData, healthScore, weatherUV, displayTemp, displayHumidity, weatherWind]);

  
  const runAnalysis = useCallback(async () => {
    if (aiLoading) return;
    setAiLoading(true); setAiResult(null); setAiError(null);
    try {
      const noneText   = lang === 'id' ? 'Tidak ada' : lang === 'ban' ? 'Nenten wenten' : 'None';
      const activeAlerts = alerts.filter(a => !a.read)
        .map(a => `[${a.type.toUpperCase()}] ${a.title}`).join('\n') || noneText;

      const prefixHealthy  = lang === 'id' ? 'SEHAT'     : lang === 'ban' ? 'BECIK'     : 'HEALTHY';
      const prefixWarning  = lang === 'id' ? 'PERINGATAN': lang === 'ban' ? 'PERINGATAN': 'WARNING';
      const prefixCritical = lang === 'id' ? 'KRITIS'    : lang === 'ban' ? 'KRITIS'    : 'CRITICAL';

      const prompt = `You are TRI-HITA AI, an expert agronomist. Analyze this real-time plantation data.

Plant: ${cropProfile?.cropName || 'Hydroponic'} (${cropProfile?.variety || 'Standard'}) — Stage: ${cropProfile?.growthStage || 'Vegetative'}
Harvest: Day ${harvestInfo.currentDay}/${harvestInfo.totalCycleDays} — ${harvestInfo.daysToHarvest} days left

Sensor Data:
- Soil Moisture: ${sensorData.soilMoisture != null ? sensorData.soilMoisture.toFixed(1) : 'N/A'}% (optimal: ${cropProfile?.useCustomThresholds ? cropProfile.optimalMoisture + '%' : '60–80%'})
- Temperature: ${displayTemp != null ? displayTemp.toFixed(1) : 'N/A'}°C (optimal: ${cropProfile?.useCustomThresholds ? cropProfile.optimalTemp + '°C' : '24–32°C'})
- Humidity: ${displayHumidity != null ? displayHumidity.toFixed(0) : 'N/A'}% (optimal: ${cropProfile?.useCustomThresholds ? cropProfile.optimalHumidity + '%' : '70–90%'})
- UV Index: ${weatherUV != null ? weatherUV.toFixed(1) : 'N/A'}, Wind: ${weatherWind != null ? weatherWind.toFixed(0) : 'N/A'} km/h
- Health Score: ${healthScore != null ? healthScore.toFixed(0) : 'N/A'}/100
${realWeather.description != null ? `Weather: ${realWeather.description}` : ''}
Active Alerts: ${activeAlerts}

Give 3–5 bullet points using [${prefixHealthy}], [${prefixWarning}], or [${prefixCritical}] prefixes. End with one action recommendation. Be concise.
IMPORTANT: Write entirely in ${lang === 'id' ? 'Indonesian (Bahasa Indonesia)' : lang === 'ban' ? 'Basa Bali (Balinese)' : 'English'}.`;

      const result = await executeWithGeminiFallback(
        { model: 'gemini-2.5-flash' },
        async (model) => await model.generateContent(prompt)
      );
      setAiResult(result.response.text());
    } catch (err) {
      setAiError(parseGeminiError(err, t));
    } finally {
      setAiLoading(false);
    }
  }, [aiLoading, lang, alerts, cropProfile, harvestInfo, sensorData, displayTemp, displayHumidity, weatherUV, weatherWind, healthScore, realWeather, t]);

  
  return (
    <div className="db-root">

      
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

      
      <div className="db-hero">
        <img src={hydroImg} alt="" className="db-hero__bg" />
        <div className="db-hero__overlay" />

        <div className="db-hero__content">
          
          <div className="db-hero__topbar">
            <div className="db-hero__left">
              <button
                className="db-hero__account"
                onClick={() => { onNavChange('/account'); navigate('/account'); }}
              >
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

          
          <div className="db-hero__titles">
            <p className="db-hero__greeting">{t('welcome_to')}</p>
            <h1 className="db-hero__name">TRI-HITA</h1>
            {realWeather.emoji && (
              <p className="db-hero__weather">
                {realWeather.emoji} {realWeather.description}
              </p>
            )}
          </div>

          
          <div className="db-hero__pills">
            <div className="db-hero__pill">
              <span className="db-hero__pill-val">
                {healthScore != null ? `${Math.round(healthScore)}` : '—'}
              </span>
              <span className="db-hero__pill-lbl">{t('health')}</span>
            </div>
            <div className="db-hero__pill">
              <span className="db-hero__pill-val">{isOnline ? t('connected') : t('offline')}</span>
              <span className="db-hero__pill-lbl">{t('status_label')}</span>
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

      
      <div className="db-body">

        
        <div className="db-section-hd">
          <span className="section-title">{t('your_field')}</span>
          <span className="db-section-tag">{realWeather.description || t('live_data')}</span>
        </div>

        <div className="db-field-selector">
          <button
            className={`db-field-btn ${dropdownOpen ? 'db-field-btn--open' : ''}`}
            onClick={() => setDropdownOpen(o => !o)}
          >
            <img src={hydroImg} alt="" className="db-field-btn__thumb" />
            <div className="db-field-btn__info">
              <span className="db-field-btn__name">{cropProfile?.cropName || t('field_name')}</span>
              <span className="db-field-btn__desc">{t('field_desc')}</span>
            </div>
            <ChevronDown size={18} className={`db-field-btn__chev ${dropdownOpen ? 'db-field-btn__chev--open' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="db-field-drop">
              <button className="db-field-drop__item" onClick={() => { setDropdownOpen(false); startScan(); }}>
                <div className="db-field-drop__icon"><Plus size={18} /></div>
                <div>
                  <span className="db-field-drop__item-name">{t('add_new_device')}</span>
                  <span className="db-field-drop__item-desc">{t('tap_to_scan')}</span>
                </div>
              </button>
            </div>
          )}
        </div>

        
        <div className="db-sensor-card">
          <div className="db-sensor-card__img-wrap">
            <img src={hydroImg} alt={cropProfile?.cropName || t('field_name')} className="db-sensor-card__img" />
            <div className="db-sensor-card__live-badge">
              <span className="db-sensor-card__live-dot" />
              <Leaf size={11} />
              <span>{t('live')}</span>
            </div>
            {!esp32Connected && (
              <div className="db-sensor-card__offline-tag">
                {t('esp32_offline_status')}
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
                  <s.icon size={15} strokeWidth={1.8} />
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
                </div>
              );
            })}
          </div>
        </div>

        
        <div
          className={`db-ai ${aiResult || aiLoading ? 'db-ai--active' : ''}`}
          onClick={runAnalysis}
          style={{ cursor: aiLoading ? 'wait' : 'pointer' }}
        >
          <div className="db-ai__header">
            <div className="db-ai__icon"><Zap size={16} /></div>
            <span className="db-ai__label">{t('ai_analysis').toUpperCase()}</span>
            {aiLoading
              ? <div className="db-ai__spinner" />
              : <span className="db-ai__hint">{aiResult ? t('re_analyze') : t('tap_to_analyze')}</span>
            }
          </div>
          {aiLoading && <p className="db-ai__status">{t('analyzing')}</p>}
          {!aiLoading && aiResult && (
            <div 
              className="db-ai__result"
              style={{ animation: `smoothHeight ${aiResult.length * 8 + 200}ms cubic-bezier(0.25, 1, 0.5, 1) forwards` }}
            >
              <div className="db-ai__result-inner">
                {(() => {
                  let charIndex = 0;
                  return aiResult.split('\n').filter(l => l.trim()).map((line, li) => {
                    
                    const parts = line.split(/(\*\*.*?\*\*)/);
                    return (
                      <p key={li} style={{ fontSize: '12.5px', color: '#333', lineHeight: 1.75, margin: '2px 0' }}>
                        {parts.map((part, pi) => {
                          const isBold = part.startsWith('**') && part.endsWith('**');
                          const text = isBold ? part.slice(2, -2) : part;
                          const chars = text.split('');
                          return chars.map((ch, ci) => {
                            const delay = charIndex++ * 8;
                            
                            if (ch === ' ') {
                              return <span key={`${pi}-${ci}`} className="db-ai__char"> </span>;
                            }
                            return (
                              <span
                                key={`${pi}-${ci}`}
                                className="db-ai__char"
                                style={{ animationDelay: `${delay}ms`, fontWeight: isBold ? 700 : 'inherit' }}
                              >
                                {ch}
                              </span>
                            );
                          });
                        })}
                      </p>
                    );
                  });
                })()}
              </div>
            </div>
          )}
          {!aiLoading && aiError  && <p className="db-ai__error">{aiError}</p>}
          {!aiLoading && !aiResult && !aiError && (
            <p className="db-ai__desc">{t('ai_analysis_desc')}</p>
          )}
        </div>

        
        <div className="db-section-hd" style={{ marginTop: 8 }}>
          <span className="section-title">{t('harvest_progress')}</span>
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

        
        <div className="db-section-hd" style={{ marginTop: 8 }}>
          <span className="section-title">{t('sensor_history')}</span>
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
                      <stop offset="5%"  stopColor="#0c5e4a" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#0c5e4a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradUV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#bbb', fontSize: 10 }} />
                  <YAxis yAxisId="l" axisLine={false} tickLine={false} tick={{ fill: '#bbb', fontSize: 10 }} domain={[40, 100]} />
                  <YAxis yAxisId="r" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#bbb', fontSize: 10 }} domain={[0, 12]} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff', border: '1px solid #f0f0f0',
                      borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: 12,
                    }}
                  />
                  <Area yAxisId="l" type="monotone" dataKey="soil" name="Soil %" stroke="#0c5e4a" strokeWidth={2.2} fill="url(#gradSoil)" dot={false} activeDot={{ r: 5, fill: '#0c5e4a' }} />
                  <Area yAxisId="r" type="monotone" dataKey="uv"   name="UV"     stroke="#f59e0b" strokeWidth={2.2} fill="url(#gradUV)"  dot={false} activeDot={{ r: 5, fill: '#f59e0b' }} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="db-chart__legend">
                <span><span className="db-legend-dot" style={{ background: '#0c5e4a' }} />{t('soil')}</span>
                <span><span className="db-legend-dot" style={{ background: '#f59e0b' }} />{t('uv')}</span>
              </div>
            </>
          ) : (
            <div className="db-chart__empty">
              <Activity size={24} style={{ opacity: 0.4, marginBottom: 8 }} />
              <p>{t('no_data')}</p>
              {chartRange === 'Custom' && <p className="db-chart__empty-hint">{t('select_date_range')}</p>}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
