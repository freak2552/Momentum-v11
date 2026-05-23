import React, { useMemo } from 'react';
import { getStartOfWeek, formatDateKey, getLeague, formatOrdinalDate } from './utils';

export default function Reports({ logs, routines, activeRoutineId, isDarkMode }) {
    const activeDropThreshold = routines[activeRoutineId]?.dropThreshold || 75;

    const reports = useMemo(() => {
        const weeks = {};
        
        Object.values(logs).forEach(log => {
            const [y, m, d] = log.dateKey.split('-').map(Number);
            const date = new Date(y, m - 1, d);
            const startOfWeek = getStartOfWeek(date);
            const weekKey = formatDateKey(startOfWeek);

            if (!weeks[weekKey]) {
                weeks[weekKey] = {
                    weekStart: startOfWeek,
                    totalMinutes: 0,
                    totalTargetMinutes: 0, 
                    sumPercentage: 0,
                    daysLogged: 0,
                    satisfactionSum: 0,
                    satisfactionCount: 0
                };
            }

            const dayMinutes = log.tasks ? log.tasks.reduce((acc, t) => acc + (t.completed !== undefined ? t.completed : Math.round((t.progress / 100) * (t.weight || 10))), 0) : 0;
            const dayTargetMinutes = log.tasks ? log.tasks.reduce((acc, t) => acc + (t.weight || 10), 0) : 0;

            weeks[weekKey].totalMinutes += dayMinutes;
            weeks[weekKey].totalTargetMinutes += dayTargetMinutes;
            weeks[weekKey].sumPercentage += log.percentage;
            weeks[weekKey].daysLogged += 1;

            if (log.tasks) {
                log.tasks.forEach(t => {
                    if (t.satisfaction > 0) {
                        weeks[weekKey].satisfactionSum += t.satisfaction;
                        weeks[weekKey].satisfactionCount++;
                    }
                });
            }
        });

        return Object.entries(weeks)
            .map(([key, data]) => ({
                key, 
                weekStart: data.weekStart,
                totalHours: Math.round((data.totalMinutes / 60) * 10) / 10,
                totalTargetHours: Math.round((data.totalTargetMinutes / 60) * 10) / 10,
                weeklyScore: data.daysLogged > 0 ? Math.round(data.sumPercentage / data.daysLogged) : 0,
                avgRating: data.satisfactionCount > 0 ? (data.satisfactionSum / data.satisfactionCount).toFixed(1) : 0
            }))
            .sort((a, b) => new Date(b.key) - new Date(a.key));
    }, [logs, activeDropThreshold]);

    const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

    return (
        <div className="max-w-6xl p-6 mx-auto space-y-6 md:p-10">
            {reports.length === 0 && (
                <p className={`text-center py-10 text-sm ${textSecondary}`}>No reports yet. Start logging days!</p>
            )}
            
            {/* Grid ensures exactly 3 per row max, centered alignment */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 place-items-center">
                {reports.map(report => {
                    const league = getLeague(report.weeklyScore);
                    
                    // User's requested Neumorphic CSS for Dark Mode
                    const neumorphicDark = {
                        width: '190px',
                        height: '254px',
                        borderRadius: '30px',
                        background: '#212121',
                        boxShadow: '15px 15px 30px rgb(25, 25, 25), -15px -15px 30px rgb(60, 60, 60)'
                    };
                    
                    // Light mode equivalent to keep the 3D effect intact
                    const neumorphicLight = {
                        width: '190px',
                        height: '254px',
                        borderRadius: '30px',
                        background: '#e0e5ec',
                        boxShadow: '9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255, 0.5)'
                    };

                    const cardStyle = isDarkMode ? neumorphicDark : neumorphicLight;
                    
                    return (
                        <div 
                            key={report.key} 
                            style={cardStyle}
                            className={`p-5 flex flex-col justify-between transition-transform duration-300 hover:scale-[1.05] border-2 ${league.border}`}
                        >
                            {/* Top Row: League Badge & Date */}
                            <div className="flex flex-col items-center gap-2">
                                <div className={`px-3 py-1 rounded-full text-[9px] uppercase tracking-widest font-black shadow-sm ${league.color} ${league.bg} border ${league.border}`}>
                                    {league.name}
                                </div>
                                <h3 className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {formatOrdinalDate(report.weekStart)}
                                </h3>
                            </div>

                            {/* Middle Row: Massive Weekly Average */}
                            <div className="flex flex-col items-center justify-center flex-1 my-2">
                                <span className={`text-5xl font-black tracking-tighter drop-shadow-md ${league.color}`}>
                                    {report.weeklyScore}%
                                </span>
                            </div>

                            {/* Bottom Row: Hours & Average Rating */}
                            <div className="pt-3 space-y-2 border-t border-black/10 dark:border-white/10">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className={`text-[9px] uppercase font-bold opacity-60 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Hours</p>
                                        <p className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                            {report.totalHours} <span className="font-medium opacity-40">/ {report.totalTargetHours}</span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-[9px] uppercase font-bold opacity-60 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Avg Rating</p>
                                        <p className={`text-xs font-black ${league.color}`}>
                                            {report.avgRating > 0 ? `${report.avgRating} ★` : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}