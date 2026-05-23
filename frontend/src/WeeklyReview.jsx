import React, { useMemo } from 'react';
import { Award, Download, CheckCircle2, Activity, Calendar } from 'lucide-react';
import { getStartOfWeek, formatDateKey, getColorClass, getBarColor, percentageToColor } from './utils';
import WeeklyLeagueWidget from './WeeklyLeagueWidget';

export default function WeeklyReview({ logs, currentDate, routines, activeRoutineId, isDarkMode }) {
    const activeDropThreshold = routines[activeRoutineId]?.dropThreshold || 75;
    const weekStart = getStartOfWeek(currentDate);

    const weekDays = useMemo(() => {
        const days = [];
        const start = new Date(weekStart);
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    }, [weekStart]);

    const weeklyStats = useMemo(() => {
        let total = 0;
        let count = 0;
        const taskStats = {};

        weekDays.forEach(day => {
            const key = formatDateKey(day);
            if (logs[key]) {
                total += logs[key].percentage;
                count++;
                if (logs[key].tasks) {
                    logs[key].tasks.forEach(t => {
                        if (!taskStats[t.name]) taskStats[t.name] = { total: 0, count: 0, possible: 0 };
                        const weight = t.weight || 10;
                        let completed = t.completed;
                        if (completed === undefined) completed = Math.round((t.progress / 100) * weight);
                        taskStats[t.name].total += completed;
                        taskStats[t.name].possible += weight;
                        taskStats[t.name].count += 1;
                    });
                }
            }
        });

        return {
            average: count === 0 ? 0 : Math.round(total / count),
            completedDays: count,
            taskBreakdown: Object.entries(taskStats).map(([name, data]) => ({
                name,
                average: data.possible === 0 ? 0 : Math.round((data.total / data.possible) * 100),
                count: data.count
            })).sort((a, b) => b.average - a.average)
        };
    }, [weekDays, logs]);

    const handleDownloadWeek = () => {
        if (!weeklyStats) return;
        const content = `WEEKLY REPORT\n========================\nAverage Score: ${weeklyStats.average}%\nDays Logged: ${weeklyStats.completedDays}/7\n------------------------\nTask Performance:\n${weeklyStats.taskBreakdown.map(task => `${task.name}: ${task.average}%`).join("\n")}\n========================\nGenerated on: ${new Date().toLocaleString()}`;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const today = new Date().toISOString().split("T")[0];
        a.download = `momentum-report-${today}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const cardBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
    const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
    const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

    return (
        <div className="max-w-4xl p-6 mx-auto space-y-8 md:p-10">
            {/* Mobile Widget */}
            <div className="md:hidden">
                <WeeklyLeagueWidget logs={logs || {}} currentDate={currentDate} isDark={isDarkMode} />
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className={`p-4 rounded-2xl border ${weeklyStats?.average ? getColorClass(weeklyStats.average, activeDropThreshold, isDarkMode) : ''} flex flex-col justify-between h-32 md:col-span-2`}>
                    <div className="flex items-start justify-between">
                        <Award className="w-8 h-8 mb-auto opacity-50" />
                        <button onClick={handleDownloadWeek} className="p-2 transition rounded-full bg-white/20 hover:bg-white/40"><Download className="w-4 h-4" /></button>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase opacity-70">Weekly Score</p>
                        <p className="text-3xl font-bold">{weeklyStats?.average || 0}%</p>
                    </div>
                </div>

                <div className={`p-4 rounded-2xl border flex flex-col justify-between h-32 md:col-span-2 ${cardBg}`}>
                    <CheckCircle2 className={`w-8 h-8 mb-auto ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                    <div>
                        <p className={`text-xs uppercase font-bold ${textSecondary}`}>Days Logged</p>
                        <p className={`text-3xl font-bold ${textPrimary}`}>
                            {weeklyStats?.completedDays || 0}
                            <span className={`text-lg ${textSecondary}`}>/7</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {weeklyStats?.taskBreakdown?.length > 0 && (
                    <div>
                        <h3 className={`font-bold mb-4 flex items-center gap-2 uppercase tracking-wide text-sm ${textPrimary}`}>
                            <Activity className="w-4 h-4" /> Step Performance
                        </h3>
                        <div className="space-y-3">
                            {weeklyStats.taskBreakdown.map((stat, idx) => (
                                <div key={idx} className={`p-3 rounded-xl border flex items-center gap-3 ${cardBg}`}>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1 text-sm">
                                            <span className={`font-bold ${textPrimary}`}>{stat?.name || 'Task'}</span>
                                            <span className={`text-xs font-bold ${textSecondary}`}>{stat?.average || 0}% avg</span>
                                        </div>
                                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                            <div
                                                className={`h-full ${stat?.average ? getBarColor(stat.average, activeDropThreshold) : 'bg-slate-300'}`}
                                                style={{ width: `${stat?.average || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <h3 className={`font-bold mb-4 flex items-center gap-2 uppercase tracking-wide text-sm ${textPrimary}`}>
                        <Calendar className="w-4 h-4" /> History
                    </h3>
                    <div className="grid grid-cols-7 gap-2">
                        {(weekDays || []).map(day => {
                            const key = formatDateKey(day);
                            const hasLog = logs[key];
                            const val = hasLog ? logs[key].percentage : 0;
                            return (
                                <button key={key} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs border transition ${hasLog && getBarColor ? getBarColor(val, activeDropThreshold) + ' text-white' : (isDarkMode ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-200 text-slate-400 border-slate-300')}`}>
                                    <span className="font-bold">{day.getDate()}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}