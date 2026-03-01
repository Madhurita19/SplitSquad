import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmModal';
import { formatCurrency, formatSignedCurrency } from '../../utils/currency';
import { QRCodeSVG } from 'qrcode.react';

const BalanceTab = ({ group, debts, onRefresh, currentUser }) => {
    const [settling, setSettling] = useState(null);
    const [settleAmount, setSettleAmount] = useState('');
    const [settleTarget, setSettleTarget] = useState(null); // debt being partially settled
    const [settlements, setSettlements] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const confirm = useConfirm();

    const openSettleForm = (debt) => {
        setSettleTarget(debt);
        setSettleAmount(debt.amount.toFixed(0));
    };

    const handleSettle = async () => {
        const debt = settleTarget;
        const amt = Number(settleAmount);
        if (!amt || amt <= 0 || amt > debt.amount) {
            toast.error(`Enter an amount between 1 and ${formatCurrency(debt.amount, false, group.baseCurrency)}`);
            return;
        }
        const isPartial = amt < debt.amount;
        const ok = await confirm({
            title: isPartial ? 'PARTIAL SETTLE?' : 'SETTLE UP?',
            message: `Pay ${formatCurrency(amt, false, group.baseCurrency)} ${isPartial ? `of ${formatCurrency(debt.amount, false, group.baseCurrency)} ` : ''}to ${debt.to.name}? This will be recorded in the settlement history.`,
            confirmText: isPartial ? 'PAY PARTIAL' : 'SETTLE FULL',
            variant: 'warning',
        });
        if (!ok) return;

        try {
            setSettling(debt);
            const payload = {
                groupId: group._id,
                paidTo: debt.to._id,
                amount: amt,
                note: isPartial ? `Partial settlement (${formatCurrency(amt, false, group.baseCurrency)} of ${formatCurrency(debt.amount, false, group.baseCurrency)})` : 'Settled up'
            };

            await api.post('/settlements', payload);
            toast.success(`Settled ${formatCurrency(amt, false, group.baseCurrency)} with ${debt.to.name}`);
            setSettleTarget(null);
            fetchSettlements();
        } catch (error) {
            toast.error('Failed to settle debt');
        } finally {
            setSettling(null);
        }
    };

    const fetchSettlements = async () => {
        try {
            setLoadingHistory(true);
            const { data } = await api.get(`/settlements/group/${group._id}`);
            setSettlements(data);
        } catch (error) {
            // silently fail — history is optional
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => { fetchSettlements(); }, [group._id]);

    const timeAgo = (d) => {
        const s = Math.floor((Date.now() - new Date(d)) / 1000);
        if (s < 60) return 'JUST NOW';
        if (s < 3600) return `${Math.floor(s / 60)}M AGO`;
        if (s < 86400) return `${Math.floor(s / 3600)}H AGO`;
        return `${Math.floor(s / 86400)}D AGO`;
    };

    const balances = debts.rawBalances || [];
    const myBalance = balances.find(b =>
        (b.user._id || b.user) === currentUser._id
    )?.amount || 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-2xl uppercase tracking-tighter text-black dark:text-white">BALANCES</h3>
            </div>

            {/* Summary Card */}
            <div className={`brutalist-border shadow-neo-4 p-6 text-center ${myBalance > 0 ? 'bg-neo-green text-black' : myBalance < 0 ? 'bg-neo-pink text-white' : 'bg-background-light text-black'}`}>
                <h4 className="font-mono text-sm uppercase font-bold mb-2">Net Balance</h4>
                <h1 className="font-display text-6xl font-black leading-none mb-2">
                    {formatSignedCurrency(myBalance, false, group.baseCurrency)}
                </h1>
                <p className="font-mono text-xs uppercase font-bold">
                    {myBalance > 0 ? 'YOU ARE OWED IN TOTAL' : myBalance < 0 ? 'YOU OWE IN TOTAL' : 'TOTALLY SETTLED.'}
                </p>
            </div>

            <div className="bg-electric-blue text-white brutalist-border shadow-neo-sm p-4 text-center">
                <p className="font-mono text-xs uppercase font-bold">
                    <strong>ALGO ACTIVE:</strong> Minimizing transaction count.
                </p>
            </div>

            {/* Pending Debts */}
            {debts.simplifiedDebts?.length === 0 ? (
                <div className="bg-white brutalist-border shadow-neo-8 p-8 text-center text-black">
                    <span className="material-symbols-outlined text-5xl text-black mx-auto mb-4 block text-center">check_circle</span>
                    <h4 className="font-display text-2xl uppercase mb-2">ALL SETTLED</h4>
                    <p className="font-mono text-xs font-bold uppercase">No pending debts in this squad.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {debts.simplifiedDebts.map((debt, idx) => (
                        <div key={idx} className="bg-white brutalist-border shadow-neo-sm p-4 flex flex-col gap-4">

                            <div className="flex items-center gap-4">
                                {/* From User */}
                                <div className="flex flex-col items-center">
                                    <div className={`size-12 border-2 border-black flex items-center justify-center font-display text-xl font-black ${debt.from._id === currentUser._id ? 'bg-neo-pink text-white' : 'bg-gray-200 text-black'}`}>
                                        {debt.from.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="font-mono text-[10px] uppercase font-bold mt-1 text-black">
                                        {debt.from._id === currentUser._id ? 'YOU' : debt.from.name}
                                    </span>
                                </div>

                                {/* Amount Label */}
                                <div className="flex flex-col items-center flex-1 px-4">
                                    <span className="font-display text-xl font-black text-black">{formatCurrency(debt.amount, false, group.baseCurrency)}</span>
                                    <div className="w-full relative flex items-center justify-center my-1 z-0">
                                        <div className="h-1 w-full bg-black z-0"></div>
                                        <span className="material-symbols-outlined text-base font-black text-black absolute right-[-4px] z-10 bg-white">arrow_forward</span>
                                    </div>
                                    <span className="font-mono text-[10px] font-bold text-black uppercase">OWES</span>
                                </div>

                                {/* To User */}
                                <div className="flex flex-col items-center flex-shrink-0">
                                    <div className={`size-12 border-2 border-black flex items-center justify-center font-display text-xl font-black ${debt.to._id === currentUser._id ? 'bg-neo-green text-black' : 'bg-gray-200 text-black'}`}>
                                        {debt.to.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="font-mono text-[10px] uppercase font-bold mt-1 text-black">
                                        {debt.to._id === currentUser._id ? 'YOU' : debt.to.name}
                                    </span>
                                </div>
                            </div>

                            {/* Action Area */}
                            {debt.from._id === currentUser._id && (
                                settleTarget === debt ? (
                                    <div className="border-2 border-black bg-background-light p-3 flex flex-col gap-3">
                                        {/* UPI QR Display if available */}
                                        {debt.to.upiId && (
                                            <div className="bg-white border-2 border-black p-4 flex flex-col items-center gap-2 shadow-neo-sm">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="material-symbols-outlined text-toxic-green font-black">qr_code_scanner</span>
                                                    <span className="font-display font-black uppercase text-xl text-black leading-none">PAY VIA UPI</span>
                                                </div>
                                                <div className="border-4 border-black p-2 bg-white">
                                                    <QRCodeSVG
                                                        value={`upi://pay?pa=${debt.to.upiId}&pn=${encodeURIComponent(debt.to.name)}&am=${settleAmount || debt.amount}&cu=INR`}
                                                        size={140}
                                                        level="M"
                                                        includeMargin={false}
                                                    />
                                                </div>
                                                <span className="font-mono text-xs font-bold text-black/70 bg-gray-100 px-2 py-0.5 border border-black">{debt.to.upiId}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-[10px] font-bold text-black/60 uppercase flex-shrink-0">AMOUNT:</span>
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-display font-black text-black">₹</span>
                                                <input
                                                    type="number"
                                                    value={settleAmount}
                                                    onChange={e => setSettleAmount(e.target.value)}
                                                    min="1"
                                                    max={debt.amount}
                                                    className="w-full h-10 border-2 border-black bg-white pl-8 pr-3 font-display text-lg font-black text-black focus:bg-neon-yellow focus:outline-none transition-colors"
                                                    autoFocus={!debt.to.upiId}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={handleSettle}
                                                disabled={settling === debt}
                                                className={`w-full ${debt.to.upiId ? 'bg-black text-white' : 'bg-toxic-green text-black'} border-2 border-black px-4 py-3 font-display uppercase font-bold shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                                            >
                                                <span className="material-symbols-outlined text-sm font-black">check_circle</span>
                                                {settling === debt ? 'SETTLING...' : (debt.to.upiId ? 'I HAVE PAID VIA UPI / CASH' : 'I HAVE PAID WITH CASH')}
                                            </button>
                                            <button
                                                onClick={() => setSettleTarget(null)}
                                                className="w-full bg-white border-2 border-black px-4 py-2 font-display uppercase font-bold text-black shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                                            >
                                                CANCEL
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => openSettleForm(debt)}
                                        className="w-full bg-toxic-green border-2 border-black px-6 py-3 font-display uppercase font-bold text-black shadow-neo-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                                    >
                                        SETTLE
                                    </button>
                                )
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Settlement History Section */}
            <div className="pt-2">
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full bg-black brutalist-border border-white py-3 px-4 flex items-center justify-between shadow-neo-4 hover:translate-y-0.5 hover:shadow-none active:translate-y-1 transition-all"
                >
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-toxic-green font-black">history</span>
                        <span className="font-display text-sm text-white uppercase">SETTLEMENT LOG</span>
                        {settlements.length > 0 && (
                            <span className="bg-toxic-green brutalist-border px-2 py-0.5 font-mono text-[10px] font-black text-black">{settlements.length}</span>
                        )}
                    </div>
                    <span className="material-symbols-outlined text-white font-black">
                        {showHistory ? 'expand_less' : 'expand_more'}
                    </span>
                </button>

                {showHistory && (
                    <div className="border-2 border-t-0 border-black bg-white">
                        {loadingHistory ? (
                            <div className="p-6 text-center">
                                <p className="font-mono font-bold text-black uppercase text-xs animate-pulse">LOADING HISTORY...</p>
                            </div>
                        ) : settlements.length === 0 ? (
                            <div className="p-6 text-center">
                                <span className="material-symbols-outlined text-3xl text-black/30 block mb-2">receipt_long</span>
                                <p className="font-mono font-bold text-black/40 uppercase text-xs">NO SETTLEMENTS YET</p>
                            </div>
                        ) : (
                            <div className="divide-y-2 divide-black">
                                {settlements.map((s, idx) => {
                                    const isPayer = s.paidBy?._id === currentUser._id;
                                    const isReceiver = s.paidTo?._id === currentUser._id;

                                    return (
                                        <div key={s._id || idx} className="p-4 flex items-center gap-3">
                                            {/* Icon */}
                                            <div className={`size-10 border-2 border-black flex items-center justify-center flex-shrink-0 ${isPayer ? 'bg-neo-pink' : isReceiver ? 'bg-neo-green' : 'bg-gray-100'}`}>
                                                <span className={`material-symbols-outlined text-lg font-black ${isPayer ? 'text-white' : 'text-black'}`}>
                                                    {isPayer ? 'call_made' : isReceiver ? 'call_received' : 'swap_horiz'}
                                                </span>
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-mono text-xs font-bold text-black uppercase leading-tight">
                                                    {isPayer ? 'YOU' : s.paidBy?.name || 'Unknown'} paid {isReceiver ? 'YOU' : s.paidTo?.name || 'Unknown'}
                                                </p>
                                                <p className="font-mono text-[10px] text-black/50 uppercase mt-0.5">
                                                    {timeAgo(s.settledAt || s.createdAt)}
                                                </p>
                                            </div>

                                            {/* Amount */}
                                            <div className={`${isPayer ? 'bg-neo-pink text-white' : isReceiver ? 'bg-neo-green text-black' : 'bg-black text-white'} brutalist-border px-2 py-1 font-display text-sm font-black flex-shrink-0`}>
                                                {isPayer ? '-' : isReceiver ? '+' : ''}{formatCurrency(s.amount || 0, false, group.baseCurrency)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BalanceTab;
