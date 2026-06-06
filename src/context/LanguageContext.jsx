import { createContext, useContext, useState, useCallback } from 'react';

const LANG_KEY = 'tri-hita_lang';

const translations = {
  en: {
    // Bottom Nav
    nav_dashboard: 'Dashboard',
    nav_analysis: 'Analysis',
    nav_settings: 'Settings',

    // Dashboard Hero
    hi: 'Hi 👋',
    welcome_to: 'Welcome to',
    health: 'Health',
    uptime: 'Uptime',
    connected: 'Online',
    plant_age: 'Plant Age',
    days: 'Days',
    my_fields: 'My Hydroponic',

    // Field card
    field_name: 'Hydroponic System',
    field_desc: 'Monitor growth, watering and harvest cycles.',
    live: 'Live',
    live_data: 'Live Data',
    tap_to_scan: 'Tap to scan nearby devices',

    // Device scan modal
    scanning_title: 'Scanning for devices…',
    scanning_sub: 'Make sure your device is powered on and in range.',
    scan_failed_title: 'No devices found',
    scan_failed_sub: 'Make sure your device is powered on and in range, then try again.',
    retry: 'Retry',
    exit: 'Exit',

    // AI Analysis (Dashboard)
    ai_analysis: 'AI Analysis',
    tap_to_analyze: '✨ Tap to analyze',
    re_analyze: '↻ Re-analyze',
    analyzing: 'Analyzing...',
    ai_analysis_desc: "Run a live analysis of your plantation's current health, sensor data, and harvest timeline.",

    // Harvest
    harvest_progress: 'Harvest Progress',
    days_left: 'days left',
    day: 'Day',
    of: 'of',

    // Chart
    sensor_history: 'Sensor History',
    soil: 'Soil',
    uv: 'UV',
    no_data: 'No data',
    select_date_range: 'Select a date range above',

    // Power
    power_system: 'Power System',
    charging: 'Charging',
    battery: 'Battery',
    solar: 'Solar',

    // Notifications
    notifications: 'Notifications',
    no_notifications: 'No notifications',
    add_new_device: 'Add New Device',
    unable_to_connect: 'Unable to connect',

    // Analysis page
    ai_insights: 'AI Insights',
    zone_overview: 'Zone Overview',
    zones: 'zones',
    area: 'Area',
    trees: 'Trees',
    healthy: 'Healthy',
    warning: 'Warning',
    critical: 'Critical',
    humidity: 'Humidity',
    canopy_coverage: 'Canopy Coverage Optimal',
    soil_moisture_alert: 'Soil Moisture Alert',
    pest_activity: 'Pest Activity Detected',
    harvest_forecast: 'Harvest Forecast',
    generating_insight: 'Generating insight…',
    smart_insights: 'Smart hydroponic insights',

    // Settings
    settings_title: 'Settings',
    system_config: 'System Configuration',
    sprinkler_control: 'Sprinkler Control',
    auto_irrigation: 'Auto Irrigation',
    auto_irrigation_desc: 'AI-based automatic sprinkler activation',
    push_notifications: 'Push Notifications',
    receive_alerts: 'Receive alerts and updates',
    alert_history: 'Alert History',
    alerts: 'alerts',
    system: 'System',
    refresh_interval: 'Refresh Interval',
    language: 'Language',
    network_status: 'Network Status',
    firmware: 'Firmware',
    reset: 'Reset',
    about_desc: 'Precision AI-powered Hydroponic & Moisture Optimization for Resilient Agriculture',
    irrigating: 'Irrigating...',
    standby: 'Standby',

    // Account
    account: 'Account Settings',
    personal_info: 'Personal Information',
    full_name: 'Full Name',
    email: 'Email Address',
    plantation_setup: 'Plantation Setup',
    plant_type: 'Plant Type',
    planted_date: 'Planted Date',
    save_changes: 'Save Changes',
    saved: '✓ Saved',
    your_avatar: 'Your Avatar',
    plant_photo: 'Plant Photo',
    change: 'Change',
    password: 'Password',
    reset_password: 'Reset Password',
    password_reset_initiated: 'Password reset initiated. Please enter your new password.',
    changes_saved: 'Changes Saved',

    // AI Chatbot
    ask_ai: 'Ask TRI-HITA AI...',
    ai_greeting: 'Hello! I am TRI-HITA AI. How can I help you optimize your hydroponic system today?',
    type_message: 'Type a message...',
    data_analysis_engine: 'Data Analysis Engine',
    monitoring_telemetry: 'I am monitoring the live telemetry of your hydroponic system. Ask me to analyze health, water levels, yield projections, or environmental risks.',
    request_telemetry: 'Request telemetry analysis…',

    // Onboarding
    continue: 'Continue',
    get_started: 'Get Started',
  },

  id: {
    // Bottom Nav
    nav_dashboard: 'Beranda',
    nav_analysis: 'Analisis',
    nav_settings: 'Pengaturan',

    // Dashboard Hero
    hi: 'Hai 👋',
    welcome_to: 'Selamat datang di',
    health: 'Kesehatan',
    uptime: 'Waktu Aktif',
    connected: 'Online',
    plant_age: 'Umur Tanaman',
    days: 'Hari',
    my_fields: 'Hidroponik Saya',

    // Field card
    field_name: 'Sistem Hidroponik',
    field_desc: 'Pantau pertumbuhan, penyiraman, dan siklus panen.',
    live: 'Langsung',
    live_data: 'Data Langsung',
    tap_to_scan: 'Ketuk untuk memindai perangkat terdekat',

    // Device scan modal
    scanning_title: 'Mencari perangkat…',
    scanning_sub: 'Pastikan perangkat Anda menyala dan dalam jangkauan.',
    scan_failed_title: 'Perangkat tidak ditemukan',
    scan_failed_sub: 'Pastikan perangkat menyala dan dalam jangkauan, lalu coba lagi.',
    retry: 'Coba Lagi',
    exit: 'Keluar',

    // AI Analysis (Dashboard)
    ai_analysis: 'Analisis AI',
    tap_to_analyze: '✨ Ketuk untuk analisis',
    re_analyze: '↻ Analisis Ulang',
    analyzing: 'Menganalisis...',
    ai_analysis_desc: 'Jalankan analisis langsung kesehatan hidroponik, data sensor, dan jadwal panen Anda.',

    // Harvest
    harvest_progress: 'Progres Panen',
    days_left: 'hari lagi',
    day: 'Hari',
    of: 'dari',

    // Chart
    sensor_history: 'Riwayat Sensor',
    soil: 'Tanah',
    uv: 'UV',
    no_data: 'Tidak ada data',
    select_date_range: 'Pilih rentang tanggal di atas',

    // Power
    power_system: 'Sistem Daya',
    charging: 'Mengisi',
    battery: 'Baterai',
    solar: 'Surya',

    // Notifications
    notifications: 'Notifikasi',
    no_notifications: 'Tidak ada notifikasi',
    add_new_device: 'Tambah Perangkat Baru',
    unable_to_connect: 'Tidak dapat terhubung',

    // Analysis page
    ai_insights: 'Wawasan AI',
    zone_overview: 'Gambaran Zona',
    zones: 'zona',
    area: 'Luas',
    trees: 'Pohon',
    healthy: 'Sehat',
    warning: 'Peringatan',
    critical: 'Kritis',
    humidity: 'Kelembapan',
    canopy_coverage: 'Tutupan Kanopi Optimal',
    soil_moisture_alert: 'Peringatan Kelembaban Tanah',
    pest_activity: 'Aktivitas Hama Terdeteksi',
    harvest_forecast: 'Prakiraan Panen',
    generating_insight: 'Membuat wawasan…',
    smart_insights: 'Wawasan hidroponik cerdas',

    // Settings
    settings_title: 'Pengaturan',
    system_config: 'Konfigurasi Sistem',
    sprinkler_control: 'Kontrol Sprinkler',
    auto_irrigation: 'Irigasi Otomatis',
    auto_irrigation_desc: 'Aktivasi sprinkler otomatis berbasis AI',
    push_notifications: 'Notifikasi Push',
    receive_alerts: 'Terima peringatan dan pembaruan',
    alert_history: 'Riwayat Peringatan',
    alerts: 'peringatan',
    system: 'Sistem',
    refresh_interval: 'Interval Penyegaran',
    language: 'Bahasa',
    network_status: 'Status Jaringan',
    firmware: 'Firmware',
    reset: 'Reset',
    about_desc: 'Optimalisasi Hidroponik & Kelembaban Berbasis AI untuk Pertanian Tangguh',
    irrigating: 'Menyiram...',
    standby: 'Siaga',

    // Account
    account: 'Pengaturan Akun',
    personal_info: 'Informasi Pribadi',
    full_name: 'Nama Lengkap',
    email: 'Alamat Email',
    plantation_setup: 'Pengaturan Perkebunan',
    plant_type: 'Jenis Tanaman',
    planted_date: 'Tanggal Tanam',
    save_changes: 'Simpan Perubahan',
    saved: '✓ Tersimpan',
    your_avatar: 'Avatar Anda',
    plant_photo: 'Foto Tanaman',
    change: 'Ubah',
    password: 'Kata Sandi',
    reset_password: 'Atur Ulang Sandi',
    password_reset_initiated: 'Penyetelan ulang sandi dimulai. Silakan masukkan sandi baru Anda.',
    changes_saved: 'Perubahan Disimpan',

    // AI Chatbot
    ask_ai: 'Tanya TRI-HITA AI...',
    ai_greeting: 'Halo! Saya TRI-HITA AI. Bagaimana saya dapat membantu mengoptimalkan sistem hidroponik Anda hari ini?',
    type_message: 'Ketik pesan...',
    data_analysis_engine: 'Mesin Analisis Data',
    monitoring_telemetry: 'Saya memantau telemetri langsung sistem hidroponik Anda. Tanyakan tentang kesehatan, kadar air, proyeksi hasil, atau risiko lingkungan.',
    request_telemetry: 'Minta analisis telemetri…',

    // Onboarding
    continue: 'Lanjutkan',
    get_started: 'Mulai',
  },
};


const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(LANG_KEY) || 'en';
    } catch {
      return 'en';
    }
  });

  const changeLang = useCallback((newLang) => {
    setLang(newLang);
    localStorage.setItem(LANG_KEY, newLang);
  }, []);

  const t = useCallback((key, fallback) => {
    return translations[lang]?.[key] || translations.en[key] || fallback || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
