import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/currency';
import toast from 'react-hot-toast';

const AnalyticsTab = ({ groupId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get(`/groups/${groupId}/analytics`);
                setData(res.data);
            } catch (error) {
                toast.error('Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [groupId]);

    if (loading) return (
        <div className="bg-white brutalist-border shadow-neo-4 p-8 text-center">
            <p className="font-mono font-bold text-black uppercase">CRUNCHING NUMBERS...</p>
        </div>
    );
    if (!data) return null;

    const { categorySpending, memberPaid, memberShares } = data;

    const maxCategory = Math.max(...categorySpending.map(c => c.total), 1);
    const maxShare = Math.max(...memberShares.map(m => m.totalShare), 1);
    const maxPaid = Math.max(...memberPaid.map(m => m.totalPaid), 1);

    const barColors = ['bg-electric-blue', 'bg-hot-pink', 'bg-neon-yellow', 'bg-neo-green'];

    return (
        <div className="space-y-6">

            {/* Category Breakdown */}
            <div className="bg-white brutalist-border shadow-neo-4 p-5">
                <div className="flex items-center gap-3 mb-5 border-b-4 border-black pb-3">
                    <div className="bg-neon-yellow brutalist-border p-2">
                        <span className="material-symbols-outlined text-black font-black">pie_chart</span>
                    </div>
                    <h3 className="font-display text-xl uppercase tracking-tighter text-black">SPENDING BY CATEGORY</h3>
                </div>

                {categorySpending.length === 0 ? (
                    <p className="font-mono font-bold text-sm text-gray-400 uppercase text-center py-4">No expenses to analyze yet.</p>
                ) : (
                    <div className="space-y-4">
                        {categorySpending.map((cat, idx) => (
                            <div key={cat._id}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-display font-black text-sm uppercase text-black">{cat._id}</span>
                                        <span className="bg-black text-white px-2 py-0.5 font-mono text-[10px] font-bold">{cat.count} EXPENSES</span>
                                    </div>
                                    <span className="font-display font-black text-lg text-black bg-neon-yellow px-2 border-2 border-black">{formatCurrency(cat.total, true, group.baseCurrency)}</span>
                                </div>
                                {/* Neo-brutalist progress bar */}
                                <div className="w-full h-6 border-2 border-black bg-background-light">
                                    <div
                                        className={`h-full ${barColors[idx % 4]} border-r-2 border-black transition-all duration-700`}
                                        style={{ width: `${(cat.total / maxCategory) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Top Spenders */}
                <div className="bg-electric-blue brutalist-border shadow-neo-4 p-5">
                    <div className="flex items-center gap-3 mb-5 border-b-4 border-black pb-3">
                        <div className="bg-white brutalist-border p-2">
                            <span className="material-symbols-outlined text-black font-black">credit_card</span>
                        </div>
                        <h3 className="font-display text-lg uppercase tracking-tighter text-white">TOP SPENDERS</h3>
                    </div>
                    <div className="space-y-3">
                        {memberPaid.map((m, idx) => (
                            <div key={m._id} className={`flex items-center justify-between p-3 border-2 border-black ${idx === 0 ? 'bg-neon-yellow' : 'bg-white'} shadow-neo-4`}>
                                <div className="flex items-center gap-3">
                                    <div className="size-8 border-2 border-black flex items-center justify-center font-display text-xs font-black bg-white text-black flex-shrink-0">
                                        {m.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-mono font-bold text-sm text-black uppercase">{m.name}</span>
                                </div>
                                <span className="font-display font-black text-black bg-black text-white px-2 py-0.5 text-sm">{formatCurrency(m.totalPaid, true, group.baseCurrency)}</span>
                            </div>
                        ))}
                    </div>
                    <p className="font-mono text-[10px] font-bold text-white/70 uppercase mt-3 text-center">WHO PAID THE MOST</p>
                </div>

                {/* Top Consumers */}
                <div className="bg-hot-pink brutalist-border shadow-neo-4 p-5">
                    <div className="flex items-center gap-3 mb-5 border-b-4 border-black pb-3">
                        <div className="bg-white brutalist-border p-2">
                            <span className="material-symbols-outlined text-black font-black">trending_up</span>
                        </div>
                        <h3 className="font-display text-lg uppercase tracking-tighter text-white">TOP CONSUMERS</h3>
                    </div>
                    <div className="space-y-3">
                        {memberShares.map((m, idx) => (
                            <div key={m._id} className="bg-white border-2 border-black p-3 shadow-neo-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 border-2 border-black flex items-center justify-center font-display text-xs font-black bg-white text-black flex-shrink-0">
                                            {m.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-mono font-bold text-sm text-black uppercase">{m.name}</span>
                                    </div>
                                    <span className="font-display font-black text-black bg-black text-white px-2 py-0.5 text-sm">{formatCurrency(m.totalShare, true, group.baseCurrency)}</span>
                                </div>
                                {/* Brutalist bar */}
                                <div className="w-full h-4 border-2 border-black bg-background-light">
                                    <div
                                        className={`h-full ${barColors[idx % 4]} transition-all duration-700`}
                                        style={{ width: `${(m.totalShare / maxShare) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="font-mono text-[10px] font-bold text-white/70 uppercase mt-3 text-center">WHO CONSUMED THE MOST</p>
                </div>

            </div>

        </div>
    );
};

export default AnalyticsTab;
