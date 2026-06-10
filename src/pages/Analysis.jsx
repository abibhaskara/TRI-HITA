import { useState, useCallback, useMemo, useRef } from 'react';
import { FileText, ChevronRight, MapPin, TrendingUp, AlertTriangle, ShieldCheck, Loader, Sun } from 'lucide-react';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LanguageContext';
import { parseGeminiError, executeWithGeminiFallback } from '../lib/geminiUtils';
import './Analysis.css';

const AI_INSIGHTS = [
  { type: 'success', icon: ShieldCheck, titleKey: 'canopy_coverage', topic: 'canopy coverage and growth patterns' },
  { type: 'warning', icon: AlertTriangle, titleKey: 'soil_moisture_alert', topic: 'soil moisture levels and irrigation needs' },
  { type: 'info',    icon: TrendingUp,   titleKey: 'harvest_forecast',    topic: 'harvest timeline and readiness' },
];


const DAY_ABBR = {
  Sun: { en: 'Sun', id: 'Min', ban: 'Rad' },
  Mon: { en: 'Mon', id: 'Sen', ban: 'Som' },
  Tue: { en: 'Tue', id: 'Sel', ban: 'Ang' },
  Wed: { en: 'Wed', id: 'Rab', ban: 'Bud' },
  Thu: { en: 'Thu', id: 'Kam', ban: 'Wra' },
  Fri: { en: 'Fri', id: 'Jum', ban: 'Suk' },
  Sat: { en: 'Sat', id: 'Sab', ban: 'San' },
};

const BALI_DAYS = ['Radite', 'Soma', 'Anggara', 'Buda', 'Wraspati', 'Sukra', 'Saniscara'];

function getDayName(date, langCode) {
  if (langCode === 'ban') return BALI_DAYS[date.getDay()];
  return date.toLocaleDateString(langCode === 'id' ? 'id-ID' : 'en-US', { weekday: 'long' });
}

const TAB_COLORS = {
  temp: { stroke: '#f59e0b', fill: '#f59e0b', unit: '°C' },
  rain: { stroke: '#3b82f6', fill: '#3b82f6', unit: '%' },
  wind: { stroke: '#14b8a6', fill: '#14b8a6', unit: ' km/h' },
};

export default function Analysis() {
  const { sensorData, esp32Data, healthScore, realWeather, esp32Connected, backendConnected } = useData();
  const { harvestInfo, cropProfile } = useUser();
  const { lang, t } = useLang();

  const [expandedInsight, setExpandedInsight] = useState(null);
  const [insightDescs,    setInsightDescs]    = useState({});
  const [insightLoading,  setInsightLoading]  = useState({});
  const [forecastTab,     setForecastTab]     = useState('temp');

  
  const insightDescsRef = useRef(insightDescs);
  insightDescsRef.current = insightDescs;

  const generateInsightDesc = useCallback(async (idx, topic) => {
    if (insightDescsRef.current[idx]) return; 
    setInsightLoading(prev => ({ ...prev, [idx]: true }));
    try {
      const isOnline        = esp32Connected || backendConnected;
      const currentTemp     = sensorData.temperature ?? (esp32Connected ? esp32Data.temperature : null);
      const currentHumidity = sensorData.humidity    ?? (esp32Connected ? esp32Data.humidity    : null);

      const context = `
Current Hardware Status: ${isOnline ? 'Online' : 'Offline'}
- Soil Moisture: ${isOnline && sensorData.soilMoisture != null ? sensorData.soilMoisture.toFixed(1) : 'N/A'}%
- Temperature: ${isOnline && currentTemp != null ? currentTemp.toFixed(1) : 'N/A'}°C
- Humidity: ${isOnline && currentHumidity != null ? currentHumidity.toFixed(0) : 'N/A'}%
- UV Index: ${isOnline && sensorData.uvIndex != null ? sensorData.uvIndex.toFixed(1) : 'N/A'}
- Health Score: ${isOnline && healthScore != null ? healthScore.toFixed(0) : 'N/A'}/100`;

      const prompt = `You are TRI-HITA AI agronomist. Write a concise 2-sentence insight about "${topic}" for a ${cropProfile?.cropName || 'General Crop'} (${cropProfile?.variety || 'Standard'}) plantation at its ${cropProfile?.growthStage || 'Vegetative'} stage.
 
Live data:
${context}
- Harvest: Day ${harvestInfo.currentDay}/${harvestInfo.totalCycleDays} (${harvestInfo.daysToHarvest} days left)
${realWeather?.description != null ? `- Weather: ${realWeather.description}` : ''}
 
Respond with ONLY the 2-sentence insight, no formatting.
IMPORTANT: Write entirely in ${lang === 'id' ? 'Indonesian (Bahasa Indonesia)' : lang === 'ban' ? 'Basa Bali (Balinese)' : 'English'}.`;

      const result = await executeWithGeminiFallback(
        { model: 'gemini-2.5-flash' },
        async (model) => await model.generateContent(prompt)
      );
      setInsightDescs(prev => ({ ...prev, [idx]: result.response.text() }));
    } catch (err) {
      setInsightDescs(prev => ({ ...prev, [idx]: parseGeminiError(err, t) }));
    } finally {
      setInsightLoading(prev => ({ ...prev, [idx]: false }));
    }
  }, [sensorData, esp32Data, esp32Connected, backendConnected, healthScore, harvestInfo, realWeather, cropProfile, lang, t]);

  const handleInsightClick = useCallback((idx, topic) => {
    setExpandedInsight(prev => {
      const isExpanded = prev === idx;
      if (!isExpanded) generateInsightDesc(idx, topic);
      return isExpanded ? null : idx;
    });
  }, [generateInsightDesc]);

  
  const tabStyle      = useMemo(() => TAB_COLORS[forecastTab] || TAB_COLORS.temp, [forecastTab]);
  const currentDayName = useMemo(() => getDayName(new Date(), lang), [lang]);

  return (
    <div className="page analysis">

      
      <div className="page-hero animate-in">
        <div className="page-hero__top">
          <div>
            <div className="page-hero__label">Tri-Hita</div>
            <h1 className="page-hero__title">{t('ai_analysis')}</h1>
            <p className="page-hero__sub">{t('smart_insights')}</p>
          </div>
          <FileText size={20} strokeWidth={1.5} style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
        </div>
      </div>

      
      <div className="page-body">

        
        <div className="section animate-in animate-delay-1">
          <div className="pg-section-header">
            <span className="section-title">{t('weather_forecast')}</span>
            <div className="forecast-loc">
              <MapPin size={11} />
              <span>
                {realWeather.city
                  ? `${realWeather.city}, ${realWeather.country || ''}`
                  : t('detecting_location')}
              </span>
            </div>
          </div>

          <div className="forecast-card">
            <div className="forecast-top-row">
              <div className="forecast-primary">
                <Sun size={36} strokeWidth={1.8} style={{ color: '#f59e0b' }} />
                <div className="forecast-temp-wrap">
                  <span className="forecast-temp-val">{Math.round(sensorData.temperature || 29)}</span>
                  <span className="forecast-temp-unit">°C</span>
                </div>
              </div>
              <div className="forecast-desc-group">
                <span className="forecast-desc-label">{t('weather_label')}</span>
                <span className="forecast-desc-day">{currentDayName}</span>
                <span className="forecast-desc-cond">{realWeather.description || t('partly_sunny')}</span>
              </div>
            </div>

            
            <div className="forecast-stats-grid">
              <div className="forecast-stat-col">
                <span className="forecast-stat-val">{realWeather.hourly?.[0]?.rain || 0}%</span>
                <span className="forecast-stat-lbl">{t('precipitation_label')}</span>
              </div>
              <div className="forecast-stat-col">
                <span className="forecast-stat-val">{sensorData.humidity || 70}%</span>
                <span className="forecast-stat-lbl">{t('humidity')}</span>
              </div>
              <div className="forecast-stat-col">
                <span className="forecast-stat-val">{realWeather.windSpeed || 18} km/h</span>
                <span className="forecast-stat-lbl">{t('wind_label')}</span>
              </div>
            </div>

            
            <div className="forecast-tabs">
              {['temp', 'rain', 'wind'].map(tab => (
                <button
                  key={tab}
                  className={`forecast-tab ${forecastTab === tab ? 'forecast-tab--active' : ''}`}
                  onClick={() => setForecastTab(tab)}
                >
                  {t(tab === 'temp' ? 'temperature_label' : tab === 'rain' ? 'precipitation_label' : 'wind_label')}
                </button>
              ))}
            </div>

            
            <div className="forecast-chart-wrap">
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={realWeather.hourly || []} margin={{ top: 18, right: 12, left: 12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={tabStyle.fill} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={tabStyle.fill} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val) => [`${val}${tabStyle.unit}`, forecastTab.toUpperCase()]}
                  />
                  <Area
                    type="monotone"
                    dataKey={forecastTab}
                    stroke={tabStyle.stroke}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#forecastGrad)"
                    label={{ position: 'top', fill: '#666', fontSize: 9, formatter: (val) => `${val}°` }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            
            <div className="forecast-daily-list">
              {realWeather.daily?.map((d, idx) => (
                <div key={idx} className={`forecast-daily-item ${idx === 0 ? 'forecast-daily-item--active' : ''}`}>
                  <span className="forecast-daily-day">
                    {DAY_ABBR[d.day]?.[lang] || DAY_ABBR[d.day]?.en || d.day}
                  </span>
                  <Sun size={16} strokeWidth={1.8} />
                  <span className="forecast-daily-temps">
                    <span className="forecast-daily-temp-max">{d.tempMax}°</span>
                    <span className="forecast-daily-temp-min">{d.tempMin}°</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        
        <div className="section animate-in animate-delay-2">
          <div className="section-header">
            <span className="section-title">{t('ai_insights')}</span>
          </div>
          <div className="analysis__insights">
            {AI_INSIGHTS.map((insight, idx) => {
              const Icon       = insight.icon;
              const isExpanded = expandedInsight === idx;
              return (
                <div
                  key={idx}
                  className={`analysis__insight analysis__insight--${insight.type} ${isExpanded ? 'analysis__insight--expanded' : ''}`}
                  onClick={() => handleInsightClick(idx, insight.topic)}
                >
                  <div className="analysis__insight-header">
                    <div className={`analysis__insight-icon analysis__insight-icon--${insight.type}`}>
                      <Icon size={16} strokeWidth={1.5} />
                    </div>
                    <span className="analysis__insight-title">{t(insight.titleKey)}</span>
                    <ChevronRight size={14} strokeWidth={1.5} className={`analysis__insight-chevron ${isExpanded ? 'analysis__insight-chevron--open' : ''}`} />
                  </div>
                  {isExpanded && (
                    <div 
                      className="analysis__insight-desc"
                      style={{ animation: `smoothHeight ${(insightLoading[idx] ? 20 : (insightDescs[idx]?.length || 10)) * 8 + 200}ms cubic-bezier(0.25, 1, 0.5, 1) forwards` }}
                    >
                      <div className="analysis__insight-desc-inner">
                        {insightLoading[idx]
                          ? <span className="analysis__insight-loading"><Loader size={12} className="analysis__spin" /> {t('generating_insight')}</span>
                          : insightDescs[idx]
                            ? insightDescs[idx].split('').map((ch, ci) => {
                                if (ch === ' ') return <span key={ci} className="analysis__insight-char"> </span>;
                                return (
                                  <span
                                    key={ci}
                                    className="analysis__insight-char"
                                    style={{ animationDelay: `${ci * 8}ms` }}
                                  >
                                    {ch}
                                  </span>
                                );
                              })
                            : '…'
                        }
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
