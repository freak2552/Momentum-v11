import React, { useState, useEffect, useMemo } from 'react';
import { Flame, Star, Clock, Trophy, Target, Plus, Check, X } from 'lucide-react';
import { API_BASE_URL, getLeague, getStartOfWeek, formatDateKey } from './utils';

export default function Dashboard({ logs, isDarkMode }) {
    const [objectives, setObjectives] = useState([]);
    const [showSidebar, setShowSidebar] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newHardness, setNewHardness] = useState('medium');
    const [newExpiryDate, setNewExpiryDate] = useState('');

    useEffect(() => {
        fetch(`${API_BASE_URL}/objectives`)
            .then(res => res.json())
            .then(data => setObjectives(data))
            .catch(err => console.error(err));
    }, []);

    // --- Analytics Engine ---
    const stats = useMemo(() => {
        let bestDayPct = { date: null, val: -1 };
        let over90Count = 0;
        let highestMins = { date: null, val: -1 };
        let bestRating = { date: null, val: -1 };
        let weeks = {}; 

        Object.values(logs).forEach(log => {
            if (log.percentage > bestDayPct.val) bestDayPct = { date: log.dateKey, val: log.percentage };
            if (log.percentage >= 90) over90Count++;

            let totalMins = 0;
            let ratingSum = 0;
            let ratingCount = 0;
            
            if (log.tasks) {
                log.tasks.forEach(t => {
                    let comp = t.completed !== undefined ? t.completed : Math.round((t.progress / 100) * (t.weight || 10));
                    totalMins += comp;
                    if (t.satisfaction > 0) { ratingSum += t.satisfaction; ratingCount++; }
                });
            }
            if (totalMins > highestMins.val) highestMins = { date: log.dateKey, val: totalMins };
            
            let avgR = ratingCount > 0 ? (ratingSum / ratingCount) : 0;
            if (avgR > bestRating.val) bestRating = { date: log.dateKey, val: avgR };

            const [y, m, d] = log.dateKey.split('-').map(Number);
            const date = new Date(y, m - 1, d);
            const weekKey = formatDateKey(getStartOfWeek(date));
            if (!weeks[weekKey]) weeks[weekKey] = { sumPct: 0, count: 0, startDate: date };
            weeks[weekKey].sumPct += log.percentage;
            weeks[weekKey].count++;
        });

        let bestWeek = { date: null, val: -1, league: null };
        Object.entries(weeks).forEach(([k, w]) => {
            let avg = Math.round(w.sumPct / w.count);
            if (avg > bestWeek.val) {
                bestWeek = { date: k, val: avg, league: getLeague(avg) };
            }
        });

        return { bestDayPct, over90Count, highestMins, bestRating, bestWeek };
    }, [logs]);

    // --- Dynamic Status Evaluation ---
    const getObjectiveStatus = (obj) => {
        if (obj.completed) return 'completed';
        if (obj.expiryDate) {
            const expiry = new Date(obj.expiryDate);
            // Add 1 day limit padding and set to end of that day
            expiry.setDate(expiry.getDate() + 1);
            expiry.setHours(23, 59, 59, 999);
            
            if (new Date() > expiry) {
                return 'failed';
            }
        }
        return 'pending';
    };

    // --- Objective Handlers ---
    const handleAddObjective = async () => {
        if (!newTitle.trim()) return;
        try {
            const res = await fetch(`${API_BASE_URL}/objectives`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title: newTitle.trim(), 
                    hardness: newHardness,
                    expiryDate: newExpiryDate 
                })
            });
            const saved = await res.json();
            setObjectives([saved, ...objectives]); 
            
            // Reset state
            setNewTitle('');
            setNewExpiryDate('');
            setShowSidebar(false);
        } catch (e) { console.error(e); }
    };

    const handleComplete = async (id) => {
        if (!window.confirm("Mark this objective as completed?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/objectives/${id}/complete`, { method: 'PUT' });
            const updated = await res.json();
            setObjectives(objectives.map(o => o._id === id ? updated : o).sort((a, b) => a.completed - b.completed));
        } catch (e) { console.error(e); }
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const cardBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
    const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
    const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

    return (
        <div className="relative max-w-6xl p-6 mx-auto md:p-10">
            {/* Top Analytics Section */}
            <div className="mb-12 space-y-6">
                <h2 className={`text-2xl font-black uppercase tracking-tight ${textPrimary}`}>Personal Records</h2>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className={`p-6 rounded-3xl border shadow-sm ${cardBg} bg-gradient-to-br from-emerald-500/10 to-transparent`}>
                        <div className="flex items-center gap-3 mb-4 text-emerald-500"><Flame className="w-6 h-6" /> <span className="text-xs font-bold tracking-widest uppercase">Highest Daily %</span></div>
                        <p className="text-4xl font-black">{stats.bestDayPct.val > -1 ? `${stats.bestDayPct.val}%` : 'N/A'}</p>
                        <p className={`text-sm mt-1 font-medium ${textSecondary}`}>{formatDisplayDate(stats.bestDayPct.date)}</p>
                    </div>

                    <div className={`p-6 rounded-3xl border shadow-sm ${cardBg} bg-gradient-to-br from-blue-500/10 to-transparent`}>
                        <div className="flex items-center gap-3 mb-4 text-blue-500"><Target className="w-6 h-6" /> <span className="text-xs font-bold tracking-widest uppercase">90%+ Days</span></div>
                        <p className="text-4xl font-black">{stats.over90Count}</p>
                        <p className={`text-sm mt-1 font-medium ${textSecondary}`}>Total Elite Days</p>
                    </div>

                    <div className={`p-6 rounded-3xl border shadow-sm ${cardBg} bg-gradient-to-br from-purple-500/10 to-transparent`}>
                        <div className="flex items-center gap-3 mb-4 text-purple-500"><Clock className="w-6 h-6" /> <span className="text-xs font-bold tracking-widest uppercase">Most Hours Logged</span></div>
                        <p className="text-4xl font-black">
                            {stats.highestMins.val > -1 ? `${Math.floor(stats.highestMins.val / 60)}h ${stats.highestMins.val % 60}m` : 'N/A'}
                        </p>
                        <p className={`text-sm mt-1 font-medium ${textSecondary}`}>{formatDisplayDate(stats.highestMins.date)}</p>
                    </div>

                    <div className={`p-6 rounded-3xl border shadow-sm ${cardBg} md:col-span-2 lg:col-span-2 ${stats.bestWeek.league ? stats.bestWeek.league.bg : ''} ${isDarkMode ? 'bg-opacity-10 backdrop-blur-md' : ''}`}>
                        <div className={`flex items-center gap-3 mb-4 ${stats.bestWeek.league ? stats.bestWeek.league.color : textPrimary}`}><Trophy className="w-6 h-6" /> <span className="text-xs font-bold tracking-widest uppercase">Best Weekly League</span></div>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-4xl font-black">{stats.bestWeek.val > -1 ? `${stats.bestWeek.val}%` : 'N/A'}</p>
                                <p className={`text-sm mt-1 font-medium ${textSecondary}`}>Week of {formatDisplayDate(stats.bestWeek.date)}</p>
                            </div>
                            {stats.bestWeek.league && (
                                <span className={`px-4 py-1.5 rounded-full text-sm font-black border ${stats.bestWeek.league.color} ${stats.bestWeek.league.border}`}>
                                    {stats.bestWeek.league.name}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className={`p-6 rounded-3xl border shadow-sm ${cardBg} bg-gradient-to-br from-amber-500/10 to-transparent`}>
                        <div className="flex items-center gap-3 mb-4 text-amber-500"><Star className="w-6 h-6" /> <span className="text-xs font-bold tracking-widest uppercase">Highest Rated Day</span></div>
                        <p className="text-4xl font-black">{stats.bestRating.val > -1 ? `${stats.bestRating.val.toFixed(1)} ★` : 'N/A'}</p>
                        <p className={`text-sm mt-1 font-medium ${textSecondary}`}>{formatDisplayDate(stats.bestRating.date)}</p>
                    </div>
                </div>
            </div>

            <hr className={`my-12 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`} />

            {/* Bottom Objectives Section */}
            <div className="relative space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className={`text-2xl font-black uppercase tracking-tight ${textPrimary}`}>Achievements</h2>
                    <button 
                        onClick={() => setShowSidebar(true)} 
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white transition-transform transform rounded-xl bg-slate-900 hover:bg-slate-800 hover:scale-105 shadow-md"
                    >
                        <Plus className="w-4 h-4" /> Add Goal
                    </button>
                </div>

                <div className="space-y-3">
                    {objectives.length === 0 && <p className={`py-10 text-center text-sm ${textSecondary}`}>No future objectives set. Aim high and add one!</p>}
                    
                    {objectives.map(obj => {
                        const status = getObjectiveStatus(obj);
                        const isDone = status === 'completed';
                        const isFailed = status === 'failed';

                        const hardnessColors = {
                            easy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                            medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
                            hard: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        };

                        const statusColors = {
                            pending: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
                            completed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
                            failed: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        };

                        return (
                            <div key={obj._id} className={`flex items-center p-4 rounded-2xl border transition-all ${isDone || isFailed ? (isDarkMode ? 'bg-slate-800/50 border-slate-700 opacity-60' : 'bg-slate-100 border-slate-200 opacity-60') : cardBg}`}>
                                
                                {/* Status Checkbox */}
                                <button 
                                    disabled={isDone || isFailed}
                                    onClick={() => handleComplete(obj._id)}
                                    className={`flex-shrink-0 w-6 h-6 mr-4 rounded flex items-center justify-center border-2 transition-all ${
                                        isDone ? 'bg-blue-500 border-blue-500 text-white cursor-not-allowed' : 
                                        isFailed ? 'bg-rose-500 border-rose-500 text-white cursor-not-allowed' :
                                        isDarkMode ? 'border-slate-500 hover:border-blue-400' : 'border-slate-300 hover:border-blue-500'
                                    }`}
                                >
                                    {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                                    {isFailed && <X className="w-4 h-4 stroke-[3]" />}
                                </button>
                                
                                <div className="flex-1 min-w-0">
                                    <p className={`font-bold truncate ${textPrimary}`}>{obj.title}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {isDone && obj.completedAt && (
                                            <p className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary}`}>Accomplished {formatDisplayDate(obj.completedAt.split('T')[0])}</p>
                                        )}
                                        {!isDone && obj.expiryDate && (
                                            <p className={`text-[10px] font-bold uppercase tracking-wider ${isFailed ? 'text-rose-500' : textSecondary}`}>
                                                {isFailed ? `Failed on ${formatDisplayDate(obj.expiryDate)}` : `Expires: ${formatDisplayDate(obj.expiryDate)}`}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className="flex items-center flex-shrink-0 gap-2 ml-3">
                                    <div className={`px-2.5 py-1 text-[10px] uppercase tracking-widest font-black rounded border ${statusColors[status]}`}>
                                        {status}
                                    </div>
                                    <div className={`px-2.5 py-1 text-[10px] uppercase tracking-widest font-black rounded border ${hardnessColors[obj.hardness]}`}>
                                        {obj.hardness}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Side Panel for Creation */}
            <div className={`fixed inset-y-0 right-0 z-50 w-full md:w-[400px] shadow-2xl transform transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : 'translate-x-full'} ${isDarkMode ? 'bg-slate-900 border-l border-slate-800' : 'bg-white border-l border-slate-200'}`}>
                <div className="flex flex-col h-full p-8">
                    {/* Header with inline actions */}
                    <div className="flex items-center justify-between pb-4 mb-8 border-b border-slate-200 dark:border-slate-800">
                        <h3 className={`text-xl font-black uppercase tracking-tight ${textPrimary}`}>New Goal</h3>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleAddObjective} 
                                disabled={!newTitle.trim()} 
                                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-emerald-400 hover:bg-emerald-900/30' : 'text-emerald-600 hover:bg-emerald-50'} disabled:opacity-30 disabled:cursor-not-allowed`}
                            >
                                <Check className="w-6 h-6 stroke-[3]" />
                            </button>
                            <button 
                                onClick={() => setShowSidebar(false)} 
                                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 space-y-6">
                        <div>
                            <label className={`block mb-2 text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Objective Title</label>
                            <input 
                                autoFocus type="text" placeholder="e.g. Master React, Run 5k..." 
                                value={newTitle} onChange={e => setNewTitle(e.target.value)}
                                className={`w-full p-4 rounded-xl border outline-none font-bold text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                            />
                        </div>

                        <div>
                            <label className={`block mb-3 text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Difficulty</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['easy', 'medium', 'hard'].map(level => (
                                    <button 
                                        key={level} onClick={() => setNewHardness(level)}
                                        className={`py-3 rounded-xl border-2 text-xs font-black uppercase tracking-widest transition-all ${
                                            newHardness === level 
                                            ? (level === 'easy' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : level === 'medium' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-rose-500 bg-rose-500/10 text-rose-500')
                                            : (isDarkMode ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-400')
                                        }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className={`block mb-2 text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Expiry Date (Optional)</label>
                            <input 
                                type="date" 
                                value={newExpiryDate} 
                                onChange={e => setNewExpiryDate(e.target.value)}
                                className={`w-full p-4 rounded-xl border outline-none font-bold text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500 cursor-pointer' : 'bg-slate-50 border-slate-200 focus:border-blue-500 cursor-pointer'}`}
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            {showSidebar && (
                <div 
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                    onClick={() => setShowSidebar(false)}
                />
            )}
        </div>
    );
}