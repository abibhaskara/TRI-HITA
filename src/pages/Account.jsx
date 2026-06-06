import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, Mail, Lock, User, KeyRound, Check, RefreshCcw } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LanguageContext';
import hydroImg from '../assets/hydroponic.jpg';
import './Account.css';

export default function Account() {
  const { user, updateUser } = useUser();
  const { t } = useLang();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photoUrl, setPhotoUrl] = useState(user?.avatarUrl || 'https://api.dicebear.com/9.x/thumbs/svg?seed=Sophie');
  const [plantPhotoUrl, setPlantPhotoUrl] = useState(user?.plantPhotoUrl || '');
  const [password, setPassword] = useState(user?.password || '••••••••');
  const [isResetting, setIsResetting] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving' | 'saved'

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
        password 
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
      <div className="account-header">
        <button className="back-btn" onClick={() => navigate('/')} aria-label="Go back">
          <ChevronLeft size={24} />
        </button>
        <h1>{t('account')}</h1>
        <div style={{ width: 40 }} />
      </div>

      <div className="account-content animate-in">
        <div className="profile-section">
          <div className="avatar-wrap">
            <img src={photoUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} alt="Profile" />
            <div className="edit-overlay" onClick={() => {
              const url = prompt('Enter new photo URL:', photoUrl || '');
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
              placeholder="Enter your name"
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
