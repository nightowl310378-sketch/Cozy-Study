import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const THEMES = {
  midnight: {
    name: 'Midnight Zen',
    image: 'https://images.unsplash.com/photo-1475274047050-1797ee30597a?auto=format&fit=crop&w=1920&q=80',
    bg: '#0a0a0c',
    accent: '#8b5cf6',
    isPremium: false
  },
  indianRetro: {
    name: 'Kashmir Cozy',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
    bg: '#1a1412',
    accent: '#f97316',
    isPremium: false
  },
  rainyTokyo: {
    name: 'Rainy Tokyo',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeae?auto=format&fit=crop&w=1920&q=80',
    bg: '#0f172a',
    accent: '#38bdf8',
    isPremium: true
  },
  ghibliLibrary: {
    name: 'Ghibli Library',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1920&q=80',
    bg: '#1a1c18',
    accent: '#4ade80',
    isPremium: true
  },
  deepSpace: {
    name: 'Deep Space',
    image: 'https://images.unsplash.com/photo-1464802686167-b//fit=crop&w=1920&q=80',
    bg: '#05050a',
    accent: '#ec4899',
    isPremium: true
  }
};

const StudyChill = () => {
  const [timer, setTimer] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchActive, setIsStopwatchActive] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [currentTheme, setCurrentTheme] = useState('midnight');
  const [isPremium, setIsPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [sounds, setSounds] = useState({ rain: 0.5, cafe: 0.2, fireplace: 0, lofi: 0.7 });
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [rewardUnlocked, setRewardUnlocked] = useState(false);
  const [tempPremiumTheme, setTempPremiumTheme] = useState(null);

  const playerRef = useRef(null);

  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '0', width: '0',
        videoId: 'jfKfPfyS7dg',
        playerVars: { 'autoplay': 0, 'controls': 0, 'loop': 1, 'playlist': 'jfKfPfyS7dg' },
      });
    };
  }, []);

  useEffect(() => {
    let interval = null;
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
        setTotalStudyTime(prev => prev + 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
      alert("Time for a break!");
    }
    return () => clearInterval(interval);
  }, [isActive, timer]);

  useEffect(() => {
    let interval = null;
    if (isStopwatchActive) {
      interval = setInterval(() => {
        setStopwatchTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStopwatchActive]);

  useEffect(() => {
    if (totalStudyTime >= 3600 && !isPremium && !rewardUnlocked) {
      setRewardUnlocked(true);
    }
  }, [totalStudyTime, isPremium, rewardUnlocked]);

  const toggleMusic = () => {
    if (!isMusicPlaying) {
      playerRef.current?.playVideo();
    } else {
      playerRef.current?.pauseVideo();
    }
    setIsMusicPlaying(!isMusicPlaying);
  };

  const updateLofiVolume = (val) => {
    setSounds({...sounds, lofi: val});
    playerRef.current?.setVolume(val * 100);
  };

  const handleThemeChange = (themeKey) => {
    if (THEMES[themeKey].isPremium && !isPremium && tempPremiumTheme !== themeKey) {
      setShowPaywall(true);
    } else {
      setCurrentTheme(themeKey);
    }
  };

  const claimReward = () => {
    const premiumThemes = Object.keys(THEMES).filter(k => THEMES[k].isPremium);
    const randomTheme = premiumThemes[Math.floor(Math.random() * premiumThemes.length)];
    setTempPremiumTheme(randomTheme);
    setCurrentTheme(randomTheme);
    setRewardUnlocked(false);
    setTimeout(() => { setTempPremiumTheme(null); setCurrentTheme('midnight'); }, 3600 * 1000);
  };

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
      setNewTask('');
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatStopwatch = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins < 10 && hrs > 0 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const theme = THEMES[currentTheme];

  return (
    <div 
      className="min-h-screen transition-colors duration-1000 relative overflow-hidden font-sans selection:bg-white/20"
      style={{ backgroundColor: theme.bg }}
    >
      {/* BACKGROUND IMAGE LAYER */}
      <motion.div 
        key={currentTheme}
        initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} transition={{ duration: 1 }}
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ 
          backgroundImage: `url(${theme.image})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          filter: 'blur(8px)' 
        }}
      />
      
      {/* Grain Overlay */}
      <div className="absolute inset-0 z-50 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Animated Radial Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full blur-[150px] opacity-30 animate-pulse transition-colors duration-1000"
        style={{ background: `radial-gradient(circle, ${theme.accent} 0%, transparent 70%)` }}
      />

      <div id="youtube-player" className="hidden"></div>

      <nav className="flex justify-between items-center p-8 max-w-7xl mx-auto relative z-10">
        <div className={`text-2xl font-bold tracking-tighter transition-colors duration-500 ${theme.accent}`}>StudyChill.</div>
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
            <span>1,420 studying now</span>
          </div>
          <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm transition-all backdrop-blur-md border border-white/10 text-gray-300">Login</button>
        </div>
      </nav>

      <main className="relative z-10 flex flex-col lg:flex-row items-start justify-center gap-12 px-6 py-12 max-w-7xl mx-auto">
        <div className="flex-1 flex flex-col items-center w-full">
          <motion.div layout className="w-full max-w-md bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-12 rounded-[3rem] text-center shadow-2xl">
            <h2 className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-6">Focus Session</h2>
            <div className="text-8xl font-light tracking-tighter mb-10 tabular-nums text-white drop-shadow-xl">{formatTime(timer)}</div>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setIsActive(!isActive)} className={`px-12 py-4 rounded-full font-bold transition-all transform hover:scale-105 ${isActive ? 'bg-red-500/20 text-red-400 border border-red-500/50' : `text-white border border-white/20 hover:bg-white/10 shadow-lg`}`}>{isActive ? 'Pause' : 'Start Study'}</button>
              <button onClick={() => {setIsActive(false); setTimer(25 * 60);}} className="bg-white/5 hover:bg-white/10 px-6 py-4 rounded-full transition-all border border-white/10">Reset</button>
            </div>
            
            <div className="mt-8 p-6 bg-white/10 rounded-3xl border border-white/20 flex flex-col items-center gap-4 shadow-inner">
              <h3 className="text-sm uppercase tracking-widest text-purple-300 font-bold">Stopwatch</h3>
              <div className="text-6xl font-mono tracking-tighter tabular-nums text-white drop-shadow-lg">{formatStopwatch(stopwatchTime)}</div>
              <div className="flex gap-4">
                <button onClick={() => setIsStopwatchActive(!isStopwatchActive)} className={`px-8 py-2 rounded-full text-sm font-bold transition-all ${isStopwatchActive ? 'bg-red-500 text-white' : 'bg-green-500 text-white hover:bg-green-400'}`}>{isStopwatchActive ? 'Stop' : 'Start'}</button>
                <button onClick={() => {setIsStopwatchActive(false); setStopwatchTime(0);}} className="px-8 py-2 rounded-full text-sm font-bold bg-white/20 text-white hover:bg-white/30 transition-all">Reset</button>
              </div>
            </div>
          </motion.div>

          <div className="mt-12 w-full max-w-md">
            <h3 className="text-center text-sm text-gray-500 mb-4 uppercase tracking-widest">Atmosphere</h3>
            <div className="flex justify-center gap-3 flex-wrap">
              {Object.entries(THEMES).map(([key, val]) => (
                <button key={key} onClick={() => handleThemeChange(key)} className={`px-4 py-2 rounded-full text-xs transition-all border ${currentTheme === key ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}>{val.name} {val.isPremium && '⭐'}</button>
              ))}
            </div>
          </div>

          <div className="mt-12 w-full max-w-md bg-white/[0.03] backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-6">
            <button onClick={toggleMusic} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
              <span className="text-xl">{isMusicPlaying ? '⏸' : '▶️'}</span>
            </button>
            <div className="flex-1">
              <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                <span>Lofi Beats</span>
                <span>{Math.round(sounds.lofi * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.1" value={sounds.lofi} onChange={(e) => updateLofiVolume(parseFloat(e.target.value))} className="w-full accent-purple-500 h-1" />
            </div>
          </div>
        </div>

        <div className="w-full lg:w-96 flex flex-col gap-6">
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><span>🎯</span> Session Goals</h3>
            <div className="flex gap-2 mb-4">
              <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addTask()} placeholder="What are we studying?" className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-all" />
              <button onClick={addTask} className="bg-purple-600 p-2 rounded-lg hover:bg-purple-500 transition-all">+</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {tasks.map(task => (
                <div key={task.id} onClick={() => toggleTask(task.id)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all group">
                  <div className={`w-5 h-5 rounded-full border ${task.completed ? 'bg-purple-500 border-purple-500' : 'border-gray-500'} transition-all`} />
                  <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>{task.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><span>👥</span> Live Now</h3>
            <div className="space-y-4">
              {[ { name: 'Sasha', topic: 'Biology', time: '2h' }, { name: 'Leo', topic: 'Physics', time: '45m' }, { name: 'Mia', topic: 'History', time: '1h' } ].map((user, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full" />
                    <div className="font-medium">{user.name} <span className="text-gray-500 font-normal">is studying</span> {user.topic}</div>
                  </div>
                  <span className="text-xs text-gray-500">{user.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showPaywall && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#1a1a2e] border border-white/20 p-10 rounded-[3rem] max-w-md w-full text-center shadow-2xl">
              <div className="text-5xl mb-6">⭐</div>
              <h2 className="text-2xl font-bold mb-4">Unlock Premium Themes</h2>
              <p className="text-gray-400 mb-8">Get access to Rainy Tokyo, Ghibli Library, and Deep Space to maximize your focus.</p>
              <button onClick={() => {setIsPremium(true); setShowPaywall(false);}} className="w-full bg-purple-600 py-4 rounded-full font-bold hover:bg-purple-500 transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30">Upgrade to Premium (₹99)</button>
              <button onClick={() => setShowPaywall(false)} className="mt-4 text-sm text-gray-500 hover:text-gray-300 transition-all">Maybe later</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="text-center py-12 relative z-10">
        <p className="text-gray-600 text-sm italic">"Peace is the prerequisite for focus."</p>
      </footer>
    </div>
  );
};

export default StudyChill;
