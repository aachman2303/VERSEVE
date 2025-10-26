
import React from 'react';

export const RightPanel: React.FC = () => {
    return (
        <aside className="hidden lg:block w-72 flex-shrink-0 bg-brand-light dark:bg-brand-secondary-dark border-l border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4">Smart Suggestions</h2>
            <div className="space-y-4">
                <div className="bg-brand-secondary-light dark:bg-brand-dark p-4 rounded-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <h3 className="font-semibold text-sm mb-1">Next Micro-Lesson</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Based on your recent activity, try exploring "Quantum Entanglement".</p>
                    <button className="mt-2 text-xs font-semibold text-brand-accent-teal hover:underline">Start Now</button>
                </div>
                <div className="bg-brand-secondary-light dark:bg-brand-dark p-4 rounded-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <h3 className="font-semibold text-sm mb-1">Practice Now (5 mins)</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Review key concepts from "General Relativity" to solidify your knowledge.</p>
                    <button className="mt-2 text-xs font-semibold text-brand-accent-teal hover:underline">Practice</button>
                </div>
            </div>

            <h2 className="text-lg font-semibold mt-8 mb-4">Learning Streak</h2>
            <div className="bg-brand-secondary-light dark:bg-brand-dark p-4 rounded-lg flex items-center justify-center flex-col">
                 <div className="text-4xl font-bold text-brand-accent-purple">12</div>
                 <div className="text-sm">days</div>
            </div>
             <h2 className="text-lg font-semibold mt-8 mb-4">Activity</h2>
             <ul className="space-y-3 text-sm list-disc list-inside text-gray-500 dark:text-gray-400">
                <li>Completed quiz on "Calculus".</li>
                <li>Generated a video for "Black Holes".</li>
                <li>Shared flowchart with a friend.</li>
             </ul>
        </aside>
    );
};