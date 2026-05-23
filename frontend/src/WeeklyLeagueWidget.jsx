import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { getStartOfWeek, formatDateKey, getLeague } from './utils';

export default function WeeklyLeagueWidget({ logs, currentDate, isDark }) {
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

    const stats = useMemo(() => {
        let total = 0;
        let count = 0;
        const dayStats = [];

        weekDays.forEach(day => {
            const key = formatDateKey(day);
            const log = logs[key];
            const pct = log ? log.percentage : 0;
            if (log) { total += pct; count++; }
            dayStats.push({
                dayName: day.toLocaleString('default', { weekday: 'narrow' }),
                pct: pct,
                hasLog: !!log,
                isToday: formatDateKey(day) === formatDateKey(new Date())
            });
        });
        const average = count === 0 ? 0 : Math.round(total / count);
        return { average, dayStats };
    }, [weekDays, logs]);

    const league = getLeague(stats.average);

    return (
        <div className={`rounded-2xl p-6 border shadow-sm flex flex-col relative overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`font-bold mb-4 flex items-center gap-2 z-10 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Trophy className={`w-5 h-5 ${league.color}`} /> Weekly League
            </h3>

            <div className={`relative w-full h-24 rounded-xl mb-6 flex items-center justify-center bg-gradient-to-br shadow-inner ${league.gradient}`}>
                <div className="z-10 text-center">
                    <span className={`block text-2xl font-black italic tracking-tighter ${league.textLight} drop-shadow-md`}>{league.name}</span>
                    <span className={`text-xs font-bold uppercase tracking-widest ${league.textLight} opacity-80`}>{stats.average}% AVG</span>
                </div>
                <div className="absolute inset-0 bg-white/10" style={{ backgroundImage: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.2) 100%)' }}></div>
            </div>

            <div className="flex items-end justify-between h-20 gap-1 px-1">
                {stats.dayStats.map((d, i) => (
                    <div key={i} className="flex flex-col items-center flex-1 gap-1">
                        <div className={`w-full rounded-t-sm transition-all duration-500 relative group ${d.hasLog ? '' : 'opacity-20'} ${d.isToday ? 'ring-1 ring-offset-1 ring-blue-500' : ''}`}
                            style={{ height: `${Math.max(10, d.pct)}%`, background: d.hasLog ? (isDark ? '#cbd5e1' : '#64748b') : (isDark ? '#334155' : '#e2e8f0') }}>
                            {d.hasLog && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-black text-white text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                    {d.pct}%
                                </div>
                            )}
                        </div>
                        <span className={`text-[9px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{d.dayName}</span>
                    </div>
                ))}
            </div>

            <div className="z-10 mt-4 text-center">
                <p className={`text-[10px] mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Keep avg &gt; 95% for Legend
                </p>
            </div>
        </div>
    );
}