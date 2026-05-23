import React, { useState, useEffect } from 'react';
import { Trash2, Filter } from 'lucide-react';
import { API_BASE_URL } from './utils';

export default function Habits({ isDarkMode }) {
    const [habitTrackers, setHabitTrackers] = useState([]);
    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitMonth, setNewHabitMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedHabitFilterMonth, setSelectedHabitFilterMonth] = useState(new Date().toISOString().slice(0, 7));

    useEffect(() => {
        fetch(`${API_BASE_URL}/habits`)
            .then(res => res.json())
            .then(data => setHabitTrackers(data))
            .catch(err => console.error(err));
    }, []);

    const handleAddHabit = async () => {
        if (!newHabitName.trim()) return;

        // Extract year and month to calculate exactly how many days are in that specific month
        const [year, month] = newHabitMonth.split('-').map(Number);
        
        // In JS Date, day 0 gets the last day of the previous month.
        // Because JS months are 0-indexed, passing our 1-indexed 'month' points to the NEXT month.
        // Thus, day 0 gives us the exact last day of our TARGET month!
        const daysInMonth = new Date(year, month, 0).getDate();

        const data = {
            name: newHabitName,
            monthKey: newHabitMonth,
            grid: Array(daysInMonth).fill('empty'), // Now dynamically sized!
            createdAt: new Date().toISOString()
        };
        
        try {
            const res = await fetch(`${API_BASE_URL}/habits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const saved = await res.json();
            setHabitTrackers([...habitTrackers, saved]);
            setNewHabitName('');
        } catch (e) { console.error(e); }
    };

    const handleHabitClick = async (habit, index) => {
        // Updated color cycle with light blue and black
        const colors = ['empty', 'green', 'yellow', 'red', 'blue', 'black'];
        const currentIndex = colors.indexOf(habit.grid[index]);
        const nextColor = colors[(currentIndex + 1) % colors.length];
        
        const newGrid = [...habit.grid];
        newGrid[index] = nextColor;

        try {
            const res = await fetch(`${API_BASE_URL}/habits/${habit._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grid: newGrid })
            });
            const saved = await res.json();
            setHabitTrackers(habitTrackers.map(h => h._id === habit._id ? saved : h));
        } catch (e) { console.error(e); }
    };

    const handleDeleteHabit = async (id) => {
        if (!window.confirm("Delete this tracker?")) return;
        try {
            await fetch(`${API_BASE_URL}/habits/${id}`, { method: 'DELETE' });
            setHabitTrackers(habitTrackers.filter(h => h._id !== id));
        } catch (e) { console.error(e); }
    };

    const filteredHabits = habitTrackers.filter(h => {
        if (!selectedHabitFilterMonth) return true;
        return h.monthKey ? h.monthKey === selectedHabitFilterMonth : true;
    });

    const cardBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
    const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
    const inputBg = isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900';

    return (
        <div className="max-w-4xl p-6 mx-auto space-y-8 md:p-10">
            <div className={`p-6 rounded-2xl border shadow-sm ${cardBg}`}>
                <div className="flex flex-col gap-4 md:flex-row">
                    <input type="text" placeholder="New Habit Name" value={newHabitName} onChange={e => setNewHabitName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddHabit(); }} className={`flex-1 p-3 rounded-xl border ${inputBg}`} />
                    <input type="month" value={newHabitMonth} onChange={e => setNewHabitMonth(e.target.value)} className={`p-3 rounded-xl border ${inputBg}`} />
                    <button onClick={handleAddHabit} className="px-6 py-3 font-bold text-white transition-colors bg-slate-900 rounded-xl hover:bg-slate-700">Create</button>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Filter className={`w-4 h-4 ${textSecondary}`} />
                <input type="month" value={selectedHabitFilterMonth} onChange={e => setSelectedHabitFilterMonth(e.target.value)} className={`p-2 rounded-lg border text-sm ${inputBg}`} />
                <button onClick={() => setSelectedHabitFilterMonth('')} className={`text-xs font-bold ${textSecondary} hover:underline`}>Show All</button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {filteredHabits.length === 0 && (
                    <p className={`text-center py-10 text-sm col-span-2 ${textSecondary}`}>No habits found. Create one above.</p>
                )}
                {filteredHabits.map(habit => {
                    const greenCount = habit.grid.filter(s => s === 'green').length;
                    const totalFilled = habit.grid.filter(s => s !== 'empty').length;
                    return (
                        <div key={habit._id} className={`p-6 rounded-2xl border shadow-sm ${cardBg}`}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold">{habit.name}</h3>
                                <button onClick={() => handleDeleteHabit(habit._id)} className="transition-colors text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            {habit.monthKey && (
                                <p className={`text-xs mb-3 ${textSecondary}`}>{habit.monthKey} · {greenCount} green / {totalFilled} logged</p>
                            )}
                            <div className="grid grid-cols-7 gap-1.5">
                                {habit.grid.map((status, idx) => (
                                    <button
                                        key={idx} onClick={() => handleHabitClick(habit, idx)}
                                        className={`aspect-square rounded-md border text-[9px] font-bold transition-colors ${
                                            status === 'green' ? 'bg-emerald-500 border-emerald-600 text-white' :
                                            status === 'yellow' ? 'bg-amber-400 border-amber-500 text-white' :
                                            status === 'red' ? 'bg-rose-500 border-rose-600 text-white' :
                                            status === 'blue' ? 'bg-sky-400 border-sky-500 text-white' :
                                            status === 'black' ? 'bg-slate-900 border-black text-white shadow-inner' :
                                            isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'
                                        }`}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}