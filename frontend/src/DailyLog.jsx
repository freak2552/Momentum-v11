import React, { useState, useEffect, useMemo } from 'react';
import { Save, Plus, Trash2, Edit2, Star } from 'lucide-react';
import { API_BASE_URL, formatDateKey, getTaskBoxStyle, getBarColor } from './utils';

const StarRating = ({ rating, onChange, readOnly }) => {
    const stars = [1, 2, 3, 4, 5];
    const colors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-lime-500', 'text-emerald-500'];
    return (
        <div className="flex gap-1">
            {stars.map((star) => (
                <button
                    key={star}
                    disabled={readOnly}
                    onClick={() => !readOnly && onChange(star)}
                    className={`transition-transform active:scale-125 focus:outline-none ${readOnly ? 'cursor-default' : 'hover:scale-110'}`}
                >
                    <Star className={`w-5 h-5 ${rating >= star ? colors[rating - 1] || 'text-yellow-400' : 'text-slate-300'} ${rating >= star ? 'fill-current' : ''}`} />
                </button>
            ))}
        </div>
    );
};

export default function DailyLog({ currentDate, logs, setLogs, routines, activeRoutineId, isDarkMode }) {
    const [currentTasks, setCurrentTasks] = useState([]);
    const [dailyNote, setDailyNote] = useState('');
    const [isEditing, setIsEditing] = useState(true);
    const [dailyExtraName, setDailyExtraName] = useState('');
    const [dailyExtraMinutes, setDailyExtraMinutes] = useState(30);
    const [showDailyAdder, setShowDailyAdder] = useState(false);

    useEffect(() => {
        const dateKey = formatDateKey(currentDate);
        const existingLog = logs[dateKey];

        if (existingLog) {
            const loadedTasks = existingLog.tasks || [];
            const migratedTasks = loadedTasks.map(t => ({
                ...t,
                completed: t.completed !== undefined ? t.completed : Math.round((t.progress / 100) * (t.weight || 10)),
                satisfaction: t.satisfaction || 0
            }));
            setCurrentTasks(migratedTasks);
            setDailyNote(existingLog.note || '');
            setIsEditing(false);
        } else {
            const activeRoutine = routines[activeRoutineId] || routines['default'];
            const rawTasks = activeRoutine ? activeRoutine.tasks : [];
            const currentDayOfWeek = currentDate.getDay();

            const todaysTasks = rawTasks
                .filter(t => {
                    if (typeof t === 'string') return true;
                    return t.days && t.days.includes(currentDayOfWeek);
                })
                .map(t => {
                    if (typeof t === 'string') return { name: t, completed: 0, weight: 10, satisfaction: 0 };
                    return { name: t.name, completed: 0, weight: t.weight || 10, satisfaction: 0 };
                });

            setCurrentTasks(todaysTasks);
            setDailyNote('');
            setIsEditing(true);
        }
        setShowDailyAdder(false);
    }, [currentDate, logs, routines, activeRoutineId]);

    const handleSaveDay = async () => {
        const dateKey = formatDateKey(currentDate);
        let totalPossibleScore = 0;
        let totalEarnedScore = 0;

        currentTasks.forEach(t => {
            const weight = t.weight || 10;
            const completed = Math.min(t.completed || 0, weight);
            totalPossibleScore += weight;
            totalEarnedScore += completed;
        });

        const dailyAverage = totalPossibleScore === 0 ? 0 : Math.round((totalEarnedScore / totalPossibleScore) * 100);
        const tasksWithProgress = currentTasks.map(t => ({
            ...t,
            progress: Math.round(((t.completed || 0) / (t.weight || 10)) * 100)
        }));

        const activeRoutine = routines[activeRoutineId] || { theme: '' };
        const newLog = {
            dateKey,
            percentage: dailyAverage,
            tasks: tasksWithProgress,
            note: dailyNote,
            theme: activeRoutine.theme || '',
            timestamp: new Date().toISOString()
        };

        try {
            const res = await fetch(`${API_BASE_URL}/logs/${dateKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLog)
            });
            const savedLog = await res.json();
            setLogs(prev => ({ ...prev, [dateKey]: savedLog }));
            setIsEditing(false);
        } catch (e) { console.error(e); }
    };

    const handleClearDay = async () => {
        const dateKey = formatDateKey(currentDate);
        if (window.confirm(`Are you sure you want to delete all data for today?`)) {
            try {
                await fetch(`${API_BASE_URL}/logs/${dateKey}`, { method: 'DELETE' });
                const newLogs = { ...logs };
                delete newLogs[dateKey];
                setLogs(newLogs);
            } catch (e) { console.error(e); }
        }
    };

    const handleUpdateTaskCompleted = (index, mins) => {
        const updated = [...currentTasks];
        updated[index].completed = isNaN(mins) ? 0 : mins;
        setCurrentTasks(updated);
    };

    const handleUpdateTaskSatisfaction = (index, value) => {
        const updated = [...currentTasks];
        updated[index].satisfaction = value;
        setCurrentTasks(updated);
    };

    const handleDeleteDailyTask = (index) => {
        setCurrentTasks(currentTasks.filter((_, i) => i !== index));
    };

    const handleAddDailyTask = () => {
        if (dailyExtraName.trim()) {
            setCurrentTasks([...currentTasks, { name: dailyExtraName.trim(), completed: 0, weight: dailyExtraMinutes || 10, satisfaction: 0 }]);
            setDailyExtraName('');
            setDailyExtraMinutes(30);
            setShowDailyAdder(false);
        }
    };

    const currentDayStats = useMemo(() => {
        if (currentTasks.length === 0) return { total: 0, done: 0, pct: 0 };
        const total = currentTasks.reduce((acc, t) => acc + (t.weight || 10), 0);
        const done = currentTasks.reduce((acc, t) => acc + (t.completed || 0), 0);
        const pct = total > 0 ? (done / total) * 100 : 0;
        return { total, done, pct };
    }, [currentTasks]);

    const activeDropThreshold = routines[activeRoutineId]?.dropThreshold || 75;
    const cardBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
    const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
    const inputBg = isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900';

    return (
        <div className="max-w-2xl p-6 mx-auto space-y-6 md:p-10">
            {/* Progress Bar */}
            <div className={`p-5 rounded-2xl shadow-sm border ${cardBg}`}>
                <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl font-black">{Math.round(currentDayStats.pct)}%</span>
                    <span className={`text-sm font-bold tracking-wide ${textSecondary}`}>
                        {Math.floor(currentDayStats.done / 60)}h {Math.round(currentDayStats.done % 60)}m / {Math.floor(currentDayStats.total / 60)}h {Math.round(currentDayStats.total % 60)}m
                    </span>
                </div>
                <div className={`w-full h-4 overflow-hidden rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <div className={`h-full transition-all duration-300 ${getBarColor(currentDayStats.pct, activeDropThreshold)}`} style={{ width: `${currentDayStats.pct}%` }}></div>
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-3">
                {currentTasks.length === 0 && (
                    <div className={`text-center py-10 text-sm ${textSecondary}`}>
                        No tasks for today. Add one below or set up a routine in Routines tab.
                    </div>
                )}
                {currentTasks.map((task, index) => (
                    <div key={index} className={`p-4 rounded-xl border transition-colors ${getTaskBoxStyle(task.satisfaction, isEditing, isDarkMode)}`}>
                        <div className="flex items-start justify-between mb-3">
                            <span className="flex-1 mr-2 font-bold">{task.name}</span>
                            <div className="flex items-center flex-shrink-0 gap-2">
                                <span className={`text-xs font-mono font-bold ${textSecondary}`}>{task.completed || 0}/{task.weight || 10}</span>
                                {isEditing && (
                                    <button onClick={() => handleDeleteDailyTask(index)} className="text-rose-400 hover:text-rose-600">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <input
                            type="range" min="0" max={task.weight || 10} value={task.completed || 0}
                            disabled={!isEditing} onChange={(e) => handleUpdateTaskCompleted(index, parseInt(e.target.value))}
                            className="w-full"
                        />
                        <div className="mt-3">
                            <StarRating rating={task.satisfaction || 0} onChange={(val) => handleUpdateTaskSatisfaction(index, val)} readOnly={!isEditing} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Daily Task */}
            {isEditing && (
                <div>
                    {showDailyAdder ? (
                        <div className={`p-4 rounded-xl border space-y-3 ${cardBg}`}>
                            <div className="flex gap-2">
                                <input
                                    autoFocus type="text" placeholder="Task name" value={dailyExtraName}
                                    onChange={(e) => setDailyExtraName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddDailyTask(); }}
                                    className={`flex-1 p-2 rounded-lg border text-sm ${inputBg}`}
                                />
                                <input
                                    type="number" placeholder="Min" value={dailyExtraMinutes}
                                    onChange={(e) => setDailyExtraMinutes(parseInt(e.target.value) || 30)}
                                    className={`w-20 p-2 rounded-lg border text-sm text-center ${inputBg}`}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleAddDailyTask} className="px-4 py-2 text-sm font-bold text-white rounded-lg bg-slate-900">Add</button>
                                <button onClick={() => { setShowDailyAdder(false); setDailyExtraName(''); }} className={`px-4 py-2 text-sm font-bold rounded-lg ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowDailyAdder(true)}
                            className={`w-full py-3 rounded-xl border-2 border-dashed font-bold text-sm flex items-center justify-center gap-2 transition-colors ${isDarkMode ? 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300' : 'border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600'}`}
                        >
                            <Plus className="w-4 h-4" /> Add Task
                        </button>
                    )}
                </div>
            )}

            {/* Daily Note */}
            {isEditing && (
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSecondary}`}>Daily Note</label>
                    <textarea
                        value={dailyNote} onChange={(e) => setDailyNote(e.target.value)}
                        placeholder="Reflections, wins, blockers..." rows={3}
                        className={`w-full p-3 rounded-xl border resize-none text-sm ${inputBg}`}
                    />
                </div>
            )}

            {!isEditing && dailyNote && (
                <div className={`p-4 rounded-xl border ${cardBg}`}>
                    <p className={`text-xs font-bold uppercase mb-1 ${textSecondary}`}>Note</p>
                    <p className="text-sm">{dailyNote}</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                {isEditing ? (
                    <button onClick={handleSaveDay} className="flex items-center justify-center flex-1 gap-2 py-4 font-bold text-white transition-colors bg-slate-900 rounded-xl hover:bg-slate-700">
                        <Save className="w-4 h-4" /> Save Day
                    </button>
                ) : (
                    <>
                        <button onClick={() => setIsEditing(true)} className={`flex-1 py-4 font-bold border rounded-xl transition-colors flex items-center justify-center gap-2 ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                            <Edit2 className="w-4 h-4" /> Edit Day
                        </button>
                        <button onClick={handleClearDay} className="px-5 py-4 font-bold transition-colors border text-rose-500 border-rose-200 rounded-xl hover:bg-rose-50">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}