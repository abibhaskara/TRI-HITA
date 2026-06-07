import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, Mail, Lock, User, KeyRound, Check, RefreshCcw } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LanguageContext';

import './Account.css';

export default function Account() {
  const { user, updateUser, cropProfile } = useUser();
  const { t } = useLang();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photoUrl, setPhotoUrl] = useState(user?.avatarUrl || 'https://api.dicebear.com/9.x/thumbs/svg?seed=Sophie');
  const [plantPhotoUrl, _setPlantPhotoUrl] = useState(user?.plantPhotoUrl || '');
  const [password, setPassword] = useState(user?.password || '••••••••');
  const [isResetting, setIsResetting] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving' | 'saved'

  // Crop states
  const [cropName, setCropName] = useState(cropProfile?.cropName || '');
  const [varietyLabel, setVarietyLabel] = useState(cropProfile?.variety || '');
  const [growthStage, setGrowthStage] = useState(cropProfile?.growthStage || 'vegetative');
  const [plantedAt, setPlantedAt] = useState(cropProfile?.plantedAt ? cropProfile.plantedAt.substring(0, 10) : '');
  const [cycleDays, setCycleDays] = useState(cropProfile?.cycleDays || '90');
  const [irrigationMethod, setIrrigationMethod] = useState(cropProfile?.irrigationMethod || 'drip_irrigation');
  const [useCustomThresholds, setUseCustomThresholds] = useState(cropProfile?.useCustomThresholds || false);
  const [optimalMoisture, setOptimalMoisture] = useState(cropProfile?.optimalMoisture || '70');
  const [optimalTemp, setOptimalTemp] = useState(cropProfile?.optimalTemp || '28');
  const [optimalHumidity, setOptimalHumidity] = useState(cropProfile?.optimalHumidity || '80');

  const handleSave = () => {
    if (saveStatus === 'saving') return;
    setSaveStatus('saving');
    
    // Simulate API delay
    setTimeout(() => {
      updateUser({ 
        name, 
        email, 
        avatarUrl: photoUrl || user?.avatarUrl,
        plantPhotoUrl: plantPhotoUrl || user?.plantPhotoUrl, 
        password,
        cropProfile: {
          cropName,
          variety: varietyLabel,
          growthStage,
          plantedAt: new Date(plantedAt).toISOString(),
          cycleDays: Number(cycleDays) || 90,
          irrigationMethod,
          useCustomThresholds,
          optimalMoisture: useCustomThresholds ? Number(optimalMoisture) : null,
          optimalTemp: useCustomThresholds ? Number(optimalTemp) : null,
          optimalHumidity: useCustomThresholds ? Number(optimalHumidity) : null,
        }
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    }, 800);
  };

  const handleResetPassword = () => {
    setIsResetting(true);
    setTimeout(() => {
      setPassword('');
      setIsResetting(false);
      alert(t('password_reset_initiated'));
    }, 1200);
  };

  return (
    <div className="page account-page">
      {/* Dark green hero header */}
      <div className="page-hero animate-in">
        <div className="page-hero__top">
          <button className="back-btn" onClick={() => navigate('/')} aria-label="Go back">
            <ChevronLeft size={24} />
          </button>
          <div className="page-hero__info-wrap">
            <div className="page-hero__label">Tri-Hita</div>
            <h1 className="page-hero__title">{t('account')}</h1>
            <p className="page-hero__sub">{t('manage_profile_desc', 'Manage your profile and plantation setup')}</p>
          </div>
          <div className="settings__header-icon">
            <User size={20} strokeWidth={1.5} />
          </div>
        </div>
      </div>

      <div className="account-content animate-in">
        <div className="profile-section">
          <div className="avatar-wrap">
            <img src={photoUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} alt="Profile" />
            <div className="edit-overlay" onClick={() => {
              const url = prompt(t('enter_photo_url'), photoUrl || '');
              if (url !== null) setPhotoUrl(url);
            }}>
              <Camera size={20} />
            </div>
          </div>
          <h2 className="profile-name">{name || 'Farmer'}</h2>
          <p className="profile-email">{email || 'farmer@tri-hita.ai'}</p>
        </div>

        <div className="settings-group">
          <div className="setting-item">
            <label><User size={16} /> {t('full_name')}</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder={t('enter_your_name')}
            />
          </div>

          <div className="setting-item">
            <label><Mail size={16} /> {t('email')}</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="your@email.com"
            />
          </div>

          <div className="setting-item">
            <label><Lock size={16} /> {t('password')}</label>
            <div className="password-input-wrap">
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
              />
              <button 
                className={`reset-btn ${isResetting ? 'resetting' : ''}`} 
                onClick={handleResetPassword} 
                disabled={isResetting}
              >
                {isResetting ? <RefreshCcw size={14} className="spin-anim" /> : <KeyRound size={14} />}
                <span>{t('reset')}</span>
              </button>
            </div>
          </div>
        </div>

        <h2 className="settings-section-title">
          {t('plantation_setup')}
        </h2>

        <div className="settings-group">
          <div className="setting-item">
            <label>{t('crop_name')}</label>
            <input 
              type="text" 
              value={cropName} 
              onChange={(e) => setCropName(e.target.value)} 
            />
          </div>

          <div className="setting-item">
            <label>{t('variety')}</label>
            <input 
              type="text" 
              value={varietyLabel} 
              onChange={(e) => setVarietyLabel(e.target.value)} 
            />
          </div>

          <div className="setting-item">
            <label>{t('growth_stage')}</label>
            <select 
              value={growthStage} 
              onChange={(e) => setGrowthStage(e.target.value)}
              className="settings__select"
            >
              <option value="nursery">{t('nursery')}</option>
              <option value="vegetative">{t('vegetative')}</option>
              <option value="generative">{t('generative')}</option>
              <option value="harvest_stage">{t('harvest_stage')}</option>
            </select>
          </div>

          <div className="setting-item">
            <label>{t('planted_date')}</label>
            <input 
              type="date" 
              value={plantedAt} 
              onChange={(e) => setPlantedAt(e.target.value)} 
            />
          </div>

          <div className="setting-item">
            <label>{t('cycle_duration')}</label>
            <input 
              type="number" 
              value={cycleDays} 
              onChange={(e) => setCycleDays(e.target.value)} 
            />
          </div>

          <div className="setting-item">
            <label>{t('irrigation_method')}</label>
            <select 
              value={irrigationMethod} 
              onChange={(e) => setIrrigationMethod(e.target.value)}
              className="settings__select"
            >
              <option value="drip_irrigation">{t('drip_irrigation')}</option>
              <option value="sprinkler_irrigation">{t('sprinkler_irrigation')}</option>
              <option value="manual_irrigation">{t('manual_irrigation')}</option>
              <option value="rainfed_irrigation">{t('rainfed_irrigation')}</option>
            </select>
          </div>

          <div className="setting-item" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ margin: 0 }}>{t('custom_thresholds')}</label>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
              <div className="setting-item">
                <label>{t('optimal_moisture')} (%)</label>
                <input 
                  type="number" 
                  value={optimalMoisture} 
                  onChange={(e) => setOptimalMoisture(e.target.value)} 
                />
              </div>
              <div className="setting-item">
                <label>{t('optimal_temp')} (°C)</label>
                <input 
                  type="number" 
                  value={optimalTemp} 
                  onChange={(e) => setOptimalTemp(e.target.value)} 
                />
              </div>
              <div className="setting-item" style={{ gridColumn: 'span 2' }}>
                <label>{t('optimal_humidity')} (%)</label>
                <input 
                  type="number" 
                  value={optimalHumidity} 
                  onChange={(e) => setOptimalHumidity(e.target.value)} 
                />
              </div>
            </div>
          )}
        </div>

        <div className="account-actions">
          <button 
            className={`save-btn ${saveStatus === 'saved' ? 'success' : ''} ${saveStatus === 'saving' ? 'loading' : ''}`} 
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? (
              <span className="loader-inner" />
            ) : saveStatus === 'saved' ? (
              <><Check size={20} /> {t('changes_saved')}</>
            ) : (
              t('save_changes')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
