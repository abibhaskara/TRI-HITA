import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LanguageContext';
import { Leaf, Calendar, Sliders, Settings2, Globe, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import './Onboarding.css';

const DEFAULT_CROPS = [
  { 
    key: 'lettuce', 
    name: 'Selada', 
    nameEn: 'Lettuce',
    nameBan: 'Selada',
    desc: 'Tanaman paling populer untuk pemula. Tumbuh sangat cepat dan siap dipanen dalam waktu 30 - 45 hari.',
    descEn: 'Most popular crop for beginners. Grows very fast and ready to harvest in 30 - 45 days.',
    descBan: 'Taneman pinih populer anggen pemula. Tumbuh gelis tur prasida kapuput ring 30 - 45 rahina.',
    defaultCycle: 35, 
    defaultMoisture: 75, 
    defaultTemp: 22, 
    defaultHumidity: 70 
  },
  { 
    key: 'pakcoy', 
    name: 'Pakcoy', 
    nameEn: 'Bok Choy',
    nameBan: 'Pakcoy',
    desc: 'Sayuran dengan usia panen sangat singkat. Biasanya disemai menggunakan Rockwool dan dipindah ke pot berisi substrat.',
    descEn: 'Vegetable with very short harvest window. Usually sown using Rockwool and transferred to substrate pots.',
    descBan: 'Jangan antuk yusa panen bawak pesan. Biasane kasemai nganggen Rockwool tur kagesangang ring pot madaging substrat.',
    defaultCycle: 35, 
    defaultMoisture: 80, 
    defaultTemp: 24, 
    defaultHumidity: 75 
  },
  { 
    key: 'spinach', 
    name: 'Bayam', 
    nameEn: 'Spinach',
    nameBan: 'Bayam',
    desc: 'Tumbuh subur pada media porus, dan cocok dipanen saat usianya menginjak 26 - 29 hari.',
    descEn: 'Thrives in porous media, and suitable to harvest when it reaches 26 - 29 days old.',
    descBan: 'Tumbuh subur ring media porus, tur cocok kapupu ritatkala yusa 26 - 29 rahina.',
    defaultCycle: 28, 
    defaultMoisture: 70, 
    defaultTemp: 20, 
    defaultHumidity: 65 
  },
  { 
    key: 'water_spinach', 
    name: 'Kangkung', 
    nameEn: 'Water Spinach',
    nameBan: 'Kangkung',
    desc: 'Sangat adaptif terhadap berbagai jenis media tanam, termasuk sistem hidroponik bersumbu dengan substrat.',
    descEn: 'Highly adaptive to various growing media, including wicked hydroponic systems with substrate.',
    descBan: 'Sarat adaptif ring makudang-kudang media tanem, rumasuk sistem hidroponik bersumbu sareng substrat.',
    defaultCycle: 30, 
    defaultMoisture: 85, 
    defaultTemp: 28, 
    defaultHumidity: 80 
  },
  { 
    key: 'tomato', 
    name: 'Tomat', 
    nameEn: 'Tomato',
    nameBan: 'Tomat',
    desc: 'Pilihan sayuran buah yang membutuhkan sanggaan karena batangnya yang tinggi. Sangat ideal ditanam menggunakan media tanam padat seperti cocopeat.',
    descEn: 'Fruit vegetable option that requires support due to tall stems. Highly ideal grown using solid media like cocopeat.',
    descBan: 'Pilihan jangan buah sane muahang sanggaan riantuk watangne tegeh. Becik pisan katandur nganggen media tanem padet kadi cocopeat.',
    defaultCycle: 80, 
    defaultMoisture: 65, 
    defaultTemp: 25, 
    defaultHumidity: 70 
  },
  { 
    key: 'custom', 
    name: 'Custom / Other', 
    nameEn: 'Custom / Other',
    nameBan: 'Kustom / Liyanan',
    desc: 'Sesuaikan konfigurasi untuk jenis tanaman kustom pilihan Anda.',
    descEn: 'Customize the configuration for your chosen custom crop.',
    descBan: 'Setel konfigurasi antuk soroh taneman kustom sane kajujuk.',
    defaultCycle: 90, 
    defaultMoisture: 70, 
    defaultTemp: 28, 
    defaultHumidity: 80 
  }
];

export default function Onboarding() {
  const { updateUser } = useUser();
  const { lang, changeLang, t } = useLang();
  const [step, setStep] = useState(1);

  
  const [cropType, setCropType] = useState('lettuce');
  const [customCropName, setCustomCropName] = useState('');
  const [variety, setVariety] = useState('');
  const [growthStage, setGrowthStage] = useState('vegetative');
  const [plantedAt, setPlantedAt] = useState(new Date().toISOString().substring(0, 10));
  const [cycleDays, setCycleDays] = useState('35');
  const [irrigationMethod, setIrrigationMethod] = useState('drip_irrigation');
  const [useCustomThresholds, setUseCustomThresholds] = useState(false);

  
  const [optimalMoisture, setOptimalMoisture] = useState('75');
  const [optimalTemp, setOptimalTemp] = useState('22');
  const [optimalHumidity, setOptimalHumidity] = useState('70');

  const handleCropTypeChange = (val) => {
    setCropType(val);
    const selected = DEFAULT_CROPS.find(c => c.key === val);
    if (selected && val !== 'custom') {
      setCycleDays(String(selected.defaultCycle));
      setOptimalMoisture(String(selected.defaultMoisture));
      setOptimalTemp(String(selected.defaultTemp));
      setOptimalHumidity(String(selected.defaultHumidity));
    }
  };

  const getActiveCropName = () => {
    if (cropType === 'custom') {
      return customCropName.trim() || 'Custom Crop';
    }
    const selected = DEFAULT_CROPS.find(c => c.key === cropType);
    return selected ? selected.name : 'Crop';
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(prev => prev + 1);
    } else {
      
      const finalCropName = getActiveCropName();
      const finalProfile = {
        cropName: finalCropName,
        variety: variety.trim() || 'Standard',
        growthStage,
        plantedAt: new Date(plantedAt).toISOString(),
        cycleDays: Number(cycleDays) || 90,
        irrigationMethod,
        useCustomThresholds,
        optimalMoisture: useCustomThresholds ? Number(optimalMoisture) : null,
        optimalTemp: useCustomThresholds ? Number(optimalTemp) : null,
        optimalHumidity: useCustomThresholds ? Number(optimalHumidity) : null,
      };

      updateUser({
        cropProfile: finalProfile,
        onboarded: true
      });
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  return (
    <div className="onboard-bg">
      <div className="onboard-container">
        
        
        <div className="onboard-header">
          <div className="onboard-logo-area">
            <div className="onboard-icon-wrap">
              <Leaf size={18} />
            </div>
            <span className="onboard-logo-text">TRI-HITA</span>
          </div>

          <div className="onboard-lang-select">
            <Globe size={14} style={{ color: 'rgba(255,255,255,0.6)' }} />
            <select value={lang} onChange={(e) => changeLang(e.target.value)}>
              <option value="en">English</option>
              <option value="id">Indonesia</option>
              <option value="ban">Basa Bali</option>
            </select>
          </div>
        </div>

        
        <div className="onboard-card glass-card">
          <div className="onboard-card__head">
            <span className="onboard-step-indicator">{t('step')} {step} / 4</span>
            <h1 className="onboard-title">{t('onboarding_title')}</h1>
            <p className="onboard-subtitle">{t('onboarding_subtitle')}</p>
          </div>

          
          <div className="onboard-progress-bar">
            <div className="onboard-progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
          </div>

          
          <div className="onboard-content">
            
            {step === 1 && (
              <div className="step-content animate-in">
                <div className="step-icon-header">
                  <Leaf size={24} />
                  <h2>{lang === 'id' ? '1. Informasi Dasar Tanaman' : lang === 'ban' ? '1. Informasi Dasar Taneman' : '1. Basic Crop Information'}</h2>
                </div>

                <div className="form-item">
                  <label>{t('crop_name')}</label>
                  <div className="onboard-grid">
                    {DEFAULT_CROPS.map((crop) => {
                      const isSelected = cropType === crop.key;
                      const emojis = {
                        lettuce: '🥬',
                        pakcoy: '🥬',
                        spinach: '🌿',
                        water_spinach: '🌱',
                        tomato: '🍅',
                        custom: '⚙️'
                      };
                      return (
                        <div
                          key={crop.key}
                          className={`onboard-grid-card ${isSelected ? 'onboard-grid-card--selected' : ''}`}
                          onClick={() => handleCropTypeChange(crop.key)}
                        >
                          <span className="onboard-grid-card__emoji">{emojis[crop.key]}</span>
                          <span className="onboard-grid-card__title">
                            {crop.key === 'custom' 
                              ? (lang === 'id' ? 'Kustom' : lang === 'ban' ? 'Kustom' : 'Custom') 
                              : (lang === 'en' ? crop.nameEn : lang === 'ban' ? crop.nameBan : crop.name)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {cropType && (
                    <div className="onboard-crop-desc animate-in" style={{
                      marginTop: '12px',
                      padding: '14px 16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      color: 'rgba(255, 255, 255, 0.85)'
                    }}>
                      <strong style={{ color: '#2ad1ab', display: 'block', marginBottom: '4px' }}>
                        {cropType === 'custom' 
                          ? (lang === 'id' ? 'Konfigurasi Kustom' : lang === 'ban' ? 'Setelan Kustom' : 'Custom Setup')
                          : (lang === 'en' ? DEFAULT_CROPS.find(c => c.key === cropType)?.nameEn : lang === 'ban' ? DEFAULT_CROPS.find(c => c.key === cropType)?.nameBan : DEFAULT_CROPS.find(c => c.key === cropType)?.name)}:
                      </strong>
                      {lang === 'id' 
                        ? DEFAULT_CROPS.find(c => c.key === cropType)?.desc 
                        : lang === 'ban' 
                          ? DEFAULT_CROPS.find(c => c.key === cropType)?.descBan 
                          : DEFAULT_CROPS.find(c => c.key === cropType)?.descEn}
                    </div>
                  )}
                </div>

                {cropType === 'custom' && (
                  <div className="form-item animate-in">
                    <label>{lang === 'id' ? 'Masukkan Nama Tanaman' : lang === 'ban' ? 'Lebokang Adan Taneman' : 'Enter Crop Name'}</label>
                    <input 
                      type="text" 
                      value={customCropName} 
                      onChange={(e) => setCustomCropName(e.target.value)} 
                      placeholder="e.g. Chili, Apple..."
                    />
                  </div>
                )}

                <div className="form-item">
                  <label>{t('variety')}</label>
                  <input 
                    type="text" 
                    value={variety} 
                    onChange={(e) => setVariety(e.target.value)} 
                    placeholder="e.g. IR64, Tenera, Roma..."
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="step-content animate-in">
                <div className="step-icon-header">
                  <Calendar size={24} />
                  <h2>{lang === 'id' ? '2. Tahap Pertumbuhan & Tanggal' : lang === 'ban' ? '2. Tahap Patumbuhan & Tanggal' : '2. Growth Stage & Planting Date'}</h2>
                </div>

                <div className="form-item">
                  <label>{t('growth_stage')}</label>
                  <div className="onboard-grid onboard-grid--stages">
                    {[
                      { key: 'nursery', label: t('nursery'), emoji: '🌱' },
                      { key: 'vegetative', label: t('vegetative'), emoji: '🌿' },
                      { key: 'generative', label: t('generative'), emoji: '🌸' },
                      { key: 'harvest_stage', label: t('harvest_stage'), emoji: '🧺' }
                    ].map((stage) => {
                      const isSelected = growthStage === stage.key;
                      return (
                        <div
                          key={stage.key}
                          className={`onboard-grid-card onboard-grid-card--sm ${isSelected ? 'onboard-grid-card--selected' : ''}`}
                          onClick={() => setGrowthStage(stage.key)}
                        >
                          <span className="onboard-grid-card__emoji">{stage.emoji}</span>
                          <span className="onboard-grid-card__title">{stage.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="form-item">
                  <label>{t('planted_date')}</label>
                  <input 
                    type="date" 
                    value={plantedAt} 
                    onChange={(e) => setPlantedAt(e.target.value)} 
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="step-content animate-in">
                <div className="step-icon-header">
                  <Sliders size={24} />
                  <h2>{lang === 'id' ? '3. Target & Metode Irigasi' : lang === 'ban' ? '3. Target & Metode Nguberin' : '3. Targets & Irrigation Method'}</h2>
                </div>

                <div className="form-item">
                  <label>{t('cycle_duration')}</label>
                  <input 
                    type="number" 
                    value={cycleDays} 
                    onChange={(e) => setCycleDays(e.target.value)} 
                    placeholder="90"
                  />
                </div>

                <div className="form-item">
                  <label>{t('irrigation_method')}</label>
                  <div className="onboard-grid onboard-grid--irrigation">
                    {[
                      { key: 'drip_irrigation', label: t('drip_irrigation'), emoji: '💧' },
                      { key: 'sprinkler_irrigation', label: t('sprinkler_irrigation'), emoji: '💦' },
                      { key: 'manual_irrigation', label: t('manual_irrigation'), emoji: '🌧️' },
                      { key: 'rainfed_irrigation', label: t('rainfed_irrigation'), emoji: '☔' }
                    ].map((method) => {
                      const isSelected = irrigationMethod === method.key;
                      return (
                        <div
                          key={method.key}
                          className={`onboard-grid-card onboard-grid-card--sm ${isSelected ? 'onboard-grid-card--selected' : ''}`}
                          onClick={() => setIrrigationMethod(method.key)}
                        >
                          <span className="onboard-grid-card__emoji">{method.emoji}</span>
                          <span className="onboard-grid-card__title">{method.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="step-content animate-in">
                <div className="step-icon-header">
                  <Settings2 size={24} />
                  <h2>{lang === 'id' ? '4. Parameter & Batasan Lahan' : lang === 'ban' ? '4. Parameter & Batasan Lahan' : '4. Custom Telemetry Thresholds'}</h2>
                </div>

                <div className="form-item form-item--toggle">
                  <div className="toggle-label-wrap">
                    <span className="toggle-label">{t('custom_thresholds')}</span>
                    <span className="toggle-desc">
                      {lang === 'id' 
                        ? 'Tentukan batas optimal sendiri (Opsional)' 
                        : lang === 'ban' 
                          ? 'Setel optimal batas padidi (Opsional)' 
                          : 'Set custom targets instead of AI defaults'}
                    </span>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={useCustomThresholds} 
                      onChange={(e) => setUseCustomThresholds(e.target.checked)} 
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                {useCustomThresholds && (
                  <div className="custom-fields-grid animate-in">
                    <div className="form-item">
                      <label>{t('optimal_moisture')} (%)</label>
                      <input 
                        type="number" 
                        value={optimalMoisture} 
                        onChange={(e) => setOptimalMoisture(e.target.value)} 
                      />
                    </div>
                    <div className="form-item">
                      <label>{t('optimal_temp')} (°C)</label>
                      <input 
                        type="number" 
                        value={optimalTemp} 
                        onChange={(e) => setOptimalTemp(e.target.value)} 
                      />
                    </div>
                    <div className="form-item">
                      <label>{t('optimal_humidity')} (%)</label>
                      <input 
                        type="number" 
                        value={optimalHumidity} 
                        onChange={(e) => setOptimalHumidity(e.target.value)} 
                      />
                    </div>
                  </div>
                )}

                {!useCustomThresholds && (
                  <div className="ai-default-notice animate-in">
                    <span className="badge badge--success">{t('use_standard_ai')}</span>
                    <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '6px', lineHeight: 1.4 }}>
                      {lang === 'id'
                        ? 'Sistem akan secara otomatis menentukan nilai optimal berdasarkan database agronomis AI untuk jenis tanaman Anda.'
                        : lang === 'ban'
                          ? 'Sistem pacang otomatis nyetel optimal saking agronomis AI database antuk soroh taneman Palungguh.'
                          : 'The monitoring engine will dynamically assess sensor status using standard agronomist profiles for your selected crop.'}
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>

          
          <div className="onboard-footer">
            {step > 1 ? (
              <button className="onboard-btn-back" onClick={handleBack}>
                <ArrowLeft size={16} />
                <span>{lang === 'id' ? 'Kembali' : lang === 'ban' ? 'Wali' : 'Back'}</span>
              </button>
            ) : <div />}

            <button className="onboard-btn-next" onClick={handleNext}>
              <span>{step === 4 ? (lang === 'id' ? 'Mulai Sekarang' : lang === 'ban' ? 'Miwit Mangkin' : 'Get Started') : (lang === 'id' ? 'Lanjut' : lang === 'ban' ? 'Lanturang' : 'Continue')}</span>
              {step === 4 ? <Check size={16} /> : <ArrowRight size={16} />}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
