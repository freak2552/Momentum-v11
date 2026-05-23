import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Layout, Save, X } from 'lucide-react';

export default function Routines({ routines, setRoutines, activeRoutineId, setActiveRoutineId, isDarkMode, saveRoutines, handleDeleteRoutine }) {
    // Mode States
    const [isEditing, setIsEditing] = useState(false);
    const [localRoutine, setLocalRoutine] = useState(null);

    // Task editing states
    const [editingTaskIndex, setEditingTaskIndex] = useState(null);
    const [editingTaskData, setEditingTaskData] = useState(null);

    // New task states
    const [newTaskName, setNewTaskName] = useState('');
    const [newTaskMinutes, setNewTaskMinutes] = useState(30);
    const [newTaskDays, setNewTaskDays] = useState([0, 1, 2, 3, 4, 5, 6]);

    // Automatically exit edit mode if active routine changes from outside
    useEffect(() => {
        if (activeRoutineId !== 'new') {
            setIsEditing(false);
            setLocalRoutine(null);
        }
    }, [activeRoutineId]);

    // Derived state for display
    const activeOrLocalRoutine = isEditing ? localRoutine : (routines[activeRoutineId] || { name: 'Unknown', theme: '', dropThreshold: 75, tasks: [] });

    // --- Mode Handlers ---
    const handleStartEdit = () => {
        // Deep copy the active routine into local state so we can safely edit it without saving immediately
        setLocalRoutine(JSON.parse(JSON.stringify(routines[activeRoutineId])));
        setIsEditing(true);
    };

    const handleCreateNew = () => {
        setActiveRoutineId('new');
        setLocalRoutine({ name: '', theme: '', dropThreshold: 75, tasks: [] });
        setIsEditing(true);
    };

    const handleSave = () => {
        if (!localRoutine.name.trim()) {
            alert("Please provide a name for this routine.");
            return;
        }

        if (activeRoutineId === 'new') {
            const newId = Date.now().toString();
            saveRoutines({ ...routines, [newId]: localRoutine }, newId);
        } else {
            saveRoutines({ ...routines, [activeRoutineId]: localRoutine });
        }
        
        setIsEditing(false);
        setLocalRoutine(null);
    };

    const handleCancel = () => {
        if (activeRoutineId === 'new') {
            // Revert back to the first available routine if we cancelled creating a new one
            setActiveRoutineId(Object.keys(routines)[0]);
        }
        setIsEditing(false);
        setLocalRoutine(null);
        setEditingTaskIndex(null);
        setEditingTaskData(null);
    };

    // --- Data Modifiers (Only update localRoutine during edit mode) ---
    const handleFieldChange = (field, value) => {
        setLocalRoutine(prev => ({ ...prev, [field]: value }));
    };

    const handleAddRoutineTask = () => {
        if (!newTaskName.trim()) return;
        const newTask = { name: newTaskName.trim(), weight: newTaskMinutes || 30, days: [...newTaskDays] };
        setLocalRoutine(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
        
        // Reset form
        setNewTaskName(''); 
        setNewTaskMinutes(30); 
        setNewTaskDays([0, 1, 2, 3, 4, 5, 6]);
    };

    const toggleNewTaskDay = (day) => setNewTaskDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    const toggleEditingTaskDay = (day) => setEditingTaskData(prev => ({
        ...prev, days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
    }));

    const startEditingTask = (index, task) => {
        setEditingTaskIndex(index);
        setEditingTaskData({
            name: typeof task === 'string' ? task : task.name,
            weight: typeof task === 'string' ? 10 : (task.weight || 10),
            days: typeof task === 'string' ? [0, 1, 2, 3, 4, 5, 6] : (task.days || [0, 1, 2, 3, 4, 5, 6])
        });
    };

    const saveEditedTask = () => {
        if (editingTaskData && editingTaskData.name.trim()) {
            const updatedTasks = [...localRoutine.tasks];
            updatedTasks[editingTaskIndex] = editingTaskData;
            setLocalRoutine(prev => ({ ...prev, tasks: updatedTasks }));
            setEditingTaskIndex(null); 
            setEditingTaskData(null);
        }
    };

    // --- Styling Constants ---
    const cardBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
    const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
    const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
    const inputBg = isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500';

    return (
        <div className="max-w-2xl p-6 mx-auto space-y-8 md:p-10">
            {/* --- Routine Settings Header --- */}
            <div className={`p-6 rounded-2xl shadow-sm border space-y-5 transition-colors ${cardBg} ${isEditing ? (isDarkMode ? 'ring-2 ring-blue-500/50' : 'ring-2 ring-blue-500/50') : ''}`}>
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold tracking-widest uppercase text-slate-500">
                        {isEditing ? (activeRoutineId === 'new' ? 'Creating New Version' : 'Editing Version') : 'Active Version'}
                    </label>
                    
                    {/* Top Right Action Buttons based on mode */}
                    {!isEditing ? (
                        <div className="flex gap-4">
                            <button onClick={handleCreateNew} className="flex items-center gap-1 text-xs font-black text-blue-600 transition-colors hover:text-blue-500"><Plus className="w-3 h-3 stroke-[3]" /> NEW</button>
                            <button onClick={handleStartEdit} className="flex items-center gap-1 text-xs font-black transition-colors text-emerald-600 hover:text-emerald-500"><Edit2 className="w-3 h-3 stroke-[3]" /> EDIT</button>
                            {Object.keys(routines).length > 1 && (
                                <button onClick={handleDeleteRoutine} className="text-xs font-black transition-colors text-rose-500 hover:text-rose-400">DELETE</button>
                            )}
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={handleSave} className="flex items-center gap-1 px-4 py-1.5 text-xs font-black tracking-wider text-white transition-colors bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700">
                                <Save className="w-3 h-3" /> SAVE
                            </button>
                            <button onClick={handleCancel} className={`flex items-center gap-1 px-4 py-1.5 text-xs font-black tracking-wider transition-colors rounded-lg ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                                <X className="w-3 h-3" /> CANCEL
                            </button>
                        </div>
                    )}
                </div>

                {/* Dropdown Selector (Only visible in View Mode) */}
                {!isEditing && (
                    <div className="relative">
                        <select 
                            value={activeRoutineId} 
                            onChange={(e) => setActiveRoutineId(e.target.value)} 
                            className={`w-full p-3 rounded-xl font-bold appearance-none border focus:outline-none focus:border-blue-500 cursor-pointer transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                        >
                            {Object.entries(routines).map(([id, r]) => (<option key={id} value={id}>{r.name}</option>))}
                        </select>
                        <Layout className="absolute right-3 top-3.5 w-5 h-5 text-slate-500 pointer-events-none" />
                    </div>
                )}

                {/* Fields */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${textSecondary}`}>Routine Name</label>
                        {isEditing ? (
                            <input 
                                autoFocus={activeRoutineId === 'new'} type="text" placeholder="e.g. Exam Grind"
                                value={localRoutine.name} onChange={(e) => handleFieldChange('name', e.target.value)} 
                                className={`w-full p-2.5 rounded-lg border outline-none font-bold text-sm ${inputBg}`} 
                            />
                        ) : (
                            <p className={`p-2 font-black text-lg ${textPrimary}`}>{activeOrLocalRoutine.name}</p>
                        )}
                    </div>
                    <div>
                        <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${textSecondary}`}>Theme / Focus</label>
                        {isEditing ? (
                            <input 
                                type="text" placeholder="e.g. Consistency" 
                                value={localRoutine.theme || ''} onChange={(e) => handleFieldChange('theme', e.target.value)} 
                                className={`w-full p-2.5 rounded-lg border outline-none font-bold text-sm ${inputBg}`} 
                            />
                        ) : (
                            <p className={`p-2 font-medium ${textPrimary}`}>{activeOrLocalRoutine.theme || '—'}</p>
                        )}
                    </div>
                </div>

                <div className="pt-2">
                    <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${textSecondary}`}>
                        Success Threshold: <span className={textPrimary}>{activeOrLocalRoutine.dropThreshold || 75}%</span>
                    </label>
                    {isEditing ? (
                        <input 
                            type="range" min="10" max="100" step="5" 
                            value={localRoutine.dropThreshold || 75} 
                            onChange={(e) => handleFieldChange('dropThreshold', parseInt(e.target.value))} 
                            className="w-full cursor-pointer accent-blue-500" 
                        />
                    ) : (
                        <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                            <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: `${activeOrLocalRoutine.dropThreshold || 75}%` }} />
                        </div>
                    )}
                </div>
            </div>

            {/* --- Add New Routine Task (Only in Edit Mode) --- */}
            {isEditing && (
                <div className={`p-6 rounded-2xl shadow-sm border space-y-4 ${cardBg}`}>
                    <h3 className={`text-sm font-black uppercase tracking-wider ${textSecondary}`}>Add Task</h3>
                    <div className="flex gap-3">
                        <input 
                            type="text" placeholder="Task name" 
                            value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} 
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddRoutineTask(); }} 
                            className={`flex-1 p-3 rounded-xl border outline-none font-bold text-sm ${inputBg}`} 
                        />
                        <input 
                            type="number" placeholder="Min" 
                            value={newTaskMinutes} onChange={(e) => setNewTaskMinutes(parseInt(e.target.value) || 30)} 
                            className={`w-20 p-3 rounded-xl border outline-none font-bold text-sm text-center ${inputBg}`} 
                        />
                    </div>
                    <div>
                        <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${textSecondary}`}>Active Days</label>
                        <div className="flex gap-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, day) => (
                                <button
                                    key={day} onClick={() => toggleNewTaskDay(day)}
                                    className={`w-9 h-9 rounded-full text-xs font-black border-2 transition-colors ${newTaskDays.includes(day) ? 'bg-slate-900 text-white border-slate-900' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400')}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleAddRoutineTask} disabled={!newTaskName.trim()} className="flex items-center gap-2 px-6 py-3 text-sm font-black tracking-widest text-white uppercase transition-colors bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Plus className="w-4 h-4 stroke-[3]" /> Add Task
                    </button>
                </div>
            )}

            {/* --- Task List --- */}
            <div className="space-y-3">
                <h3 className={`text-xs font-black uppercase tracking-wider px-1 ${textSecondary}`}>Tasks ({activeOrLocalRoutine.tasks.length})</h3>
                
                {activeOrLocalRoutine.tasks.length === 0 && (
                    <p className={`text-sm text-center py-8 ${textSecondary}`}>
                        {isEditing ? "No tasks yet. Add one above." : "This routine has no tasks. Click EDIT to add some."}
                    </p>
                )}

                {activeOrLocalRoutine.tasks.map((task, idx) => {
                    const isThisEditing = isEditing && editingTaskIndex === idx;
                    const taskName = typeof task === 'string' ? task : task.name;
                    const taskWeight = typeof task === 'string' ? 10 : (task.weight || 10);
                    const taskDays = typeof task === 'string' ? [0, 1, 2, 3, 4, 5, 6] : (task.days || [0, 1, 2, 3, 4, 5, 6]);

                    return (
                        <div key={idx} className={`p-4 rounded-xl border transition-colors ${isThisEditing ? (isDarkMode ? 'bg-slate-800 border-blue-500' : 'bg-blue-50/50 border-blue-400') : cardBg}`}>
                            {isThisEditing ? (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input 
                                            autoFocus type="text" 
                                            value={editingTaskData.name} onChange={(e) => setEditingTaskData(prev => ({ ...prev, name: e.target.value }))} 
                                            className={`flex-1 p-2 rounded-lg border outline-none font-bold text-sm ${inputBg}`} 
                                        />
                                        <input 
                                            type="number" 
                                            value={editingTaskData.weight} onChange={(e) => setEditingTaskData(prev => ({ ...prev, weight: parseInt(e.target.value) || 10 }))} 
                                            className={`w-20 p-2 rounded-lg border outline-none font-bold text-sm text-center ${inputBg}`} 
                                        />
                                    </div>
                                    <div className="flex gap-1.5">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, day) => (
                                            <button 
                                                key={day} onClick={() => toggleEditingTaskDay(day)} 
                                                className={`w-8 h-8 rounded-full text-[10px] font-black border-2 transition-colors ${editingTaskData.days.includes(day) ? 'bg-blue-600 text-white border-blue-600' : (isDarkMode ? 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400')}`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <button onClick={saveEditedTask} className="px-4 py-1.5 text-xs font-black tracking-wider text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">SAVE TASK</button>
                                        <button onClick={() => { setEditingTaskIndex(null); setEditingTaskData(null); }} className={`px-4 py-1.5 text-xs font-black tracking-wider rounded-lg transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>CANCEL</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <span className={`block font-bold truncate ${textPrimary}`}>{taskName}</span>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary}`}>{taskWeight} min</span>
                                            <div className="flex gap-0.5">
                                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, day) => (
                                                    <span 
                                                        key={day} 
                                                        className={`text-[9px] font-black px-1.5 py-0.5 rounded ${taskDays.includes(day) ? (isDarkMode ? 'bg-slate-600 text-slate-200' : 'bg-slate-200 text-slate-700') : (isDarkMode ? 'text-slate-700 opacity-30' : 'text-slate-300 opacity-50')}`}
                                                    >
                                                        {label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Action Buttons only appear in Edit Mode */}
                                    {isEditing && (
                                        <div className="flex items-center flex-shrink-0 gap-1 ml-3">
                                            <button onClick={() => startEditingTask(idx, task)} className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-500'}`}>
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => {
                                                const updated = localRoutine.tasks.filter((_, i) => i !== idx);
                                                setLocalRoutine(prev => ({ ...prev, tasks: updated }));
                                            }} className="p-2 transition-colors rounded-xl hover:bg-rose-100 text-rose-500">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
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