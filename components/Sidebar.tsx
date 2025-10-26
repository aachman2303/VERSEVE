
import React from 'react';
import { useApp } from '../App';
import { BotIcon, DashboardIcon, PlusCircleIcon, FileTextIcon, UserIcon, TrophyIcon } from './Icons';

type SidebarProps = {
    isOpen: boolean;
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; view: string; disabled?: boolean; }> = ({ icon, label, view, disabled }) => {
    const { currentView, setCurrentView } = useApp();
    const isActive = currentView === view;
    return (
        <button
            onClick={() => !disabled && setCurrentView(view as any)}
            disabled={disabled}
            className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                isActive
                    ? 'bg-brand-accent-purple/10'
                    : 'hover:bg-gray-500/10'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <span className={`transition-colors duration-200 ${isActive ? 'text-brand-accent-purple' : 'text-brand-subtle-dark dark:text-brand-subtle-light group-hover:text-brand-text-light dark:group-hover:text-brand-text-dark'}`}>{icon}</span>
            <span className={`ml-3 font-semibold transition-colors duration-200 ${isActive ? 'bg-gradient-to-r from-brand-accent-purple to-brand-accent-teal bg-clip-text text-transparent' : 'group-hover:text-brand-text-light dark:group-hover:text-brand-text-dark'}`}>{label}</span>
        </button>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
    return (
        <aside className={`flex-shrink-0 bg-brand-light dark:bg-brand-secondary-dark border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
            <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <BotIcon className="h-8 w-8 text-brand-accent-teal" />
                <h1 className="ml-2 text-xl font-bold bg-gradient-to-r from-brand-accent-teal to-brand-accent-purple bg-clip-text text-transparent">VERSEVE</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <NavItem icon={<DashboardIcon className="h-5 w-5" />} label="Dashboard" view="dashboard" />
                <NavItem icon={<UserIcon className="h-5 w-5" />} label="Profile" view="profile" />
                <NavItem icon={<PlusCircleIcon className="h-5 w-5" />} label="New Input" view="input" disabled/>
                <NavItem icon={<FileTextIcon className="h-5 w-5" />} label="Workspace" view="workspace" disabled/>
                <NavItem icon={<TrophyIcon className="h-5 w-5" />} label="Games" view="games" disabled/>
                <NavItem icon={<FileTextIcon className="h-5 w-5" />} label="Analytics" view="analytics" disabled/>
            </nav>
        </aside>
    );
};
