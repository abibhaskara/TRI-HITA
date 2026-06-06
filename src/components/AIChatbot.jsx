import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LanguageContext';
import './AIChatbot.css';

const QUICK_PROMPTS = [
    "Analyze the overall plantation health.",
    "Are there any irrigation risks today?",
    "Project harvest readiness.",
];

function buildSystemContext(sensorData, esp32Data, healthScore, zones, alerts, harvestInfo, realWeather, lang, esp32Connected, backendConnected) {
    const zonesSummary = zones.map(z =>
        `Zone ${z.id} (${z.name}): ${z.area}, ${z.trees} trees, status=${z.status}`
    ).join('; ');

    const alertsSummary = alerts
        .filter(a => !a.read)
        .map(a => `[${a.type.toUpperCase()}] ${a.title}`)
        .join('; ') || 'No active alerts';

    const weatherContext = realWeather?.description != null
        ? `Location: ${realWeather.city || 'Unknown'}. Condition: ${realWeather.description}, Wind: ${realWeather.windSpeed} km/h`
        : `Simulated weather active.`;

    const currentTemp = sensorData.temperature != null ? sensorData.temperature : (esp32Connected ? esp32Data.temperature : null);
    const currentHumidity = sensorData.humidity != null ? sensorData.humidity : (esp32Connected ? esp32Data.humidity : null);

    return `You are TRI-HITA AI, an expert Agronomist and Data Analyst for a smart palm oil plantation.
Your core directive is to ANALYZE the provided telemetric data, IDENTIFY correlations, PREDICT risks (e.g., pests, drought), and RECOMMEND specific, actionable interventions. Do not just repeat the data — interpret it.

### LIVE TELEMETRY STREAM
- Soil Moisture: ${sensorData.soilMoisture != null ? sensorData.soilMoisture.toFixed(1) : 'N/A'}% (Optimal: 50-70%)
- Temperature: ${currentTemp != null ? currentTemp.toFixed(1) : 'N/A'}°C (Optimal: 24-32°C)
- Humidity: ${currentHumidity != null ? currentHumidity.toFixed(0) : 'N/A'}% (Optimal: 70-90%)
- UV Index: ${sensorData.uvIndex != null ? sensorData.uvIndex.toFixed(1) : 'N/A'}
- Wind Speed: ${sensorData.windSpeed != null ? sensorData.windSpeed.toFixed(0) : 'N/A'} km/h
- Overall Health Score: ${healthScore != null ? healthScore.toFixed(0) : 'N/A'}/100
- Rainfall Rate: ${sensorData.rainfall > 0 ? sensorData.rainfall.toFixed(1) + ' mm/h' : '0 mm/h'}

### ATMOSPHERIC CONTEXT
${weatherContext}

### HARVEST PROJECTION
Day ${harvestInfo.currentDay}/${harvestInfo.totalCycleDays}. Days until optimal harvest: ${harvestInfo.daysToHarvest}.

### CRITICAL ALERTS
${alertsSummary}

### INSTRUCTIONS:
1. Cross-reference soil moisture with rainfall/weather to advise on irrigation.
2. Evaluate temperature/humidity interplay to assess pest/fungal risks (e.g., Ganoderma).
3. Be concise, authoritative, and structure your analysis with bullet points and bold text for readability.
4. If asked a general question, synthesize a brief "State of the Plantation" report.
5. Use emojis strategically to signify status (🟢 🟡 🔴).
6. IMPORTANT: You must respond entirely in ${lang === 'id' ? 'Indonesian (Bahasa Indonesia)' : lang === 'ms' ? 'Malay (Bahasa Melayu)' : 'English'}.`;
}

export default function AIChatbot() {
    const { sensorData, zones, alerts, realWeather, esp32Data, healthScore, esp32Connected, backendConnected } = useData();
    const { harvestInfo } = useUser();
    const { lang, t } = useLang();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    // const [chat, setChat] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
    }, [isOpen]);

    // Initialize Gemini 2.5 Flash
    /*
    const initChat = () => {
        ...
    };
    */

    const sendMessage = async (text) => {
        const messageText = text || input.trim();
        if (!messageText || isLoading) return;

        setInput('');
        setError(null);

        const userMsg = { role: 'user', content: messageText, id: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const history = messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));

            const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-2.5-flash",
                systemInstruction: buildSystemContext(sensorData, esp32Data, healthScore, zones, alerts, harvestInfo, realWeather, lang, esp32Connected, backendConnected)
            });
            const chat = model.startChat({ history });
            const result = await chat.sendMessage(messageText);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: result.response.text(),
                id: Date.now() + 1,
            }]);
        } catch (err) {
            console.error("Gemini Error:", err);
            const is429 = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('QUOTA');
            const errMsg = err.message?.includes('API_KEY_INVALID')
                ? '⚠️ API Key is invalid. Check VITE_GEMINI_API_KEY.'
                : is429
                    ? '⚠️ Project quota exhausted. Try again later...'
                    : '⚠️ Analysis failed: ' + err.message;

            setError(errMsg);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: errMsg,
                id: Date.now() + 1,
                isError: true,
            }]);

            // Force re-init on next message if it was a critical error like 429
            // setChat(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleReset = () => {
        setMessages([]);
        // setChat(null);
        setError(null);
        // initChat();
    };

    return (
        <>
            <div className={`ai-chat-panel ${isOpen ? 'ai-chat-panel--open' : ''}`}>
                <div className="ai-chat-header">
                    <div className="ai-chat-header__info">
                        <div className="ai-chat-header__avatar">
                            <Sparkles size={16} strokeWidth={1.5} />
                        </div>
                        <div>
                            <div className="ai-chat-header__name">TRI-HITA AI Analyst</div>

                        </div>
                    </div>
                    <div className="ai-chat-header__actions">
                        {messages.length > 0 && (
                            <button className="ai-chat-icon-btn" onClick={handleReset} title="Reset Analysis">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                    <path d="M3 3v5h5" />
                                </svg>
                            </button>
                        )}
                        <button className="ai-chat-icon-btn" onClick={() => setIsOpen(false)}>
                            <ChevronDown size={18} strokeWidth={2} />
                        </button>
                    </div>
                </div>

                <div className="ai-chat-messages">
                    {messages.length === 0 && (
                        <div className="ai-chat-empty">
                            <div className="ai-chat-empty__icon">
                                <Sparkles size={28} strokeWidth={1.5} />
                            </div>
                            <div className="ai-chat-empty__title">{t('data_analysis_engine', 'Data Analysis Engine')}</div>
                            <div className="ai-chat-empty__desc">
                                {t('monitoring_telemetry', 'I am monitoring the live telemetry of your plantation. Ask me to deeply analyze the structural health, yield projections, or environmental risks.')}
                            </div>
                            <div className="ai-chat-quick-prompts">
                                {QUICK_PROMPTS.map((prompt, i) => (
                                    <button key={i} className="ai-chat-quick-btn" onClick={() => sendMessage(prompt)}>
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div key={msg.id} className={`ai-chat-message ai-chat-message--${msg.role} ${msg.isError ? 'ai-chat-message--error' : ''}`}>
                            {msg.role === 'assistant' && (
                                <div className="ai-chat-message__avatar">
                                    <Sparkles size={12} strokeWidth={1.5} />
                                </div>
                            )}
                            <div className="ai-chat-message__bubble ai-chat-message__bubble--markdown">
                                {/* Basic markdown rendering for bold text and line breaks that Gemini uses */}
                                {msg.content.split('\n').map((line, i) => (
                                    <span key={i}>
                                        {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                return <strong key={j}>{part.slice(2, -2)}</strong>;
                                            }
                                            return part;
                                        })}
                                        <br />
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="ai-chat-message ai-chat-message--assistant">
                            <div className="ai-chat-message__avatar"><Sparkles size={12} strokeWidth={1.5} /></div>
                            <div className="ai-chat-message__bubble ai-chat-message__bubble--loading">
                                <span /><span /><span />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="ai-chat-input-area">
                    {error && !messages.some(m => m.isError) && (
                        <div className="ai-chat-error">{error}</div>
                    )}
                    <div className="ai-chat-input-row">
                        <textarea
                            ref={inputRef}
                            className="ai-chat-input"
                            placeholder={t('request_telemetry', 'Request telemetry analysis…')}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            className={`ai-chat-send-btn ${(!input.trim() || isLoading) ? 'ai-chat-send-btn--disabled' : ''}`}
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading}
                        >
                            {isLoading ? <Loader2 size={16} strokeWidth={2} className="ai-chat-spinner" /> : <Send size={16} strokeWidth={2} />}
                        </button>
                    </div>
                </div>
            </div>

            <div
                className={`ai-chat-backdrop ${isOpen ? 'ai-chat-backdrop--open' : ''}`}
                onClick={() => setIsOpen(false)}
            />

            <button
                className={`ai-chat-fab ${isOpen ? 'ai-chat-fab--open' : ''}`}
                onClick={() => setIsOpen(v => !v)}
                aria-label="Open AI Analyst"
            >
                {isOpen ? <X size={22} strokeWidth={2} /> : <Bot size={22} strokeWidth={1.5} />}
            </button>
        </>
    );
}
