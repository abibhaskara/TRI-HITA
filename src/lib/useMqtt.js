/**
 * useMqtt.js
 * Custom hook — subscribes to ESP32 MQTT topics via WebSocket (browser-safe).
 *
 * Topics (must match Arduino code):
 *   esp32/tempidrus24  → temperature (°C)
 *   esp32/humidrus24   → humidity (%)
 *
 * HiveMQ public broker WebSocket endpoint:
 *   wss://broker.hivemq.com:8884/mqtt
 *
 * ── HOW DEVICE STATUS WORKS ──────────────────────────────────────────────
 * esp32Connected tracks whether the ESP32 *device* is actively sending data,
 * NOT whether the broker WebSocket is connected.
 *
 * ESP32 publishes every 5 seconds. If no message arrives within
 * DEVICE_TIMEOUT_MS (15s), the device is considered offline and all data
 * fields reset to null.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import mqtt from 'mqtt';

const BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt';

const TOPICS = {
  temperature: 'tri-hita/esp32/temp_secret99',
  humidity: 'tri-hita/esp32/hum_secret99',
};

// Increase timeout to 30 seconds to be more robust against network lag
const DEVICE_TIMEOUT_MS = 30_000;

/**
 * @returns {{
 *   esp32Data: { temperature: number|null, humidity: number|null, lastSeen: Date|null },
 *   esp32Connected: boolean,   // true = ESP32 device is actively publishing
 *   brokerConnected: boolean,  // true = WebSocket to HiveMQ is open
 *   esp32Error: string|null,
 * }}
 */
export function useMqtt() {
  const [esp32Data, setEsp32Data] = useState({
    temperature: null,
    humidity: null,
    lastSeen: null,
  });

  // brokerConnected = WebSocket to HiveMQ is open
  const [brokerConnected, setBrokerConnected] = useState(false);
  // esp32Connected = ESP32 device is actively sending messages
  const [esp32Connected, setEsp32Connected] = useState(false);
  const [esp32Error, setEsp32Error] = useState(null);

  const clientRef  = useRef(null);
  const timeoutRef = useRef(null); // heartbeat timer

  /** Mark device offline and wipe stale data */
  const markDeviceOffline = useCallback(() => {
    console.warn('[MQTT] ESP32 device heartbeat timeout — marking offline');
    setEsp32Connected(false);
    setEsp32Data({ temperature: null, humidity: null, lastSeen: null });
  }, []);

  /** Reset the 15-second heartbeat timer on every incoming message */
  const resetHeartbeat = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(markDeviceOffline, DEVICE_TIMEOUT_MS);
  }, [markDeviceOffline]);

  useEffect(() => {
    const clientId = `tri-hita_webapp_${Math.random().toString(16).slice(2, 8)}`;

    const mqttClient = mqtt.connect(BROKER_URL, {
      clientId,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    });

    clientRef.current = mqttClient;

    mqttClient.on('connect', () => {
      console.info('[MQTT] Broker connected via WebSocket');
      setBrokerConnected(true);
      setEsp32Error(null);

      const topicList = Object.values(TOPICS);
      mqttClient.subscribe(topicList, { qos: 0 }, (err) => {
        if (err) {
          console.error('[MQTT] Subscribe error:', err.message);
          setEsp32Error(err.message);
        } else {
          console.info('[MQTT] Subscribed to:', topicList.join(', '));
        }
      });
    });

    mqttClient.on('message', (topic, payload, packet) => {
      // Ignore "retained" messages. This prevents "ghost" data from appearing
      // instantly upon connection/reconnection if the ESP32 is actually offline.
      if (packet && packet.retain) return;

      const value = parseFloat(payload.toString());
      if (isNaN(value)) return;

      // First message after silence → device came online
      setEsp32Connected(prev => {
        if (!prev) console.info('[MQTT] ESP32 device online — receiving data');
        return true;
      });

      // Restart the heartbeat timer each time a message arrives
      resetHeartbeat();

      setEsp32Data((prev) => {
        const next = { ...prev, lastSeen: new Date() };
        if (topic === TOPICS.temperature) next.temperature = parseFloat(value.toFixed(1));
        if (topic === TOPICS.humidity)    next.humidity    = Math.round(value);
        return next;
      });
    });

    mqttClient.on('reconnect', () => {
      console.warn('[MQTT] Broker reconnecting…');
      setBrokerConnected(false);
      // Heartbeat timer independently handles device offline detection
    });

    mqttClient.on('offline', () => {
      console.warn('[MQTT] Broker client offline');
      setBrokerConnected(false);
      // We don't mark the device offline immediately anymore.
      // The heartbeat timer (DEVICE_TIMEOUT_MS) will handle it if the connection 
      // doesn't recover within 30 seconds. This prevents status flickering.
    });

    mqttClient.on('error', (err) => {
      console.error('[MQTT] Error:', err.message);
      setEsp32Error(err.message);
      setBrokerConnected(false);
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      mqttClient.end(true);
    };

  }, [resetHeartbeat, markDeviceOffline]);

  const toggleEsp32 = useCallback(() => {
    setEsp32Connected(prev => !prev);
  }, []);

  return { esp32Data, esp32Connected, brokerConnected, esp32Error, toggleEsp32 };
}
