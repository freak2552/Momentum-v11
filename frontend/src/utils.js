export const API_BASE_URL = "http://localhost:5000/api";

export const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatOrdinalDate = (date) => {
    const d = date.getDate();
    const m = date.toLocaleString('default', { month: 'short' });
    const suffix = (day) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    };
    return `${d}${suffix(d)} of ${m}`;
};

export const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const newDate = new Date(d);
    newDate.setDate(diff);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
};

export const getColorClass = (percentage, threshold = 75, isDark) => {
    if (percentage >= threshold) return isDark ? 'text-emerald-400 bg-emerald-900/30 border-emerald-800' : 'text-emerald-700 bg-emerald-100 border-emerald-200';
    if (percentage >= 50) return isDark ? 'text-amber-400 bg-amber-900/30 border-amber-800' : 'text-amber-700 bg-amber-100 border-amber-200';
    return isDark ? 'text-rose-400 bg-rose-900/30 border-rose-800' : 'text-rose-700 bg-rose-100 border-rose-200';
};

export const getBarColor = (percentage, threshold = 75) => {
    if (percentage >= threshold) return 'bg-emerald-600';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
};

export const getGradient = (percentage, threshold = 75) => {
    if (percentage >= threshold) return 'from-emerald-600 to-teal-700';
    if (percentage >= 50) return 'from-amber-500 to-orange-600';
    return 'from-rose-500 to-red-600';
};

export function percentageToColor(p, threshold = 75, isDark) {
    if (p >= threshold) return isDark ? 'text-emerald-400' : 'text-emerald-600';
    if (p >= 50) return isDark ? 'text-amber-400' : 'text-amber-600';
    return isDark ? 'text-rose-400' : 'text-rose-600';
}

export const getReportCardStyle = (percentage, threshold = 75, isDark) => {
    if (isDark) {
        if (percentage >= threshold) return 'bg-emerald-900/20 border-emerald-800';
        if (percentage >= 50) return 'bg-amber-900/20 border-amber-800';
        return 'bg-rose-900/20 border-rose-800';
    }
    if (percentage >= threshold) return 'bg-emerald-100 border-emerald-300';
    if (percentage >= 50) return 'bg-amber-100 border-amber-300';
    return 'bg-rose-100 border-rose-300';
};

export const getTaskBoxStyle = (satisfaction, isEditing, isDark) => {
    if (isEditing) return isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm';
    if (satisfaction === 5) return isDark ? 'bg-emerald-900/50 border-emerald-700' : 'bg-emerald-100 border-emerald-300';
    if (satisfaction === 4) return isDark ? 'bg-lime-900/50 border-lime-700' : 'bg-lime-100 border-lime-300';
    if (satisfaction === 3) return isDark ? 'bg-yellow-900/50 border-yellow-700' : 'bg-yellow-100 border-yellow-300';
    if (satisfaction === 2) return isDark ? 'bg-orange-900/50 border-orange-700' : 'bg-orange-100 border-orange-300';
    if (satisfaction === 1) return isDark ? 'bg-red-900/50 border-red-700' : 'bg-red-100 border-red-300';
    return isDark ? 'bg-slate-800 border-slate-600' : 'bg-slate-200 border-slate-300';
};

export const getLeague = (percentage) => {
    if (percentage >= 95) return { name: 'LEGEND', color: 'text-fuchsia-500', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', gradient: 'from-fuchsia-500 to-purple-600', textLight: 'text-fuchsia-100' };
    if (percentage >= 90) return { name: 'DIAMOND', color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-200', gradient: 'from-cyan-400 to-blue-500', textLight: 'text-cyan-100' };
    if (percentage >= 85) return { name: 'GOLD', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', gradient: 'from-amber-400 to-yellow-500', textLight: 'text-amber-100' };
    if (percentage >= 75) return { name: 'SILVER', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', gradient: 'from-slate-400 to-gray-500', textLight: 'text-slate-100' };
    if (percentage >= 50) return { name: 'BRONZE', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', gradient: 'from-orange-500 to-red-600', textLight: 'text-orange-100' };
    return { name: 'FAIL', color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200', gradient: 'from-red-500 to-rose-700', textLight: 'text-rose-100' };
};