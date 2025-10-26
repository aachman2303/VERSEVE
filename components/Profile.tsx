
import React from 'react';
// FIX: Import missing icons to resolve 'used before declaration' errors and allow for removal of local duplicate definitions.
import { StarIcon, BookOpenIcon, TrophyIcon, UserIcon, BellIcon, SunIcon, PlusCircleIcon, PlayCircleIcon, MicIcon, ImageIcon, BrainIcon, TrendingUpIcon } from './Icons';
import type { Achievement } from '../types';

// --- MOCK DATA ---
const userStats = [
    { name: 'Learning Streak', value: '12 Days', icon: <StarIcon className="w-8 h-8 text-yellow-400" /> },
    { name: 'Topics Mastered', value: '8', icon: <BookOpenIcon className="w-8 h-8 text-green-500" /> },
    { name: 'Quizzes Completed', value: '14', icon: <TrophyIcon className="w-8 h-8 text-brand-accent-purple" /> },
];

const achievements: Achievement[] = [
    { icon: <PlusCircleIcon className="w-6 h-6"/>, title: "First Transformation", description: "Create your first learning set.", unlocked: true },
    { icon: <TrophyIcon className="w-6 h-6"/>, title: "Quiz Whiz", description: "Get a perfect score on a quiz.", unlocked: true },
    { icon: <StarIcon className="w-6 h-6"/>, title: "5-Day Streak", description: "Maintain a learning streak for 5 days.", unlocked: true },
    { icon: <PlayCircleIcon className="w-6 h-6"/>, title: "Video Virtuoso", description: "Generate your first AI video.", unlocked: true },
    { icon: <MicIcon className="w-6 h-6"/>, title: "Podcast Pro", description: "Listen to your first podcast.", unlocked: false },
    { icon: <ImageIcon className="w-6 h-6"/>, title: "Image Explorer", description: "Analyze an image.", unlocked: false },
    { icon: <BrainIcon className="w-6 h-6"/>, title: "Curious Mind", description: "Ask JARVIS 10 questions.", unlocked: false },
    { icon: <TrendingUpIcon className="w-6 h-6"/>, title: "Power Learner", description: "Master 10 topics.", unlocked: false },
];

const recentActivity = [
    "Completed quiz on 'Quantum Mechanics'.",
    "Generated a video for 'The Renaissance'.",
    "Mastered the topic 'Cellular Biology'.",
    "Shared a flowchart with a colleague.",
];

// --- SUB-COMPONENTS ---
const StatCard: React.FC<{ stat: typeof userStats[0] }> = ({ stat }) => (
    <div className="bg-brand-light dark:bg-brand-secondary-dark p-6 rounded-xl shadow-lg flex items-center space-x-4 transition-transform transform hover:-translate-y-1">
        <div className="p-3 bg-brand-secondary-light dark:bg-brand-dark rounded-full">
            {stat.icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
        </div>
    </div>
);

const AchievementBadge: React.FC<{ achievement: Achievement }> = ({ achievement }) => (
    <div className={`p-4 rounded-lg flex items-center space-x-3 transition-all ${achievement.unlocked ? 'bg-brand-secondary-light dark:bg-brand-dark' : 'bg-gray-100 dark:bg-gray-800/50'}`}>
        <div className={`p-2 rounded-full ${achievement.unlocked ? 'bg-gradient-to-br from-brand-accent-teal to-brand-accent-purple text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
            {achievement.icon}
        </div>
        <div>
            <h4 className={`font-bold ${achievement.unlocked ? '' : 'text-gray-500 dark:text-gray-400'}`}>{achievement.title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{achievement.description}</p>
        </div>
    </div>
);

const SettingsItem: React.FC<{icon: React.ReactNode; title: string; description: string}> = ({icon, title, description}) => (
     <div className="flex items-center space-x-4 p-4 rounded-lg hover:bg-brand-secondary-light dark:hover:bg-brand-dark transition-colors">
        <div className="text-brand-accent-teal">{icon}</div>
        <div>
            <h4 className="font-semibold">{title}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <button className="ml-auto text-sm font-semibold bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-md">Manage</button>
    </div>
);


// --- MAIN PROFILE COMPONENT ---
export const Profile: React.FC = () => {
    return (
        <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-brand-accent-teal to-brand-accent-purple p-1">
                    <img src="https://picsum.photos/seed/user/100/100" alt="User Avatar" className="h-full w-full rounded-full" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Alex Doe</h1>
                    <p className="text-gray-500 dark:text-gray-400">Lifelong Learner | Quantum Enthusiast</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userStats.map(stat => <StatCard key={stat.name} stat={stat} />)}
            </div>

            {/* Achievements */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Achievements</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {achievements.map(ach => <AchievementBadge key={ach.title} achievement={ach} />)}
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                        {recentActivity.map((activity, index) => (
                             <div key={index} className="flex items-center space-x-3 p-3 bg-brand-light dark:bg-brand-secondary-dark rounded-lg">
                                <div className="w-2 h-2 rounded-full bg-brand-accent-teal"></div>
                                <p className="text-sm">{activity}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Settings */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Settings</h2>
                    <div className="space-y-2">
                        <SettingsItem icon={<UserIcon className="w-5 h-5"/>} title="Account" description="Manage your profile and password."/>
                        <SettingsItem icon={<BellIcon className="w-5 h-5"/>} title="Notifications" description="Choose how you get updates."/>
                        {/* FIX: Corrected typo in className 'h--5' to 'h-5' */}
                        <SettingsItem icon={<SunIcon className="w-5 h-5"/>} title="Appearance" description="Customize the look and feel."/>
                    </div>
                </div>
            </div>
        </div>
    );
};
