
import React from 'react';
import { MenuIcon, SearchIcon, BellIcon, SunIcon, MoonIcon } from './Icons';
import { useApp } from '../App';

type HeaderProps = {
    onToggleSidebar: () => void;
};

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
    const { isDarkMode, toggleDarkMode, setCurrentView } = useApp();

    return (
        <header className="flex-shrink-0 bg-brand-light dark:bg-brand-secondary-dark border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 h-16">
            <div className="flex items-center space-x-4">
                <button onClick={onToggleSidebar} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors transform hover:scale-110">
                    <MenuIcon className="h-6 w-6" />
                </button>
                <div className="relative hidden md:block">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search workspace..."
                        className="bg-brand-secondary-light dark:bg-brand-dark border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-brand-accent-purple focus:shadow-[0_0_0_2px_rgba(139,92,246,0.3)] transition-shadow"
                    />
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors transform hover:scale-110">
                    {isDarkMode ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-gray-700" />}
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 relative transition-colors transform hover:scale-110">
                    <BellIcon className="h-6 w-6" />
                    <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-brand-light dark:border-brand-secondary-dark"></span>
                </button>
                <button onClick={() => setCurrentView('profile')} className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-accent-teal to-brand-accent-purple p-0.5 transition-transform transform hover:scale-110">
                    <img
                        src="https://picsum.photos/seed/user/40/40"
                        alt="User Avatar"
                        className="h-full w-full rounded-full"
                    />
                </button>
            </div>
        </header>
    );
};
