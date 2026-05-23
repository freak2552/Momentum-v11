import React, { useState, useEffect } from 'react';
import { Calendar, Award, Settings, Target, Sun, Moon, FileText, Grid3X3, Activity, ChevronLeft, ChevronRight, Map, PieChart } from 'lucide-react';
import { API_BASE_URL, formatDateKey, formatOrdinalDate, getStartOfWeek } from './utils';

// Import sub-components
import WeeklyLeagueWidget from './WeeklyLeagueWidget';
import DailyLog from './DailyLog';
import Habits from './Habits';
import Routines from './Routines';
import WeeklyReview from './WeeklyReview';
import Reports from './Reports';
import Journey from './Journey';
import Dashboard from './Dashboard';

export default function App() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [logs, setLogs] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [routines, setRoutines] = useState({
        'default': { name: 'Default Routine', theme: 'Building Consistency', dropThreshold: 75, tasks: [] }
    });
    const [activeRoutineId, setActiveRoutineId] = useState('default');
    const [activeTab, setActiveTab] = useState('input');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [logsRes, settingsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/logs`),
                    fetch(`${API_BASE_URL}/settings`)
                ]);

                setLogs(await logsRes.json());
                const settings = await settingsRes.json();

                if (settings.routines) setRoutines(settings.routines);
                if (settings.activeRoutineId) setActiveRoutineId(settings.activeRoutineId);
                if (settings.isDarkMode !== undefined) setIsDarkMode(settings.isDarkMode);
            } catch (e) {
                console.error("Error loading from API:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleTheme = async () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        try {
            await fetch(`${API_BASE_URL}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isDarkMode: newMode })
            });
        } catch (e) { console.error(e); }
    };

    const saveRoutines = async (updatedRoutines, newActiveId) => {
        const resolvedActiveId = newActiveId !== undefined ? newActiveId : activeRoutineId;
        setRoutines(updatedRoutines);
        setActiveRoutineId(resolvedActiveId);
        try {
            await fetch(`${API_BASE_URL}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ routines: updatedRoutines, activeRoutineId: resolvedActiveId, isDarkMode })
            });
        } catch (e) { console.error(e); }
    };

    const handleDeleteRoutine = () => {
        if (Object.keys(routines).length <= 1) { alert("You must have at least one routine version."); return; }
        if (window.confirm(`Are you sure you want to delete "${routines[activeRoutineId].name}"?`)) {
            const newRoutines = { ...routines };
            delete newRoutines[activeRoutineId];
            saveRoutines(newRoutines, Object.keys(newRoutines)[0]);
        }
    };

    const navigateDate = (direction) => {
        const newDate = new Date(currentDate);
        if (activeTab === 'summary') {
            newDate.setDate(newDate.getDate() + (direction * 7));
        } else {
            newDate.setDate(newDate.getDate() + direction);
        }
        setCurrentDate(newDate);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-500">
                <Activity className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    const activeRoutine = routines[activeRoutineId] || { name: 'Unknown', theme: '', tasks: [] };
    const currentLogKey = formatDateKey(currentDate);
    const currentLog = logs[currentLogKey];
    const displayedTheme = (currentLog && currentLog.theme) ? currentLog.theme : (activeRoutine.theme || '');

    const mainBg = isDarkMode ? 'bg-slate-900' : 'bg-slate-100';
    const cardBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
    const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
    const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

    return (
        <div className={`min-h-screen font-sans selection:bg-slate-300 p-0 md:p-8 transition-colors duration-300 ${mainBg} ${textPrimary}`}>
            <style>{`
                input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
            `}</style>

            <div className={`max-w-md md:max-w-6xl mx-auto min-h-screen md:min-h-[800px] shadow-xl overflow-hidden flex flex-col md:flex-row md:border md:rounded-3xl transition-colors duration-300 ${cardBg}`}>
                {/* --- LEFT SIDEBAR --- */}
                <div className={`md:w-80 flex-shrink-0 flex flex-col z-20 transition-colors duration-500 ${isDarkMode ? 'bg-slate-900 md:border-r border-slate-700' : 'bg-slate-50 md:bg-white md:border-r border-slate-200'}`}>
                    <div className="p-6 text-white md:text-slate-900 md:bg-none md:bg-transparent">
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                            <div>
                                <h1 className={`text-2xl font-black flex items-center gap-2 uppercase tracking-tight ${isDarkMode ? 'md:text-white' : 'md:text-slate-900'}`}>
                                    <Target className="w-6 h-6" />
                                    <span>The Ten Steps</span>
                                </h1>
                                {displayedTheme && (
                                    <p className={`text-xs font-bold mt-1 uppercase tracking-widest pl-8 opacity-90 ${isDarkMode ? 'md:text-slate-400' : 'md:text-slate-600'}`}>
                                        {displayedTheme}
                                    </p>
                                )}
                            </div>
                            <button onClick={toggleTheme} className="p-2 transition rounded-full bg-slate-200/50 hover:bg-slate-200">
                                {isDarkMode ? <Sun className="w-4 h-4 md:text-yellow-400" /> : <Moon className="w-4 h-4 md:text-slate-700" />}
                            </button>
                        </div>
                    </div>
                                {/* paste your button for the UI */}
                    <div className="flex-col flex-1 hidden gap-6 p-6 overflow-y-auto md:flex">
                        <nav className="space-y-1">
                            <button onClick={() => setActiveTab('input')} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'input' ? (isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900') : textSecondary + ' hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                <Calendar className="w-5 h-5" /> Daily Log
                            </button>
                            <button onClick={() => setActiveTab('summary')} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'summary' ? (isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900') : textSecondary + ' hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                <Award className="w-5 h-5" /> Weekly Review
                            </button>
                            <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'dashboard' ? (isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900') : textSecondary + ' hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                <PieChart className="w-5 h-5" /> Dashboard
                            </button>
                            <button onClick={() => setActiveTab('journey')} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'journey' ? (isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900') : textSecondary + ' hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                <Map className="w-5 h-5" /> Journey
                            </button>
                            <button onClick={() => setActiveTab('habits')} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'habits' ? (isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900') : textSecondary + ' hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                <Grid3X3 className="w-5 h-5" /> Habits
                            </button>
                            <button onClick={() => setActiveTab('settings')} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'settings' ? (isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900') : textSecondary + ' hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                <Settings className="w-5 h-5" /> Routines
                            </button>
                            <button onClick={() => setActiveTab('report')} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'report' ? (isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900') : textSecondary + ' hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                <FileText className="w-5 h-5" /> Report
                            </button>
                        </nav>
                        <hr className={isDarkMode ? 'border-slate-700' : 'border-slate-200'} />
                        <WeeklyLeagueWidget logs={logs} currentDate={currentDate} isDark={isDarkMode} />
                    </div>
                </div>

                {/* --- MAIN CONTENT AREA --- */}
                <div className={`flex-1 flex flex-col h-full overflow-hidden relative ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50/50'}`}>
                    <div className={`hidden md:flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-center gap-4">
                            {activeTab === 'input' || activeTab === 'summary' ? (
                                <>
                                    <button onClick={() => navigateDate(-1)} className={`p-2 rounded-full transition ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}><ChevronLeft className="w-6 h-6" /></button>
                                    <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {activeTab === 'summary' ? `Week of ${formatOrdinalDate(getStartOfWeek(currentDate))}` : formatOrdinalDate(currentDate)}
                                    </h2>
                                    <button onClick={() => navigateDate(1)} className={`p-2 rounded-full transition ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}><ChevronRight className="w-6 h-6" /></button>
                                </>
                            ) : (
                                <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {activeTab === 'habits' ? 'Habit Trackers' : activeTab === 'journey' ? 'My Journeys' : activeTab === 'dashboard' ? 'Analytics Dashboard' : activeTab === 'settings' ? 'Routine Settings' : 'Reports'}
                                </h2>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {activeTab === 'input' && <DailyLog currentDate={currentDate} logs={logs} setLogs={setLogs} routines={routines} activeRoutineId={activeRoutineId} isDarkMode={isDarkMode} />}
                        {activeTab === 'summary' && <WeeklyReview logs={logs} currentDate={currentDate} routines={routines} activeRoutineId={activeRoutineId} isDarkMode={isDarkMode} />}
                        {activeTab === 'habits' && <Habits isDarkMode={isDarkMode} />}
                        {activeTab === 'journey' && <Journey isDarkMode={isDarkMode} />}
                        {activeTab === 'dashboard' && <Dashboard logs={logs} isDarkMode={isDarkMode} />}
                        {activeTab === 'settings' && <Routines routines={routines} setRoutines={setRoutines} activeRoutineId={activeRoutineId} setActiveRoutineId={setActiveRoutineId} isDarkMode={isDarkMode} saveRoutines={saveRoutines} handleDeleteRoutine={handleDeleteRoutine} />}
                        {activeTab === 'report' && <Reports logs={logs} routines={routines} activeRoutineId={activeRoutineId} isDarkMode={isDarkMode} />}
                    </div>
                </div>
            </div>
        </div>
    );
}