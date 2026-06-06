import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getLatestObservations } from '../lib/api';
import { useMqtt } from '../lib/useMqtt';

const DataContext = createContext(null);

const LOCATION_KEY = 'tri-hita_location_config';

const DEFAULT_LOCATION = {
  isLocked: false,
  latitude: -8.409518, // Bali default
  longitude: 115.188919, // Bali default
};

function loadLocationConfig() {
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_LOCATION;
  } catch {
    return DEFAULT_LOCATION;
  }
}

const WEATHER_STATES = ['sunny', 'rainy', 'night'];

const ZONE_DATA = [
  { id: 'A', name: 'TRI-HITA 1', area: '12.5 ha', trees: 450, status: 'healthy' },
];

const GROWTH_DATA = [
  { month: 'Aug', growth: 72, target: 80 },
  { month: 'Sep', growth: 78, target: 80 },
  { month: 'Oct', growth: 85, target: 80 },
  { month: 'Nov', growth: 82, target: 85 },
  { month: 'Dec', growth: 90, target: 85 },
  { month: 'Jan', growth: 88, target: 85 },
  { month: 'Feb', growth: 92, target: 90 },
];

const ALERTS = [
  { id: 1, type: 'warning', title: 'Low soil moisture detected', zone: 'TRI-HITA 1', time: '12 min ago', read: false },
  { id: 2, type: 'danger', title: 'Possible pest activity', zone: 'TRI-HITA 1', time: '34 min ago', read: false },
  { id: 3, type: 'info', title: 'Irrigation cycle completed', zone: 'TRI-HITA 1', time: '1 hr ago', read: true },
  { id: 4, type: 'success', title: 'Growth target achieved', zone: 'TRI-HITA 1', time: '2 hr ago', read: true },
  { id: 5, type: 'warning', title: 'UV index high', zone: 'TRI-HITA 1', time: '3 hr ago', read: true },
];



/**
 * Compute plant health score (0–100) from sensor readings.
 *
 * Scoring per parameter — gaussian-like penalty the further from optimal:
 *   soilMoisture : optimal 60–80%  (palm oil range)
 *   humidity     : optimal 70–90%  (transpiration stress below 50%)
 *   temperature  : optimal 24–32°C (metabolic optimum)
 *   lightLevel   : passed as 0–100 normalised index from backend
 *
 * Weights reflect relative importance for palm oil health.
 */
function computeHealthScore({ soilMoisture, humidity, temperature, lightLevel }) {
  // Returns 0–100: 100 inside [lo, hi], linearly penalised outside
  const rangeScore = (val, lo, hi, warnLow, warnHigh) => {
    if (val == null) return null;
    if (val >= lo && val <= hi) return 100;
    if (val < lo)   return Math.max(0, 100 - ((lo - val)  / (lo - warnLow))  * 100);
    return           Math.max(0, 100 - ((val - hi)        / (warnHigh - hi)) * 100);
  };

  const soilScore  = rangeScore(soilMoisture, 60,  80,  20,  100);
  const humScore   = rangeScore(humidity,     70,  90,  30,  100);
  const tempScore  = rangeScore(temperature,  24,  32,  10,   45);
  const lightScore = rangeScore(lightLevel,   40,  80,   0,  100);

  let totalScore = 0;
  let totalWeight = 0;

  if (soilScore != null)  { totalScore += soilScore * 0.35;  totalWeight += 0.35; }
  if (humScore != null)   { totalScore += humScore * 0.25;   totalWeight += 0.25; }
  if (tempScore != null)  { totalScore += tempScore * 0.25;  totalWeight += 0.25; }
  if (lightScore != null) { totalScore += lightScore * 0.15; totalWeight += 0.15; }

  if (totalWeight === 0) return null;
  return parseFloat((totalScore / totalWeight).toFixed(0));
}



/**
 * WMO weather code → { description, emoji }
 * https://open-meteo.com/en/docs#weathervariables
 */
function getWmoInfo(code, isDay) {
  if (code === 0)          return { desc: 'Clear Sky',      emoji: isDay ? '☀️' : '🌙' };
  if (code <= 2)           return { desc: 'Partly Cloudy',  emoji: isDay ? '⛅' : '🌙' };
  if (code === 3)          return { desc: 'Overcast',        emoji: '☁️' };
  if (code <= 48)          return { desc: 'Foggy',           emoji: '🌫️' };
  if (code <= 57)          return { desc: 'Drizzle',         emoji: '🌦️' };
  if (code <= 67)          return { desc: 'Rain',            emoji: '🌧️' };
  if (code <= 77)          return { desc: 'Snow',            emoji: '❄️' };
  if (code <= 82)          return { desc: 'Rain Showers',    emoji: '🌧️' };
  if (code <= 86)          return { desc: 'Snow Showers',    emoji: '❄️' };
  return                          { desc: 'Thunderstorm',    emoji: '⛈️' };
}

/** WMO code + isDay → sunny / rainy / night theme state */
function mapWmoToTheme(code, isDay) {
  if (code >= 51) return 'rainy';   // all precipitation
  if (!isDay)     return 'night';
  return 'sunny';
}

export function DataProvider({ children }) {
  const [locationConfig, setLocationConfig] = useState(() => loadLocationConfig());

  const updateLocationConfig = useCallback((partial) => {
    setLocationConfig(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // ── ESP32 live data via MQTT over WebSocket ──────────────────────────────
  const { esp32Data, esp32Connected, esp32Error, toggleEsp32 } = useMqtt();
  const [weatherState, setWeatherState] = useState('sunny');
  const MOCK_DAILY = [
    { day: 'Sat', tempMax: 29, tempMin: 24, description: 'Partly sunny', emoji: '⛅' },
    { day: 'Sun', tempMax: 29, tempMin: 23, description: 'Sunny', emoji: '☀️' },
    { day: 'Mon', tempMax: 29, tempMin: 23, description: 'Rainy', emoji: '🌧️' },
    { day: 'Tue', tempMax: 29, tempMin: 23, description: 'Rainy', emoji: '🌧️' },
    { day: 'Wed', tempMax: 29, tempMin: 24, description: 'Partly sunny', emoji: '⛅' },
    { day: 'Thu', tempMax: 29, tempMin: 24, description: 'Partly sunny', emoji: '⛅' },
    { day: 'Fri', tempMax: 29, tempMin: 25, description: 'Rainy', emoji: '🌧️' },
    { day: 'Sat', tempMax: 30, tempMin: 25, description: 'Rainy', emoji: '🌧️' },
  ];

  const MOCK_HOURLY = [
    { time: '18.00', temp: 28, rain: 10, wind: 18 },
    { time: '21.00', temp: 27, rain: 20, wind: 15 },
    { time: '00.00', temp: 26, rain: 15, wind: 12 },
    { time: '03.00', temp: 25, rain: 10, wind: 10 },
    { time: '06.00', temp: 24, rain: 10, wind: 8 },
    { time: '09.00', temp: 26, rain: 5, wind: 14 },
    { time: '12.00', temp: 29, rain: 5, wind: 16 },
    { time: '15.00', temp: 29, rain: 10, wind: 18 },
  ];

  const [realWeather, setRealWeather] = useState({
    city: null,
    country: null,
    description: null,
    emoji: null,
    windSpeed: null,
    uvIndex: null,
    daily: MOCK_DAILY,
    hourly: MOCK_HOURLY,
    loading: true,
    error: null,
  });

  // All null until a real source provides the value:
  const [sensorData, setSensorData] = useState({
    soilMoisture: null,
    lightLevel:   null,
    uvIndex:      null,
    rainfall:     null,
    windSpeed:    null,
  });
  const [solarPower, setSolarPower] = useState({
    percentage:    null,
    solarOutput:   null,
    piezoOutput:   null,
    totalCapacity: 5.0,
    charging:      null,
  });
  const [sprinklers, setSprinklers] = useState({
    A: false, B: false, C: false, D: false,
  });
  const [zones] = useState(ZONE_DATA);
  const [growthData] = useState(GROWTH_DATA);
  const [alerts, setAlerts] = useState(ALERTS);
  // harvestInfo is now owned by UserContext (derived from plant type + plantedAt)


  // Backend integration
  const [nodes, setNodes] = useState([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const backendConnectedRef = useRef(false);

  const fetchSensorData = useCallback(async () => {
    try {
      const data = await getLatestObservations();
      if (!Array.isArray(data) || data.length === 0) return;

      const targetNodeId = 'b37eae24f4f1a39d49cd64a0a2c3430e';
      const node = data.find(n => n.node_id === targetNodeId || n.node === targetNodeId || n.id === targetNodeId) || data[0];

      if (node) {
        setSensorData(prev => ({
          ...prev,
          soilMoisture: node.soilMoisture != null ? parseFloat(node.soilMoisture.toFixed(1)) : prev.soilMoisture,
          lightLevel:   node.lightLevel != null ? parseFloat(node.lightLevel.toFixed(1)) : prev.lightLevel,
          temperature:  node.temperature != null ? parseFloat(node.temperature.toFixed(1)) : prev.temperature,
          humidity:     node.humidity != null ? parseFloat(node.humidity.toFixed(1)) : prev.humidity,
        }));
      }

      setNodes(data);

      if (!backendConnectedRef.current) {
        console.info(`[TRI-HITA API] Connected — ${data.length} node(s) online`);
        backendConnectedRef.current = true;
        setBackendConnected(true);
      }
    } catch (err) {
      if (backendConnectedRef.current) {
        console.warn('[TRI-HITA API] Backend unreachable — falling back to simulated data:', err.message);
        backendConnectedRef.current = false;
        setBackendConnected(false);
      }
    }
  }, []);

  // Poll backend every 10 seconds
  useEffect(() => {
    fetchSensorData();
    const poll = setInterval(fetchSensorData, 10_000);
    return () => clearInterval(poll);
  }, [fetchSensorData]);

  const fetchWeather = useCallback(async (lat, lon) => {
    console.log('[fetchWeather] Fetching weather for coordinates:', lat, lon);
    try {
      const owmKey = import.meta.env.VITE_OPENWEATHER_API_KEY || 'b37eae24f4f1a39d49cd64a0a2c3430e';
      const [weatherRes, forecastRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${owmKey}`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${owmKey}`)
      ]);

      if (!weatherRes.ok) throw new Error(`Weather error ${weatherRes.status}`);
      if (!forecastRes.ok) throw new Error(`Forecast error ${forecastRes.status}`);

      const weatherData = await weatherRes.json();
      const forecastData = await forecastRes.json();

      const temperature = weatherData.main?.temp != null ? parseFloat(weatherData.main.temp.toFixed(1)) : null;
      const humidity = weatherData.main?.humidity != null ? weatherData.main.humidity : null;
      const windSpeedMs = weatherData.wind?.speed != null ? weatherData.wind.speed : null; // m/s
      const windSpeedKmh = windSpeedMs != null ? Math.round(windSpeedMs * 3.6) : null; // convert to km/h
      const weatherCode = weatherData.weather && weatherData.weather[0] && weatherData.weather[0].id != null ? weatherData.weather[0].id : null;
      const isDay = weatherData.dt != null && weatherData.sys?.sunrise != null && weatherData.sys?.sunset != null 
        ? (weatherData.dt >= weatherData.sys.sunrise && weatherData.dt <= weatherData.sys.sunset) 
        : true;

      // Estimate UV index from current time of day if unavailable
      const uvIndex = isDay ? 6.5 : 0;

      const convertOwmToWmo = (code) => {
        if (code >= 200 && code < 300) return 95;
        if (code >= 300 && code < 400) return 51;
        if (code >= 500 && code < 600) return 61;
        if (code >= 600 && code < 700) return 71;
        if (code >= 700 && code < 800) return 45;
        if (code === 800) return 0;
        if (code === 801 || code === 802) return 1;
        if (code === 803 || code === 804) return 3;
        return 0;
      };

      const wmoCode = convertOwmToWmo(weatherCode);
      const { desc, emoji } = getWmoInfo(wmoCode, isDay);
      const theme = mapWmoToTheme(wmoCode, isDay);

      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyMap = {};
      
      if (forecastData.list) {
        forecastData.list.forEach(item => {
          const date = new Date(item.dt * 1000);
          const dayName = daysOfWeek[date.getDay()];
          
          if (!dailyMap[dayName]) {
            dailyMap[dayName] = {
              temps: [],
              codes: [],
            };
          }
          dailyMap[dayName].temps.push(item.main.temp);
          dailyMap[dayName].codes.push(item.weather?.[0]?.id);
        });
      }

      const dailyForecasts = forecastData.list ? Object.keys(dailyMap).slice(0, 7).map(dayName => {
        const dayData = dailyMap[dayName];
        const tempMax = Math.round(Math.max(...dayData.temps));
        const tempMin = Math.round(Math.min(...dayData.temps));
        const occurrences = dayData.codes.reduce((acc, code) => {
          acc[code] = (acc[code] || 0) + 1;
          return acc;
        }, {});
        const commonCode = parseInt(Object.keys(occurrences).reduce((a, b) => occurrences[a] > occurrences[b] ? a : b));
        
        const wmo = convertOwmToWmo(commonCode);
        const { desc: dDesc, emoji: dEmoji } = getWmoInfo(wmo, true);
        return {
          day: dayName,
          tempMax,
          tempMin,
          description: dDesc,
          emoji: dEmoji
        };
      }) : MOCK_DAILY;

      const hourlyForecasts = forecastData.list ? forecastData.list.slice(0, 8).map(h => {
        const date = new Date(h.dt * 1000);
        const hours = date.getHours().toString().padStart(2, '0') + '.00';
        const rainProb = h.pop != null ? Math.round(h.pop * 100) : 0;
        const windSpeedKmh = h.wind?.speed != null ? Math.round(h.wind.speed * 3.6) : 0;
        return {
          time: hours,
          temp: Math.round(h.main.temp),
          rain: rainProb,
          wind: windSpeedKmh
        };
      }) : MOCK_HOURLY;

      // Use OpenWeather's returned city name/country directly (fast, no rate-limiting)
      let city = weatherData.name || null;
      let country = weatherData.sys?.country || null;

      if (!city) {
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'TRI-HITA/1.0' } }
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || null;
            country = geoData.address?.country_code?.toUpperCase() ?? null;
          }
        } catch { /* ignore */ }
      }

      setWeatherState(theme);
      setRealWeather({
        city,
        country,
        description: desc,
        emoji,
        windSpeed: windSpeedKmh,
        uvIndex,
        daily: dailyForecasts,
        hourly: hourlyForecasts,
        loading: false,
        error: null,
      });

      // Populate sensor data with real weather values (temperature handled separately if needed)
      setSensorData(prev => ({
        ...prev,
        temperature,
        humidity,
        windSpeed: windSpeedKmh,
        uvIndex,
        rainfall: theme === 'rainy' ? 8 : 0,
      }));
    } catch (err) {
      console.error('[fetchWeather] error:', err);
      setRealWeather(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, []);

  // Auto-detect location on mount, refresh every 10 minutes (or use locked custom location)
  useEffect(() => {
    const doFetch = () => {
      console.log('[doFetch] locationConfig:', locationConfig);
      if (locationConfig.isLocked && locationConfig.latitude != null && locationConfig.longitude != null) {
        fetchWeather(Number(locationConfig.latitude), Number(locationConfig.longitude));
        return;
      }
      if (!navigator.geolocation) {
        setRealWeather(prev => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => {
          setRealWeather(prev => ({ ...prev, loading: false, error: 'Location access denied' }));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    doFetch();
    const refresh = setInterval(doFetch, 10 * 60 * 1000);
    return () => clearInterval(refresh);
  }, [fetchWeather, locationConfig.isLocked, locationConfig.latitude, locationConfig.longitude]);

  // Dummy data micro‑fluctuations removed – sensor data now solely from backend/API.
  const healthScore = useMemo(() => {
    const temp = sensorData.temperature != null ? sensorData.temperature : (esp32Connected ? esp32Data.temperature : null);
    const hum = sensorData.humidity != null ? sensorData.humidity : (esp32Connected ? esp32Data.humidity : null);
    return computeHealthScore({
      soilMoisture: sensorData.soilMoisture,
      humidity:     hum,
      temperature:  temp,
      lightLevel:   sensorData.lightLevel,
    });
  }, [sensorData.soilMoisture, sensorData.lightLevel, sensorData.temperature, sensorData.humidity, esp32Connected, esp32Data.humidity, esp32Data.temperature]);



  const toggleSprinkler = useCallback((zoneId) => {
    setSprinklers(prev => ({ ...prev, [zoneId]: !prev[zoneId] }));
  }, []);

  const cycleWeather = useCallback(() => {
    setWeatherState(prev => {
      const idx = WEATHER_STATES.indexOf(prev);
      return WEATHER_STATES[(idx + 1) % WEATHER_STATES.length];
    });
  }, []);

  const markAlertRead = useCallback((id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }, []);

  const unreadAlertCount = alerts.filter(a => !a.read).length;

  return (
    <DataContext.Provider value={{
      weatherState,
      setWeatherState,
      cycleWeather,
      realWeather,
      sensorData,
      healthScore,
      solarPower,
      sprinklers,
      toggleSprinkler,
      zones,
      growthData,
      alerts,
      markAlertRead,
      unreadAlertCount,
      nodes,
      backendConnected,
      // ESP32 live data
      esp32Data,
      esp32Connected,
      esp32Error,
      toggleEsp32,
      locationConfig,
      updateLocationConfig,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
