
import React from 'react';
import { UserTheme } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  stats?: { level: number; rank: string };
  username?: string;
  userId?: string;
  onLogout?: () => void;
  isGuest?: boolean;
  theme?: UserTheme;
}

export const Layout: React.FC<LayoutProps> = ({ children, stats, username, userId, onLogout, isGuest, theme }) => {
  const isGod = userId === '1';
  
  // Default values if theme is not provided
  const accentColor = theme?.accent || '#a855f7';
  const bgColor = theme?.bg || '#000000';

  return (
    <div 
      className="min-h-screen flex flex-col items-center p-4 md:p-8 transition-colors duration-500"
      style={{ 
        backgroundColor: bgColor,
        '--accent-color': accentColor,
        '--accent-glow': `${accentColor}60`,
        '--accent-glow-strong': `${accentColor}90`
      } as React.CSSProperties}
    >
      <header className="w-full max-w-5xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div 
            className={`w-14 h-14 bg-black rounded-2xl flex items-center justify-center neon-border`}
            style={{ 
              borderColor: isGod ? '#eab308' : accentColor,
              boxShadow: isGod ? '0 0 20px rgba(234,179,8,0.5)' : undefined
            }}
          >
            <span className="text-3xl animate-pulse">{isGod ? '👑' : '😎'}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 
                className="text-3xl font-black bg-clip-text text-transparent tracking-tighter neon-text"
                style={{ backgroundImage: `linear-gradient(to right, ${accentColor}, #ffffff)` }}
              >
                ЛУКИ АИ
              </h1>
              {isGod && (
                <span className="bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter shadow-[0_0_15px_rgba(234,179,8,1)]">
                  Бог разработки
                </span>
              )}
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accentColor }}>
              {isGuest ? 'В режиме гостя ✨' : username ? `Привет, ${username}! (ID: ${userId})` : 'Твой лучший цифровой бро ✨'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {stats && (
            <div 
              className="flex items-center gap-4 px-6 py-3 rounded-2xl border backdrop-blur-md neon-border"
              style={{ 
                backgroundColor: `${accentColor}10`,
                borderColor: `${accentColor}30`
              }}
            >
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: isGod ? '#eab308' : accentColor }}>
                  Уровень {stats.level}
                </p>
                <p className="text-sm font-bold text-white">
                  {isGod ? 'Творец миров' : stats.rank}
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: `${accentColor}40`, backgroundColor: `${accentColor}10` }}
              >
                <span className="text-lg font-black" style={{ color: accentColor }}>{stats.level}</span>
              </div>
            </div>
          )}
          {onLogout && (
            <button 
              onClick={onLogout}
              className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold uppercase shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              title="Выйти"
            >
              🚪
            </button>
          )}
        </div>
      </header>
      <main className="w-full max-w-5xl flex-1 flex flex-col gap-6">
        {children}
      </main>
      <footer className="mt-8 opacity-40 text-[10px] font-mono uppercase tracking-[0.3em] flex gap-4" style={{ color: accentColor }}>
        <span>&copy; 2024 LUCKY AI SYSTEMS</span>
        <span>|</span>
        <span>SESSION_ID_{userId || 'GUEST'}</span>
        {isGod && <span>| ROLE: GOD_MODE</span>}
      </footer>
      <style>{`
        .neon-border {
          border: 1px solid var(--accent-glow-strong);
          box-shadow: 0 0 5px var(--accent-glow), inset 0 0 5px var(--accent-glow);
        }
        .neon-text {
          text-shadow: 0 0 10px var(--accent-glow-strong);
        }
        /* Анимация пульсации для неона */
        @keyframes neon-pulse {
          0%, 100% { box-shadow: 0 0 5px var(--accent-glow), inset 0 0 5px var(--accent-glow); }
          50% { box-shadow: 0 0 15px var(--accent-glow), inset 0 0 8px var(--accent-glow); }
        }
        .neon-border-active {
          animation: neon-pulse 2s infinite;
        }
      `}</style>
    </div>
  );
};
