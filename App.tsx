
import React, { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { RightPanel } from './components/RightPanel';
import { Dashboard } from './components/Dashboard';
import { Chatbot } from './components/Chatbot';
import { Profile } from './components/Profile';
import type { ViewType } from './types';

interface AppContextType {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    currentView: ViewType;
    setCurrentView: React.Dispatch<React.SetStateAction<ViewType>>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

export default function App() {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentView, setCurrentView] = useState<ViewType>('dashboard');

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const toggleDarkMode = useCallback(() => {
        setIsDarkMode(prev => !prev);
    }, []);

    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);

    const appContextValue: AppContextType = {
        isDarkMode,
        toggleDarkMode,
        currentView,
        setCurrentView
    };

    const renderCurrentView = () => {
        switch(currentView) {
            case 'profile':
                return <Profile />;
            case 'dashboard':
            default:
                return <Dashboard />;
        }
    }

    return (
        <AppContext.Provider value={appContextValue}>
            <div className="flex h-screen w-full bg-brand-secondary-light dark:bg-brand-dark text-brand-text-light dark:text-brand-text-dark font-sans animate-fade-in">
                <Sidebar isOpen={isSidebarOpen} />
                <div className="flex flex-col flex-1 w-full overflow-hidden">
                    <Header onToggleSidebar={toggleSidebar} />
                    <main className="flex-1 flex overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                            {renderCurrentView()}
                        </div>
                        <RightPanel />
                    </main>
                </div>
                <Chatbot />
            </div>
        </AppContext.Provider>
    );
}
