import { useState, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Brain, Heart, Sun, Droplets, Zap, ChevronRight, MapPin, TrendingUp, AlertTriangle, ShieldCheck, Bug, Loader } from 'lucide-react';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LanguageContext';
import StatCard from '../components/StatCard';
import './Analysis.css';

const ZONE_COLORS = {
    A: '#0c5e4a',
    B: '#FF9800',
    C: '#26A69A',
    D: '#EF5350',
};

const ZONE_STATUS_MAP = {
    healthy: { labelKey: 'healthy', badge: 'badge--success' },
    warning: { labelKey: 'warning', badge: 'badge--warning' },
    critical: { labelKey: 'critical', badge: 'badge--danger' },
};

const AI_INSIGHTS = [
    {
        type: 'success',
        icon: ShieldCheck,
        titleKey: 'canopy_coverage',
        topic: 'canopy coverage and growth patterns',
    },
    {
        type: 'warning',
        icon: AlertTriangle,
        titleKey: 'soil_moisture_alert',
        topic: 'soil moisture levels and irrigation needs',
    },
    {
        type: 'info',
        icon: TrendingUp,
        titleKey: 'harvest_forecast',
        topic: 'harvest timeline and readiness',
    },
];

export default function Analysis() {
    const { sensorData, zones, esp32Data, healthScore, realWeather, esp32Connected, backendConnected } = useData();
    const { user, harvestInfo } = useUser();
    const { t } = useLang();
    const [selectedZone, setSelectedZone] = useState(null);
    const [expandedInsight, setExpandedInsight] = useState(null);
    const [insightDescs, setInsightDescs] = useState({});
    const [insightLoading, setInsightLoading] = useState({});
    const [forecastTab, setForecastTab] = useState('temp'); // 'temp' | 'rain' | 'wind'

    const generateInsightDesc = useCallback(async (idx, topic) => {
        if (insightDescs[idx]) return; // already generated
        setInsightLoading(prev => ({ ...prev, [idx]: true }));
        try {
            const isOnline = esp32Connected || backendConnected;
            const currentTemp = sensorData.temperature != null ? sensorData.temperature : (esp32Connected ? esp32Data.temperature : null);
            const currentHumidity = sensorData.humidity != null ? sensorData.humidity : (esp32Connected ? esp32Data.humidity : null);
            
            const context = `
Current Hardware Status: ${isOnline ? 'Online' : 'Offline'}
- Soil Moisture: ${isOnline && sensorData.soilMoisture != null ? sensorData.soilMoisture.toFixed(1) : 'N/A'}%
- Temperature: ${isOnline && currentTemp != null ? currentTemp.toFixed(1) : 'N/A'}°C
- Humidity: ${isOnline && currentHumidity != null ? currentHumidity.toFixed(0) : 'N/A'}%
- UV Index: ${isOnline && sensorData.uvIndex != null ? sensorData.uvIndex.toFixed(1) : 'N/A'}
- Health Score: ${isOnline && healthScore != null ? healthScore.toFixed(0) : 'N/A'}/100
`;
            const prompt = `You are TRI-HITA AI agronomist. Write a concise 2-sentence insight about "${topic}" for a ${user?.plantType || 'Hydroponic System'} plantation.
 
Live data:
${context}
- Harvest: Day ${harvestInfo.currentDay}/${harvestInfo.totalCycleDays} (${harvestInfo.daysToHarvest} days left)
${realWeather?.description != null ? `- Weather: ${realWeather.description}` : ''}
 
Respond with ONLY the 2-sentence insight, no formatting.`;

            const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            
            const result = await model.generateContent(prompt);
            setInsightDescs(prev => ({ ...prev, [idx]: result.response.text() }));
        } catch (err) {
            const msg = err.message || '';
            let friendly = 'Unable to generate insight. Please try again.';
            if (msg.includes('429') || msg.includes('quota') || msg.includes('Quota')) {
                friendly = '⚠️ Quota exceeded. Try again later or upgrade your Gemini API plan.';
            } else if (msg.includes('403') || msg.includes('API key') || msg.includes('leaked')) {
                friendly = '⚠️ Invalid API key. Please update your Gemini API key.';
            } else if (msg.includes('500') || msg.includes('503')) {
                friendly = '⚠️ Gemini service unavailable. Please try again later.';
            }
            setInsightDescs(prev => ({ ...prev, [idx]: friendly }));
        } finally {
            setInsightLoading(prev => ({ ...prev, [idx]: false }));
        }
    }, [sensorData, harvestInfo, user, realWeather, insightDescs]);

    const handleInsightClick = (idx, topic) => {
        const isExpanded = expandedInsight === idx;
        setExpandedInsight(isExpanded ? null : idx);
        if (!isExpanded) {
            generateInsightDesc(idx, topic);
        }
    };

    const getTabColor = () => {
        if (forecastTab === 'temp') return { stroke: '#f59e0b', fill: '#f59e0b', unit: '°C' };
        if (forecastTab === 'rain') return { stroke: '#3b82f6', fill: '#3b82f6', unit: '%' };
        return { stroke: '#14b8a6', fill: '#14b8a6', unit: ' km/h' };
    };

    const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const tabStyle = getTabColor();

    return (
        <div className="page analysis">
 
            {/* Dark green hero header */}
            <div className="page-hero animate-in">
                <div className="page-hero__top">
                    <div>
                        <div className="page-hero__label">Tri-Hita</div>
                        <h1 className="page-hero__title">{t('ai_analysis')}</h1>
                        <p className="page-hero__sub">{t('smart_insights')}</p>
                    </div>
                    <div className="analysis__brain-badge">
                        <Brain size={20} strokeWidth={1.5} />
                    </div>
                </div>
            </div>
 
            {/* White body */}
            <div className="page-body">
 
                {/* Weather Forecast Section */}
                <div className="section animate-in animate-delay-1">
                    <div className="pg-section-header">
                        <span className="pg-section-title">Weather Forecast</span>
                        <div className="forecast-loc">
                            <MapPin size={11} />
                            <span>
                                {realWeather.city
                                    ? `${realWeather.city}, ${realWeather.country || ''}`
                                    : 'Detecting location…'}
                            </span>
                        </div>
                    </div>

                    <div className="forecast-card">
                        <div className="forecast-top-row">
                            <div className="forecast-primary">
                                <span className="forecast-emoji">{realWeather.emoji || '☀️'}</span>
                                <div className="forecast-temp-wrap">
                                    <span className="forecast-temp-val">{Math.round(sensorData.temperature || 29)}</span>
                                    <span className="forecast-temp-unit">°C</span>
                                </div>
                            </div>
                            <div className="forecast-desc-group">
                                <span className="forecast-desc-label">WEATHER</span>
                                <span className="forecast-desc-day">{currentDayName}</span>
                                <span className="forecast-desc-cond">{realWeather.description || 'Partly sunny'}</span>
                            </div>
                        </div>

                        {/* Extra stats row */}
                        <div className="forecast-stats-grid">
                            <div className="forecast-stat-col">
                                <span className="forecast-stat-val">{realWeather.hourly?.[0]?.rain || 0}%</span>
                                <span className="forecast-stat-lbl">Precipitation</span>
                            </div>
                            <div className="forecast-stat-col">
                                <span className="forecast-stat-val">{sensorData.humidity || 70}%</span>
                                <span className="forecast-stat-lbl">Humidity</span>
                            </div>
                            <div className="forecast-stat-col">
                                <span className="forecast-stat-val">{realWeather.windSpeed || 18} km/h</span>
                                <span className="forecast-stat-lbl">Wind</span>
                            </div>
                        </div>

                        {/* Forecast Tabs */}
                        <div className="forecast-tabs">
                            <button
                                className={`forecast-tab ${forecastTab === 'temp' ? 'forecast-tab--active' : ''}`}
                                onClick={() => setForecastTab('temp')}
                            >
                                Temperature
                            </button>
                            <button
                                className={`forecast-tab ${forecastTab === 'rain' ? 'forecast-tab--active' : ''}`}
                                onClick={() => setForecastTab('rain')}
                            >
                                Precipitation
                            </button>
                            <button
                                className={`forecast-tab ${forecastTab === 'wind' ? 'forecast-tab--active' : ''}`}
                                onClick={() => setForecastTab('wind')}
                            >
                                Wind
                            </button>
                        </div>

                        {/* Forecast Chart */}
                        <div className="forecast-chart-wrap">
                            <ResponsiveContainer width="100%" height={120}>
                                <AreaChart data={realWeather.hourly || []} margin={{ top: 18, right: 12, left: 12, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={tabStyle.fill} stopOpacity={0.25} />
                                            <stop offset="95%" stopColor={tabStyle.fill} stopOpacity={0.01} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="time"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#888', fontSize: 10 }}
                                    />
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
                                        label={{
                                            position: 'top',
                                            fill: '#666',
                                            fontSize: 9,
                                            formatter: (val) => `${val}°`
                                        }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Daily weekly list */}
                        <div className="forecast-daily-list">
                            {realWeather.daily?.map((d, idx) => (
                                <div key={idx} className={`forecast-daily-item ${idx === 0 ? 'forecast-daily-item--active' : ''}`}>
                                    <span className="forecast-daily-day">{d.day}</span>
                                    <span className="forecast-daily-emoji">{d.emoji}</span>
                                    <span className="forecast-daily-temps">
                                        <span className="forecast-daily-temp-max">{d.tempMax}°</span>
                                        <span className="forecast-daily-temp-min">{d.tempMin}°</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* AI Insights */}
                <div className="section animate-in animate-delay-2">
                    <div className="section-header">
                        <span className="section-title">{t('ai_insights')}</span>
                    </div>
                    <div className="analysis__insights">
                        {AI_INSIGHTS.map((insight, idx) => {
                            const Icon = insight.icon;
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
                                        <p className="analysis__insight-desc">
                                            {insightLoading[idx]
                                                ? <span className="analysis__insight-loading"><Loader size={12} className="analysis__spin" /> {t('generating_insight')}</span>
                                                : insightDescs[idx] || '…'
                                            }
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>{/* /page-body */}
        </div>
    );
}
