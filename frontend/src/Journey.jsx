import React, { useState, useEffect } from 'react';
import { Trash2, ChevronDown, ChevronUp, Map } from 'lucide-react';
import { API_BASE_URL } from './utils';

export default function Journey({ isDarkMode }) {
    const [journeys, setJourneys] = useState([]);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectDesc, setNewSubjectDesc] = useState('');
    const [entryInputs, setEntryInputs] = useState({});
    const [expandedJourneys, setExpandedJourneys] = useState({});

    // Fetch journeys on load
    useEffect(() => {
        fetch(`${API_BASE_URL}/journeys`)
            .then(res => res.json())
            .then(data => setJourneys(data))
            .catch(err => console.error(err));
    }, []);

    const toggleExpand = (id) => {
        setExpandedJourneys(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAddSubject = async () => {
        if (!newSubjectName.trim()) return;
        const data = { name: newSubjectName.trim(), description: newSubjectDesc.trim() };
        try {
            const res = await fetch(`${API_BASE_URL}/journeys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const saved = await res.json();
            setJourneys([...journeys, saved]);
            setNewSubjectName('');
            setNewSubjectDesc('');
        } catch (e) { console.error(e); }
    };

    const handleAddEntry = async (journeyId) => {
        const content = entryInputs[journeyId];
        if (!content || !content.trim()) return;

        const journey = journeys.find(j => j._id === journeyId);
        const newEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            content: content.trim()
        };

        const updatedEntries = [newEntry, ...(journey.entries || [])];

        try {
            const res = await fetch(`${API_BASE_URL}/journeys/${journeyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entries: updatedEntries })
            });
            const saved = await res.json();
            setJourneys(journeys.map(j => j._id === journeyId ? saved : j));
            setEntryInputs(prev => ({ ...prev, [journeyId]: '' }));
        } catch (e) { console.error(e); }
    };

    const handleDeleteSubject = async (id) => {
        if (!window.confirm("Delete this entire subject and all its logs?")) return;
        try {
            await fetch(`${API_BASE_URL}/journeys/${id}`, { method: 'DELETE' });
            setJourneys(journeys.filter(j => j._id !== id));
        } catch (e) { console.error(e); }
    };

    const cardBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
    const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
    const inputBg = isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500';

    return (
        <div className="max-w-4xl p-6 mx-auto space-y-8 md:p-10">
            {/* Add New Subject */}
            <div className={`p-6 rounded-2xl border shadow-sm ${cardBg}`}>
                <h3 className="flex items-center gap-2 mb-4 text-lg font-black">
                    <Map className="w-5 h-5 text-blue-500" /> Start a New Journey
                </h3>
                <div className="flex flex-col gap-4">
                    <input 
                        type="text" placeholder="Subject Name (e.g., React Learning, Fitness Journey)" 
                        value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} 
                        onKeyDown={e => { if (e.key === 'Enter') handleAddSubject(); }} 
                        className={`w-full p-3 rounded-xl border outline-none ${inputBg}`} 
                    />
                    <input 
                        type="text" placeholder="Description (optional)" 
                        value={newSubjectDesc} onChange={e => setNewSubjectDesc(e.target.value)} 
                        className={`w-full p-3 rounded-xl border outline-none ${inputBg}`} 
                    />
                    <button onClick={handleAddSubject} className="self-end px-6 py-3 font-bold text-white transition-colors bg-blue-600 rounded-xl hover:bg-blue-700">
                        Create Subject
                    </button>
                </div>
            </div>

            {/* List of Subjects */}
            <div className="space-y-6">
                {journeys.length === 0 && (
                    <p className={`text-center py-10 text-sm ${textSecondary}`}>No journeys started yet.</p>
                )}

                {journeys.map(journey => {
                    const isExpanded = expandedJourneys[journey._id];

                    return (
                        <div key={journey._id} className={`p-6 rounded-2xl border shadow-sm transition-all ${cardBg}`}>
                            {/* Header (Click to Expand) */}
                            <div className="flex items-center justify-between cursor-pointer group" onClick={() => toggleExpand(journey._id)}>
                                <div className="flex items-start gap-3">
                                    <div className="mt-1.5 text-slate-400 group-hover:text-blue-500 transition-colors">
                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black select-none">{journey.name}</h3>
                                        {journey.description && <p className={`text-sm mt-0.5 select-none ${textSecondary}`}>{journey.description}</p>}
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteSubject(journey._id); }} 
                                    className="p-2 transition-colors rounded-full hover:bg-rose-50 group-hover:opacity-100 opacity-50"
                                >
                                    <Trash2 className="w-4 h-4 text-rose-500" />
                                </button>
                            </div>

                            {/* Collapsible Content */}
                            {isExpanded && (
                                <div className="pt-6 mt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                                    {/* Add Log Input */}
                                    <div className="flex gap-2 mb-6">
                                        <input
                                            type="text"
                                            placeholder="Log a new update or information..."
                                            className={`flex-1 p-3 rounded-lg border outline-none text-sm ${inputBg}`}
                                            value={entryInputs[journey._id] || ''}
                                            onChange={e => setEntryInputs(prev => ({ ...prev, [journey._id]: e.target.value }))}
                                            onKeyDown={e => { if (e.key === 'Enter') handleAddEntry(journey._id); }}
                                        />
                                        <button onClick={() => handleAddEntry(journey._id)} className="px-5 py-2 text-sm font-bold text-white transition-colors bg-slate-900 rounded-lg hover:bg-slate-800">
                                            Log
                                        </button>
                                    </div>

                                    {/* Entries List */}
                                    {(journey.entries || []).length === 0 ? (
                                        <p className={`text-sm text-center py-4 ${textSecondary}`}>No logs yet. Record your first update above.</p>
                                    ) : (
                                        <div className="relative pl-6 space-y-6 border-l-2" style={{ borderColor: isDarkMode ? '#334155' : '#e2e8f0' }}>
                                            {journey.entries.map((entry) => (
                                                <div key={entry.id} className="relative">
                                                    <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-800"></div>
                                                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${textSecondary}`}>
                                                        {new Date(entry.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </p>
                                                    <p className="text-sm leading-relaxed">{entry.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}