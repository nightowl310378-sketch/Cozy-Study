import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, increment, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const THEMES = {
  midnight: {
    name: 'Midnight Zen',
    image: 'https://imgcdn.stablediffusionweb.com/2024/4/26/9071e4c6-c942-41ac-8706-e1a061bb1eae.jpg',
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
    image: 'https://i.pinimg.com/originals/d9/44/32/d944328d137d80608a361c18218efced.jpg',
    bg: '#0f172a',
    accent: '#38bdf8',
    isPremium: false
  },
  ghibliLibrary: {
    name: 'Ghibli Library',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1920&q=80',
    bg: '#1a1c18',
    accent: '#4ade80',
    isPremium: false
  },
  deepSpace: {
    name: 'Deep Space',
    image: 'https://tse4.mm.bing.net/th/id/OIP.pGlBWOHHBlwCrF9IeaQORAHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
    bg: '#000000',
    accent: '#ec4899',
    isPremium: false
  }
};

const StudyChill = () => {
  const [timer, setTimer] = useState(25 * 60);
  const [initialTimer, setInitialTimer] = useState(25 * 60);
  const [customTime, setCustomTime] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [currentTheme, setCurrentTheme] = useState('midnight');
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [sounds, setSounds] = useState({ rain: 0.5, cafe: 0.2, fireplace: 0, lofi: 0.7 });
  const [isThunder, setIsThunder] = useState(false);
  const [spaceVoid, setSpaceVoid] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const audioRef = useRef(null);
  const rainAudioRef = useRef(null);
  const [streak, setStreak] = useState(0);
  const [user, setUser] = useState(null);
  const [topStreakUser, setTopStreakUser] = useState({ name: 'Sasha', streak: 12 });
  const [leaderboard, setLeaderboard] = useState([]);



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchUserData(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserData = async (currentUser) => {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      setStreak(userDoc.data().streak || 0);
    } else {
      await setDoc(doc(db, "users", currentUser.uid), {
        name: currentUser.displayName,
        streak: 0,
        totalMinutes: 0,
        email: currentUser.email
      });
    }
  };

  const fetchLeaderboard = async () => {
    const q = query(collection(db, "users"), orderBy("streak", "desc"), limit(5));
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    setLeaderboard(users);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleTimerComplete = async () => {
    const newStreak = streak + 1;
    setStreak(newStreak);
    
    if (user) {
      await updateDoc(doc(db, "users", user.uid), {
        streak: increment(1),
        totalMinutes: increment(initialTimer / 60)
      });
      fetchLeaderboard();
    } else {
      localStorage.setItem('studyStreak', newStreak);
    }
    alert("Time for a break! Your study streak increased to " + newStreak + "!");
  };

  useEffect(() => {
    audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3'); 
    audioRef.current.loop = true;
    audioRef.current.volume = sounds.lofi;

    rainAudioRef.current = new Audio('https://www.soundjay.com/nature/rain-01.mp3');
    rainAudioRef.current.loop = true;
    rainAudioRef.current.volume = sounds.rain;
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = sounds.lofi;
    }
    if (rainAudioRef.current) {
      rainAudioRef.current.volume = sounds.rain;
    }
  }, [sounds.lofi, sounds.rain]);

  useEffect(() => {
    let thunderInterval = null;
    let voidInterval = null;
    if (currentTheme === 'rainyTokyo') {
      thunderInterval = setInterval(() => {
        if (Math.random() > 0.7) {
          setIsThunder(true);
          setTimeout(() => setIsThunder(false), 150);
        }
      }, 4000);
    }
    if (currentTheme === 'deepSpace') {
      voidInterval = setInterval(() => {
        if (Math.random() > 0.8) {
          setSpaceVoid(true);
          setTimeout(() => setSpaceVoid(false), 1000);
        }
      }, 6000);
    }
    return () => {
      clearInterval(thunderInterval);
      clearInterval(voidInterval);
    };
  }, [currentTheme]);

  useEffect(() => {
    let interval = null;
    if (isActive && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0) {
      clearInterval(interval);
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timer]);

  const toggleMusic = () => {
    if (!audioRef.current || !rainAudioRef.current) return;
    if (!isMusicPlaying) {
      audioRef.current.play().catch(err => console.error("Playback failed:", err));
      rainAudioRef.current.play().catch(err => console.error("Playback failed:", err));
    } else {
      audioRef.current.pause();
      rainAudioRef.current.pause();
    }
    setIsMusicPlaying(!isMusicPlaying);
  };

  const updateLofiVolume = (val) => {
    setSounds({...sounds, lofi: val});
    if (audioRef.current) audioRef.current.volume = val;
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

  const handleSetTimer = () => {
    const mins = parseInt(customTime);
    if (mins > 0 && mins <= 1440) {
      const seconds = mins * 60;
      setTimer(seconds);
      setInitialTimer(seconds);
      setIsActive(false);
      setCustomTime('');
    } else {
      alert("Please enter a valid number of minutes (1-1440)");
    }
  };

  const theme = THEMES[currentTheme];

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div 
      className={`min-h-screen transition-colors duration-1000 relative overflow-hidden font-sans selection:bg-white/20`} 
      style={{ backgroundColor: theme.bg }}
    >
      <motion.div 
        key={currentTheme}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ 
          backgroundImage: `url(${theme.image})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          filter: 'brightness(0.4) contrast(0.9) saturate(0.7) sepia(0.2)' 
        }}
      />

      <AnimatePresence>
        {isThunder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 bg-white pointer-events-none" />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {spaceVoid && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 bg-black pointer-events-none transition-all duration-1000" style={{ mixBlendMode: 'multiply' }} />
        )}
      </AnimatePresence>
      
      <div className="absolute inset-0 z-50 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* GLOWING EFFECT - Removed for Kashmir and Tokyo */}
      {currentTheme !== 'indianRetro' && currentTheme !== 'rainyTokyo' && (
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full blur-[150px] opacity-30 animate-pulse transition-colors duration-1000"
          style={{ background: `radial-gradient(circle, ${theme.accent} 0%, transparent 70%)` }}
        />
      )}

      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div id="youtube-player"></div>
      </div>

        <nav className="flex justify-between items-center p-8 max-w-full mx-auto relative z-10 pl-4">
           <div className="flex items-center gap-3 transition-colors duration-500">
             <img src="https://th.bing.com/th/id/OIG3.FLz7CcBGdCH2BuhjRuEE?w=1248&h=832&qlt=30&p=0&r=0&o=4&pid=ImgGn" alt="logo" className="w-8 h-8 rounded-full object-cover" />
             <div className={`text-xl md:text-2xl font-bold tracking-tighter ${theme.accent} text-center`} style={{ fontFamily: '"Comic Sans MS", "Apple Chancery", cursive' }}>StudyChill.</div>
           </div>
            <div className="flex gap-6 items-center">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    <span className="text-orange-400">🔥</span>
                    <span className="font-medium text-white">{streak} Day Streak</span>
                  </div>
                  <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-white transition-colors underline">Logout</button>
                </div>
              ) : (
                <button onClick={handleLogin} className="bg-white text-black px-4 py-1 rounded-full text-sm font-medium hover:bg-gray-200 transition-all">Login with Google</button>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  <span className="text-yellow-400">👑</span>
                  <span className="text-xs">Top: {leaderboard[0]?.name || 'Sasha'} ({leaderboard[0]?.streak || 12}d)</span>
                </div>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                <span>1,420 studying</span>
              </div>
              <div className="flex items-center gap-2">
               <span className="text-xl">🐱</span>
             </div>
            </div>
        </nav>

      <main className="relative z-10 flex flex-col lg:flex-row items-start justify-center gap-12 px-6 py-12 max-w-7xl mx-auto">
        <div className="flex-1 flex flex-col items-center w-full">
           <motion.div layout className="w-full max-w-md bg-black/40 backdrop-blur-3xl border border-white/10 p-12 rounded-[3rem] text-center shadow-2xl">
             <h2 className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-6">Focus Session</h2>
             <div className="text-8xl font-light tracking-tighter mb-10 tabular-nums text-white drop-shadow-xl">{formatTime(timer)}</div>
             <div className="flex flex-col gap-6 items-center">
               <div className="flex gap-4 justify-center">
                 <button onClick={() => setIsActive(!isActive)} className={`px-12 py-4 rounded-full font-bold transition-all transform hover:scale-105 ${isActive ? 'bg-red-500/20 text-red-400 border border-red-500/50' : `text-white border border-white/20 hover:bg-white/10 shadow-lg`}`}>{isActive ? 'Pause' : 'Start Study'}</button>
                 <button onClick={() => {setIsActive(false); setTimer(initialTimer);}} className="bg-white/5 hover:bg-white/10 px-6 py-4 rounded-full transition-all border border-white/10">Reset</button>
               </div>
               <div className="flex items-center gap-3 bg-white/5 p-2 rounded-full border border-white/10">
                 <input 
                   type="number" 
                   value={customTime} 
                   onChange={(e) => setCustomTime(e.target.value)} 
                   placeholder="Set Mins" 
                   className="bg-transparent border-none outline-none px-4 py-1 text-sm text-white w-24 placeholder:text-gray-600" 
                 />
                 <button onClick={handleSetTimer} className="bg-white text-black px-4 py-1 rounded-full text-xs font-bold hover:bg-gray-200 transition-all">Set Timer</button>
               </div>
             </div>
           </motion.div>

          <div className="mt-12 w-full max-w-md">
            <h3 className="text-center text-sm text-gray-500 mb-4 uppercase tracking-widest">Atmosphere</h3>
            <div className="flex justify-center gap-3 flex-wrap">
              {Object.entries(THEMES).map(([key, val]) => (
                <button key={key} onClick={() => setCurrentTheme(key)} className={`px-4 py-2 rounded-full text-xs transition-all border ${currentTheme === key ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}>{val.name}</button>
              ))}
            </div>
          </div>

           <div className="mt-12 w-full max-w-md bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col gap-4">
             <div className="flex items-center gap-6">
               <button onClick={toggleMusic} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                 <span className="text-xl">{isMusicPlaying ? '⏸' : '▶️'}</span>
               </button>
               <div className="flex-1">
                 <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                   <span className="font-bold">Lofi Beats</span>
                   <span>{Math.round(sounds.lofi * 100)}%</span>
                 </div>
                 <input type="range" min="0" max="1" step="0.01" value={sounds.lofi} onChange={(e) => updateLofiVolume(parseFloat(e.target.value))} className="w-full accent-purple-500 h-1" />
               </div>
             </div>
             <div className="flex items-center gap-6 border-t border-white/5 pt-4">
               <div className="flex-1">
                 <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                   <span className="font-bold">Rain Drops</span>
                   <span>{Math.round(sounds.rain * 100)}%</span>
                 </div>
                 <input type="range" min="0" max="1" step="0.01" value={sounds.rain} onChange={(e) => {
                   setSounds({...sounds, rain: parseFloat(e.target.value)});
                   if (rainAudioRef.current) rainAudioRef.current.volume = parseFloat(e.target.value);
                 }} className="w-full accent-blue-500 h-1" />
               </div>
             </div>
           </div>
        </div>

        <div className="w-full lg:w-96 flex flex-col gap-6">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl">
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

           <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl">
             <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><span>👥</span> Global Leaderboard</h3>
             <div className="space-y-4">
               {leaderboard.length > 0 ? leaderboard.map((user, i) => (
                 <div key={user.id} className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">{i + 1}</div>
                     <div className="font-medium">{user.name} <span className="text-gray-500 font-normal">streak:</span> {user.streak}d</div>
                   </div>
                   <span className="text-xs text-gray-500">{Math.round(user.totalMinutes || 0)}m total</span>
                 </div>
               )) : (
                 <div className="text-sm text-gray-500 text-center py-4">Loading legends...</div>
               )}
             </div>
           </div>
        </div>
      </main>

      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          <button onClick={() => setShowContact(true)} className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-5 py-3 rounded-full text-sm text-gray-300 transition-all transform hover:scale-105 flex items-center gap-2 shadow-xl">
            <span>✉️</span> Contact Me
          </button>
          <AnimatePresence>
            {showContact && (
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.9 }} className="absolute bottom-full right-0 mb-4 w-64 bg-black/80 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl shadow-2xl z-50">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Email Me</p>
                <a href="mailto:nightowl310378@gmail,com" className="text-sm text-white font-medium hover:text-purple-400 transition-colors block break-all">nightowl310378@gmail.com</a>
                <button onClick={() => setShowContact(false)} className="absolute top-2 right-2 text-gray-500 hover:text-white text-xs">✕</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <footer className="text-center py-12 relative z-10">
        <p className="text-gray-600 text-sm italic">"Peace is the prerequisite for focus."</p>
      </footer>
    </div>
  );
};

export default StudyChill;
