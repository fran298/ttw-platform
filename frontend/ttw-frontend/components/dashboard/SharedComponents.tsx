
import React from 'react';
import { ArrowUpRight, ArrowDownRight, X } from 'lucide-react';

// --- STAT CARD ---
interface StatCardProps {
    title: string;
    value: string;
    trend?: number;
    subtext?: string;
    icon: any;
    colorClass: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, trend, subtext, icon: Icon, colorClass }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
                <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
            </div>
            {trend !== undefined && (
                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {Math.abs(trend)}%
                </span>
            )}
        </div>
        <div>
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
            <p className="text-3xl font-black text-gray-900 tracking-tight">{value}</p>
            {subtext && <p className="text-xs text-gray-400 mt-2 font-medium">{subtext}</p>}
        </div>
    </div>
);

// --- MODAL ---
interface ModalProps {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ title, children, onClose, maxWidth = "max-w-md" }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col`}>
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-900">{title}</h3>
                <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 overflow-y-auto">
                {children}
            </div>
        </div>
    </div>
);
