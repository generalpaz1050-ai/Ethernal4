import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { applyTheme, getSavedTheme } from './lib/themes';
import { getTranslations } from './lib/translations';
import { authAPI, charactersAPI, chatsAPI } from './lib/api';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ChatView from './components/ChatView';
import ExploreView from './components/ExploreView';
import ProfileView from './components/ProfileView';
import SubscriptionView from './components/SubscriptionView';
import AuthCallback from './components/AuthCallback';
import { Flame } from 'lucide-react';
import { Toaster } from './components/ui/sonner';

function AppRouter() {
  const location = useLocation();
  // Detect OAuth callback (synchronous during render)
  if (location.hash && location.hash.includes('session_id=')) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/*" element={<MainApp />} />
    </Routes>
  );
}

function MainApp() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(localStorage.getItem('ethernal-language') || 'es');
  const [currentTheme, setCurrentTheme] = useState(getSavedTheme());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('landing');
  const [characters, setCharacters] = useState([]);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [currentCharacter, setCurrentCharacter] = useState(null);

  const t = getTranslations(language);

  // Initial theme application
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  // Check existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await authAPI.me();
        if (res.data?.user) {
          setUser(res.data.user);
          if (res.data.user.theme) {
            setCurrentTheme(res.data.user.theme);
            applyTheme(res.data.user.theme);
          }
          if (res.data.user.language) {
            setLanguage(res.data.user.language);
            localStorage.setItem('ethernal-language', res.data.user.language);
          }
          setCurrentView('dashboard');
        }
      } catch (e) {
        // Not authenticated
        localStorage.removeItem('ethernal-token');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleAuth = async (isLogin, formData) => {
    try {
      const res = isLogin ? await authAPI.login(formData) : await authAPI.register(formData);
      const { token, user: u } = res.data;
      localStorage.setItem('ethernal-token', token);
      setUser(u);
      setCurrentView('dashboard');
      if (u.theme) {
        setCurrentTheme(u.theme);
        applyTheme(u.theme);
      }
      if (u.language) {
        setLanguage(u.language);
        localStorage.setItem('ethernal-language', u.language);
      }
    } catch (e) {
      alert(e?.response?.data?.detail || 'Error de autenticación');
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (e) { /* ignore */ }
    localStorage.removeItem('ethernal-token');
    setUser(null);
    setCurrentView('landing');
    setCharacters([]);
    setChats([]);
  };

  const loadCharacters = useCallback(async () => {
    try {
      const res = await charactersAPI.list();
      setCharacters(res.data.characters || []);
    } catch (e) {
      console.error('Failed to load characters', e);
    }
  }, []);

  const loadChats = useCallback(async () => {
    try {
      const res = await chatsAPI.list();
      setChats(res.data.chats || []);
    } catch (e) {
      console.error('Failed to load chats', e);
    }
  }, []);

  const createCharacter = async (data) => {
    try {
      await charactersAPI.create(data);
      await loadCharacters();
      return true;
    } catch (e) {
      alert('Error al crear personaje: ' + (e?.response?.data?.detail || e.message));
      return false;
    }
  };

  const deleteCharacter = async (id) => {
    try {
      await charactersAPI.delete(id);
      await loadCharacters();
      await loadChats();
      return true;
    } catch (e) {
      return false;
    }
  };

  const startChat = async (character) => {
    try {
      const res = await chatsAPI.create(character._id || character.id);
      setCurrentChat(res.data.chat);
      setCurrentCharacter(res.data.character);
      setCurrentView('chat');
      loadChats();
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async (message) => {
    if (!currentChat) return null;

    // Optimistic UI: show user's message immediately while AI thinks
    const optimisticUserMsg = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      _optimistic: true,
    };
    setCurrentChat((prev) => ({
      ...prev,
      messages: [...(prev.messages || []), optimisticUserMsg],
    }));

    try {
      const res = await chatsAPI.sendMessage(currentChat._id || currentChat.id, message);
      // Replace optimistic message with server-confirmed messages
      setCurrentChat((prev) => {
        const withoutOptimistic = (prev.messages || []).filter((m) => !m._optimistic);
        return {
          ...prev,
          messages: [...withoutOptimistic, res.data.userMessage, res.data.assistantMessage],
        };
      });
      return res.data;
    } catch (e) {
      // Remove optimistic message on error
      setCurrentChat((prev) => ({
        ...prev,
        messages: (prev.messages || []).filter((m) => !m._optimistic),
      }));
      throw e;
    }
  };

  const updateProfile = async (data) => {
    try {
      const res = await authAPI.updateProfile(data);
      setUser(res.data.user);
      if (data.theme) {
        setCurrentTheme(data.theme);
        applyTheme(data.theme);
      }
      if (data.language) {
        setLanguage(data.language);
        localStorage.setItem('ethernal-language', data.language);
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="gradient-dark flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Flame className="w-16 h-16 mx-auto mb-4 animate-pulse" style={{ color: 'var(--primary)' }} />
          <p className="text-xl" style={{ color: 'var(--foreground)' }}>{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (currentView === 'landing' || !user) {
    return (
      <LandingPage
        t={t}
        language={language}
        setLanguage={(l) => {
          setLanguage(l);
          localStorage.setItem('ethernal-language', l);
        }}
        onAuth={handleAuth}
        onGoogleLogin={handleGoogleLogin}
      />
    );
  }

  if (currentView === 'chat' && currentChat) {
    return (
      <ChatView
        t={t}
        user={user}
        chat={currentChat}
        character={currentCharacter}
        onSendMessage={sendMessage}
        onBack={() => {
          setCurrentView('dashboard');
          loadChats();
        }}
      />
    );
  }

  if (currentView === 'explore') {
    return (
      <ExploreView
        t={t}
        onStartChat={startChat}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  if (currentView === 'profile') {
    return (
      <ProfileView
        t={t}
        user={user}
        currentTheme={currentTheme}
        onUpdateProfile={updateProfile}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  if (currentView === 'subscription') {
    return (
      <SubscriptionView
        t={t}
        user={user}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  return (
    <Dashboard
      t={t}
      user={user}
      characters={characters}
      chats={chats}
      onLogout={handleLogout}
      onViewChange={setCurrentView}
      onCreateCharacter={createCharacter}
      onDeleteCharacter={deleteCharacter}
      onStartChat={startChat}
      onLoadCharacters={loadCharacters}
      onLoadChats={loadChats}
    />
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
