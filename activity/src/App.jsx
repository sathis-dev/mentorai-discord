import React, { useState, useEffect } from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';
import Quiz from './components/Quiz';
import Dashboard from './components/Dashboard';
import Particles from './components/Particles';
import './styles/App.css';

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

function App() {
  const [auth, setAuth] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupDiscordSdk = async () => {
      try {
        await discordSdk.ready();
        
        const { code } = await discordSdk.commands.authorize({
          client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
          response_type: 'code',
          state: '',
          prompt: 'none',
          scope: ['identify', 'guilds'],
        });

        const response = await fetch('/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const { access_token } = await response.json();
        
        const authResult = await discordSdk.commands.authenticate({ access_token });
        setAuth(authResult);
        setLoading(false);
      } catch (error) {
        console.error('Discord SDK setup error:', error);
        setLoading(false);
      }
    };

    setupDiscordSdk();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <Particles />
        <div className="loading-content animate-scale-in">
          <div className="spinner"></div>
          <h2 className="text-gradient">Loading MentorAI...</h2>
          <p>Preparing your premium learning experience</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Particles />
      
      {currentView === 'home' && (
        <div className="home-view animate-fade-in">
          <div className="container">
            <div className="hero-section animate-slide-down">
              <h1 className="hero-title">
                Welcome to <span className="text-gradient">MentorAI</span>
              </h1>
              <p className="hero-subtitle">
                Your world-class AI learning companion with premium interactive experiences
              </p>
            </div>

            <div className="action-cards">
              <div 
                className="glass-card action-card animate-slide-up"
                onClick={() => setCurrentView('quiz')}
                style={{ animationDelay: '0.1s' }}
              >
                <div className="card-icon">🧠</div>
                <h3>Interactive Quiz</h3>
                <p>Test your knowledge with beautiful, animated quizzes</p>
                <button className="premium-button">Start Quiz →</button>
              </div>

              <div 
                className="glass-card action-card animate-slide-up"
                onClick={() => setCurrentView('dashboard')}
                style={{ animationDelay: '0.2s' }}
              >
                <div className="card-icon">📊</div>
                <h3>Dashboard</h3>
                <p>Track your progress with stunning visualizations</p>
                <button className="premium-button">View Stats →</button>
              </div>

              <div 
                className="glass-card action-card animate-slide-up"
                style={{ animationDelay: '0.3s' }}
              >
                <div className="card-icon">🎓</div>
                <h3>Lessons</h3>
                <p>Learn with interactive, engaging content</p>
                <button className="premium-button">Browse →</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === 'quiz' && (
        <Quiz 
          user={auth?.user} 
          onBack={() => setCurrentView('home')}
        />
      )}

      {currentView === 'dashboard' && (
        <Dashboard 
          user={auth?.user}
          onBack={() => setCurrentView('home')}
        />
      )}
    </div>
  );
}

export default App;
