
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { GameMode, Message, RPSubMode, User, UserTheme } from './types';
import { processInteraction } from './services/geminiService';

const USERS_STORAGE_KEY = 'lucky_ai_master_v2';
const SESSION_KEY = 'lucky_ai_session_id';

const getRankByLevel = (level: number): string => {
  if (level >= 10000) return "БОГ РАЗРАБОТКИ 👑";
  if (level >= 1937) return "Мастер ГКО 🔥";
  if (level >= 1589) return "Мишаня (Топ) ✨";
  if (level >= 700) return "Орунчик 🗣️";
  if (level >= 100) return "Про-игрок 🎮";
  return "Новичок 🌱";
};

const THEME_OPTIONS = {
  accents: [
    { name: 'Фиолетовый', color: '#a855f7' },
    { name: 'Циан', color: '#06b6d4' },
    { name: 'Зеленый', color: '#10b981' },
    { name: 'Розовый', color: '#ec4899' },
    { name: 'Золотой', color: '#eab308' },
    { name: 'Синий', color: '#3b82f6' }
  ],
  backgrounds: [
    { name: 'Черный', color: '#000000' },
    { name: 'Темно-синий', color: '#0f172a' },
    { name: 'Полночь', color: '#020617' },
    { name: 'Глубокий пурпур', color: '#1e1b4b' }
  ]
};

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginView, setIsLoginView] = useState(true);
  const [authForm, setAuthForm] = useState({ username: '', password: '', id: '' });
  const [authError, setAuthError] = useState('');
  const [activeView, setActiveView] = useState<'chat' | 'friends' | 'settings'>('chat');
  const [mode, setMode] = useState<GameMode>(GameMode.FREE_CHAT);
  const [rpSubMode, setRpSubMode] = useState<RPSubMode>('cyberpunk');
  const [image, setImage] = useState<string | null>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [xp, setXp] = useState(0);
  const [userTheme, setUserTheme] = useState<UserTheme>({ bg: '#000000', accent: '#a855f7' });
  const [friendSearchId, setFriendSearchId] = useState('');
  const [friendActionError, setFriendActionError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load and Init
  useEffect(() => {
    let localUsers: User[] = [];
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      localUsers = saved ? JSON.parse(saved) : [];
    } catch (e) { localUsers = []; }

    const systemAccounts = [
      { id: '1', username: 'рэдди', password: '89', xp: 99999, history: [], mode: GameMode.FREE_CHAT, rpSubMode: 'cyberpunk', friends: ['7', '89'], pendingRequests: [] },
      { id: '7', username: 'давид орунчик', password: '7', xp: 789, history: [], mode: GameMode.FREE_CHAT, rpSubMode: 'cyberpunk', friends: ['1'], pendingRequests: [] },
      { id: '89', username: 'мишаня', password: '89', xp: 1589, history: [], mode: GameMode.FREE_CHAT, rpSubMode: 'cyberpunk', friends: ['1'], pendingRequests: [] }
    ] as User[];

    systemAccounts.forEach(sys => {
      if (!localUsers.find(u => u.id === sys.id)) localUsers.push(sys);
    });

    setUsers(localUsers);
    const sessionUserId = localStorage.getItem(SESSION_KEY);
    if (sessionUserId) {
      const user = localUsers.find(u => u.id === sessionUserId);
      if (user) loginUser(user);
    }
  }, []);

  const loginUser = (user: User) => {
    setCurrentUser(user);
    setHistory(user.history || []);
    setXp(user.xp || 0);
    setMode(user.mode || GameMode.FREE_CHAT);
    setRpSubMode(user.rpSubMode || 'cyberpunk');
    if (user.theme) setUserTheme(user.theme);
  };

  useEffect(() => {
    if (currentUser && !currentUser.isGuest) {
      const updatedUser = { ...currentUser, history, xp, mode, rpSubMode, theme: userTheme };
      const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    }
  }, [history, xp, mode, rpSubMode, userTheme, currentUser]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, isProcessing, activeView]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (isLoginView) {
      const user = users.find(u => u.id === authForm.id && u.password === authForm.password);
      if (user) {
        localStorage.setItem(SESSION_KEY, user.id);
        loginUser(user);
      } else setAuthError('Неверный ID или пароль! ❌');
    } else {
      if (!authForm.username || !authForm.password) return setAuthError('Заполни все поля! 📝');
      const nextId = (Math.max(...users.map(u => parseInt(u.id)).filter(id => id >= 100), 99) + 1).toString();
      const newUser: User = { id: nextId, username: authForm.username, password: authForm.password, xp: 0, history: [], mode: GameMode.FREE_CHAT, rpSubMode: 'cyberpunk', friends: [], pendingRequests: [] };
      const updated = [...users, newUser];
      setUsers(updated);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem(SESSION_KEY, nextId);
      loginUser(newUser);
      alert(`Твой ID: ${nextId}. Сохрани его! 😎`);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    const isVision = mode === GameMode.IMAGE_ANALYSIS || mode === GameMode.IMAGE_GAMES;
    if (isVision && !image) return alert("Бро, сначала закинь фотку! 📸");

    const userMsg: Message = { role: 'user', text: inputText, timestamp: Date.now() };
    setHistory(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      const response = await processInteraction(mode, inputText, isVision ? image : null, history, rpSubMode);
      setHistory(prev => [...prev, { role: 'model', text: response, timestamp: Date.now() }]);
      setXp(prev => prev + 1);
    } catch (err) {
      setHistory(prev => [...prev, { role: 'model', text: "Упс, канал связи заискрил... Попробуй еще раз! ⚡", timestamp: Date.now() }]);
    } finally { setIsProcessing(false); }
  };

  const isVision = mode === GameMode.IMAGE_ANALYSIS || mode === GameMode.IMAGE_GAMES;

  if (!currentUser) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950/80 backdrop-blur-xl border border-purple-500/30 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(168,85,247,0.2)] neon-border fade-up">
            <div className="text-center mb-10">
              <div className="w-24 h-24 bg-purple-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 neon-border-active">
                <span className="text-5xl">😎</span>
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white neon-text">LUCKY AI</h2>
              <p className="text-xs text-purple-400 font-bold uppercase tracking-[0.3em] mt-2">Цифровой бро v2.0</p>
            </div>
            <form onSubmit={handleAuth} className="space-y-6">
              {isLoginView ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-purple-300 ml-2">ID Аккаунта</label>
                  <input type="text" value={authForm.id} onChange={e => setAuthForm({...authForm, id: e.target.value})} className="w-full bg-black/50 border border-purple-500/20 rounded-2xl px-6 py-4 text-purple-100 focus:border-purple-500 transition-all font-mono outline-none neon-border" placeholder="000" />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-purple-300 ml-2">Твое имя</label>
                  <input type="text" value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} className="w-full bg-black/50 border border-purple-500/20 rounded-2xl px-6 py-4 text-purple-100 focus:border-purple-500 outline-none neon-border" placeholder="Никнейм" />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-purple-300 ml-2">Пароль</label>
                <input type="password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full bg-black/50 border border-purple-500/20 rounded-2xl px-6 py-4 text-purple-100 focus:border-purple-500 font-mono outline-none neon-border" placeholder="••••" />
              </div>
              {authError && <p className="text-red-500 text-[10px] font-black text-center uppercase tracking-widest animate-pulse">{authError}</p>}
              <button type="submit" className="w-full bg-purple-600 text-white font-black uppercase py-5 rounded-2xl shadow-xl hover:bg-purple-500 active:scale-95 transition-all tracking-[0.2em] neon-border-active">
                {isLoginView ? 'АВТОРИЗАЦИЯ 🚀' : 'РЕГИСТРАЦИЯ 🔥'}
              </button>
            </form>
            <div className="mt-8 flex flex-col gap-4 text-center">
              <button onClick={() => setIsLoginView(!isLoginView)} className="text-[10px] font-black uppercase text-purple-500/60 hover:text-purple-400 transition-colors">
                {isLoginView ? 'НЕТ АККАУНТА? СОЗДАЙ! ✨' : 'УЖЕ С НАМИ? ВОЙДИ! 😎'}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      stats={{ level: xp, rank: getRankByLevel(xp) }} 
      username={currentUser.username} userId={currentUser.id} 
      onLogout={() => { setCurrentUser(null); localStorage.removeItem(SESSION_KEY); }} 
      isGuest={currentUser.isGuest} theme={userTheme}
    >
      <div className="flex flex-col gap-6 flex-1 h-full fade-up">
        {/* Navigation Bar */}
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-3 flex gap-2 overflow-x-auto scrollbar-hide neon-border">
          {[
            { id: GameMode.FREE_CHAT, label: 'ЧАТ 💬' },
            { id: GameMode.RP_MODE, label: 'РП 🎭' },
            { id: GameMode.TEXT_GAMES, label: 'ИГРЫ 🎮' },
            { id: GameMode.IMAGE_ANALYSIS, label: 'ГЛАЗ 👀' },
            { id: GameMode.IMAGE_GAMES, label: 'КВЕСТ 🕵️' },
            { id: 'friends', label: 'БРО 🤜' },
            { id: 'settings', label: 'ОПЦИИ ⚙️' }
          ].map(m => (
            <button key={m.id} onClick={() => { if (m.id === 'friends') setActiveView('friends'); else if (m.id === 'settings') setActiveView('settings'); else { setMode(m.id as GameMode); setActiveView('chat'); } }}
              className={`flex-1 min-w-[110px] py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${ (activeView === 'chat' && mode === m.id) || activeView === m.id ? 'bg-purple-600 text-white neon-border-active' : 'text-white/40 hover:text-white hover:bg-white/5' }`}
              style={((activeView === 'chat' && mode === m.id) || activeView === m.id) ? { borderColor: userTheme.accent } : {}}>
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          {/* Sidebar */}
          <div className="lg:w-1/4 flex flex-col gap-6">
            <div className="bg-slate-950/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 flex flex-col gap-6 shadow-2xl neon-border min-h-[300px]">
              {activeView === 'settings' ? (
                <div className="space-y-8">
                  <h3 className="text-xs font-black uppercase text-purple-400 tracking-widest neon-text">Тюнинг темы</h3>
                  <div className="space-y-4">
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Цвет акцента</p>
                    <div className="grid grid-cols-3 gap-3">
                      {THEME_OPTIONS.accents.map(opt => (
                        <button key={opt.color} onClick={() => setUserTheme(p => ({...p, accent: opt.color}))} 
                          className={`h-10 rounded-xl border-2 transition-all ${userTheme.accent === opt.color ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                          style={{ backgroundColor: opt.color, boxShadow: userTheme.accent === opt.color ? `0 0 15px ${opt.color}` : 'none' }} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (activeView === 'chat' && isVision) ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase text-purple-400 tracking-widest neon-text">Визор 👀</h3>
                    {image && <button onClick={() => setImage(null)} className="text-[9px] text-red-500 font-black uppercase hover:underline">Сброс</button>}
                  </div>
                  <div className="aspect-square bg-black/40 border-2 border-dashed border-purple-500/20 rounded-[2rem] overflow-hidden cursor-pointer flex items-center justify-center relative hover:border-purple-500/50 transition-all neon-border"
                    onClick={() => fileInputRef.current?.click()}>
                    {image ? <img src={image} className="w-full h-full object-cover" /> : <div className="text-center opacity-30"><span className="text-4xl block mb-2">📸</span><p className="text-[10px] font-black uppercase">Загрузи бро!</p></div>}
                    <input type="file" ref={fileInputRef} onChange={e => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onload = () => setImage(r.result as string); r.readAsDataURL(f); } }} className="hidden" accept="image/*" />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase text-purple-400 tracking-widest neon-text">Твоя банда</h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                    {users.filter(u => currentUser?.friends?.includes(u.id)).length ? users.filter(u => currentUser?.friends?.includes(u.id)).map(f => (
                      <div key={f.id} className="bg-white/5 p-4 rounded-2xl flex items-center gap-4 border border-white/5 hover:border-white/20 transition-all neon-border">
                        <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center font-bold text-lg">{f.id === '1' ? '👑' : '👤'}</div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-black uppercase truncate text-white">{f.username}</p>
                          <p className="text-[9px] text-purple-500/60 font-mono tracking-tighter">LEVEL {f.xp}</p>
                        </div>
                      </div>
                    )) : <p className="text-[10px] text-white/20 italic text-center py-10 uppercase tracking-widest">Одинокий волк... 🐺</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-slate-950/20 backdrop-blur-md border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] neon-border relative">
            <div className="px-8 py-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_15px_#22c55e]"></div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-purple-200 neon-text">LUCKY_CORE_ACTIVE 🔥</span>
              </div>
              <div className="text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 px-4 py-1.5 rounded-full border border-purple-500/30 neon-border">XP: {xp}</div>
            </div>

            <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-8 scrollbar-hide bg-gradient-to-b from-transparent to-purple-900/5">
              {history.length === 0 && !isProcessing ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <div className="w-32 h-32 border-4 border-purple-500/30 rounded-full flex items-center justify-center text-6xl animate-spin-slow neon-border-active">😎</div>
                  <p className="text-xs mt-8 font-black uppercase tracking-[0.6em] text-purple-500 neon-text">Слушаю тебя, бро...</p>
                </div>
              ) : (
                history.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} fade-up`}>
                    <div className={`max-w-[80%] p-6 rounded-[2rem] text-sm leading-relaxed font-medium shadow-2xl ${msg.role === 'user' ? 'bg-purple-600 text-white neon-border' : 'bg-black/60 border border-white/10 text-slate-100 neon-border'}`}
                      style={msg.role === 'user' ? { backgroundColor: userTheme.accent, borderColor: 'white' } : {}}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              {isProcessing && (
                <div className="flex justify-start fade-up">
                  <div className="bg-black/40 border border-white/10 rounded-2xl px-6 py-4 animate-pulse neon-border">
                    <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest italic neon-text">Луки расшифровывает... 🧠✨</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-8 bg-black/60 border-t border-white/10 backdrop-blur-2xl">
              <div className="relative group">
                <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} disabled={isProcessing}
                  placeholder={isVision && !image ? "Сначала скинь фото! 📸" : "Напиши что-нибудь дерзкое... 🔥"}
                  className="w-full bg-black/80 border border-white/10 rounded-3xl px-8 py-6 pr-20 text-white placeholder-white/20 focus:border-purple-500 outline-none transition-all font-bold neon-border group-hover:border-purple-500/40" />
                <button type="submit" disabled={isProcessing || !inputText.trim() || (isVision && !image)} 
                  className="absolute right-3 top-3 bottom-3 bg-purple-600 text-white w-14 rounded-2xl flex items-center justify-center hover:bg-purple-500 shadow-2xl disabled:opacity-20 active:scale-90 transition-all neon-border"
                  style={!isProcessing && inputText.trim() && (!isVision || image) ? { backgroundColor: userTheme.accent } : {}}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 15s linear infinite; }
      `}</style>
    </Layout>
  );
};

export default App;
