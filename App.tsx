
import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [isAppOpen, setIsAppOpen] = useState(false);

  const handleLaunchApp = () => {
    setIsAppOpen(true);
  };

  const handleExitApp = () => {
    setIsAppOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {isAppOpen ? (
        <Dashboard onExit={handleExitApp} />
      ) : (
        <LandingPage onLaunch={handleLaunchApp} />
      )}
    </div>
  );
};

export default App;
