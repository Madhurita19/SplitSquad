import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmModal';
import { formatCurrency } from '../../utils/currency';

const ExpenseTab = ({ group, expenses, onRefresh, currentUser }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [saving, setSaving] = useState(false);
    const confirm = useConfirm();

    // State for new expense
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('other');
    const [splitType, setSplitType] = useState('equal');
    const [paidBy, setPaidBy] = useState(currentUser._id);
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
    const [expenseNote, setExpenseNote] = useState('');
    const [receiptFile, setReceiptFile] = useState(null);
    const [recurrenceInterval, setRecurrenceInterval] = useState('none');

    // Multi-currency
    const [currency, setCurrency] = useState(group.baseCurrency || 'INR');
    const [exchangeRate, setExchangeRate] = useState(1);
    const [fetchingRate, setFetchingRate] = useState(false);

    useEffect(() => {
        const fetchRate = async () => {
            const base = group.baseCurrency || 'INR';
            if (currency === base) {
                setExchangeRate(1);
                return;
            }
            setFetchingRate(true);
            try {
                const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${currency}`);
                const data = await res.json();
                if (data && data.rates && data.rates[base]) {
                    setExchangeRate(data.rates[base]);
                }
            } catch (error) {
                toast.error('Failed to fetch exchange rate');
                setExchangeRate(1);
            } finally {
                setFetchingRate(false);
            }
        };
        fetchRate();
    }, [currency, group.baseCurrency]);

    // Dynamic splits
    const [splitsInput, setSplitsInput] = useState(
        group.members.map(m => ({ user: m._id, amount: '', percent: '', share: '1', included: true }))
    );

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!amount || amount <= 0) return toast.error('Enter a valid amount');
        if (!description) return toast.error('Enter a description');

        try {
            const payload = {
                groupId: group._id,
                description,
                amount: Number(amount),
                category,
                splitType,
                paidBy,
                splitsInput: splitType === 'equal' ? group.members.map(m => m._id) : splitsInput
            };

            await api.post('/expenses', payload);
            toast.success('Expense added successfully');
            setShowAddModal(false);
            setDescription('');
            setAmount('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add expense');
        }
    };

    const handleDelete = async (id) => {
        const ok = await confirm({ title: 'DELETE EXPENSE?', message: 'This expense and its splits will be permanently removed from this squad.', confirmText: 'DELETE', variant: 'danger' });
        if (!ok) return;
        try {
            await api.delete(`/expenses/${id}`);
            toast.success('Expense deleted');
        } catch (error) {
            toast.error('Failed to delete expense');
        }
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setDescription(expense.description);
        setAmount(expense.amount);
        setCategory(expense.category);
        setSplitType(expense.splitType);
        setPaidBy(expense.paidBy._id || expense.paidBy);
        setExpenseDate(expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        setExpenseNote(expense.note || '');
        setReceiptFile(null); // Reset file input when editing
        setRecurrenceInterval(expense.recurrence?.interval || 'none');
        setCurrency(expense.originalCurrency || group.baseCurrency || 'INR');
        if (expense.splitType === 'equal') {
            setSplitsInput(group.members.map(m => ({ user: m._id, amount: '', percent: '', share: '1', included: expense.splits.some(s => (s.user._id || s.user) === m._id) })));
        } else {
            setSplitsInput(expense.splits.map(s => ({
                user: s.user._id || s.user,
                amount: s.amount?.toString() || '',
                percent: '',
                share: '1'
            })));
        }
        setShowAddModal(true);
    };

    const handleSaveExpense = async (e) => {
        e.preventDefault();
        if (!amount || amount <= 0) return toast.error('Enter a valid amount');
        if (!description) return toast.error('Enter a description');
        setSaving(true);

        try {
            const splitData = splitType === 'equal'
                ? splitsInput.filter(s => s.included !== false).map(s => s.user)
                : splitsInput;

            if (splitType === 'equal' && splitData.length === 0) {
                setSaving(false);
                return toast.error('At least one person must be included in the split');
            }

            const formData = new FormData();
            formData.append('groupId', group._id);
            formData.append('description', description);

            // Amount in base currency for math
            const baseAmount = Number(amount) * exchangeRate;
            formData.append('amount', baseAmount);
            formData.append('originalCurrency', currency);
            formData.append('originalAmount', Number(amount));

            formData.append('category', category);
            formData.append('splitType', splitType);
            formData.append('paidBy', paidBy);
            formData.append('date', expenseDate);
            formData.append('note', expenseNote);
            formData.append('recurrenceInterval', recurrenceInterval);
            formData.append('splitsInput', JSON.stringify(splitData));

            if (receiptFile) {
                formData.append('receipt', receiptFile);
            }

            const config = { headers: { 'Content-Type': 'multipart/form-data' } };

            if (editingExpense) {
                await api.put(`/expenses/${editingExpense._id}`, formData, config);
                toast.success('Expense updated');
            } else {
                await api.post('/expenses', formData, config);
                toast.success('Expense added successfully');
            }
            setShowAddModal(false);
            setEditingExpense(null);
            setDescription('');
            setAmount('');
            setReceiptFile(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save expense');
        } finally {
            setSaving(false);
        }
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [showFilters, setShowFilters] = useState(false);

    const resetAndOpenAdd = () => {
        setEditingExpense(null);
        setDescription('');
        setAmount('');
        setCategory('other');
        setSplitType('equal');
        setPaidBy(currentUser._id);
        setExpenseDate(new Date().toISOString().split('T')[0]);
        setExpenseNote('');
        setReceiptFile(null);
        setRecurrenceInterval('none');
        setCurrency(group.baseCurrency || 'INR');
        setSplitsInput(group.members.map(m => ({ user: m._id, amount: '', percent: '', share: '1', included: true })));
        setShowAddModal(true);
    };

    const filteredExpenses = expenses.filter(exp => {
        const matchesSearch = !searchQuery || exp.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || exp.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const sortedExpenses = [...filteredExpenses].sort((a, b) => {
        switch (sortBy) {
            case 'oldest': return new Date(a.date) - new Date(b.date);
            case 'highest': return b.amount - a.amount;
            case 'lowest': return a.amount - b.amount;
            case 'newest':
            default: return new Date(b.date) - new Date(a.date);
        }
    });

    function handleExportCSV() {
        if (sortedExpenses.length === 0) return toast.error('No expenses to export');

        const headers = ['Date', 'Description', 'Category', 'Total Amount', 'Paid By', 'Note'];
        const rows = sortedExpenses.map(exp => [
            new Date(exp.date).toLocaleDateString(),
            `"${exp.description.replace(/"/g, '""')}"`,
            exp.category,
            exp.amount,
            `"${(exp.paidBy.name || exp.paidBy).replace(/"/g, '""')}"`,
            `"${(exp.note || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${group.name.replace(/\s+/g, '_')}_expenses.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Export downloaded');
    }

    const categories = [
        { value: 'all', label: 'ALL', icon: 'apps' },
        { value: 'food', label: 'FOOD', icon: 'restaurant' },
        { value: 'transport', label: 'TRAVEL', icon: 'directions_car' },
        { value: 'entertainment', label: 'FUN', icon: 'sports_esports' },
        { value: 'other', label: 'OTHER', icon: 'receipt_long' },
    ];

    const sortOptions = [
        { value: 'newest', label: 'NEWEST', icon: 'arrow_downward' },
        { value: 'oldest', label: 'OLDEST', icon: 'arrow_upward' },
        { value: 'highest', label: 'HIGHEST ₹', icon: 'trending_up' },
        { value: 'lowest', label: 'LOWEST ₹', icon: 'trending_down' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-2xl uppercase tracking-tighter text-black dark:text-white">ACTIVITY</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportCSV}
                        className="bg-black dark:bg-white text-white dark:text-black brutalist-border dark:border-white px-3 py-2 font-display text-sm shadow-neo-4 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined font-black text-sm">download</span> CSV
                    </button>
                    <button
                        onClick={resetAndOpenAdd}
                        className="bg-toxic-green brutalist-border px-4 py-2 font-display text-black shadow-neo-4 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined font-black">add</span> Add
                    </button>
                </div>
            </div>

            {/* Search & Filter Bar */}
            {expenses.length > 0 && (
                <div className="space-y-3">
                    {/* Search Input — always visible */}
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-black/40 font-black">search</span>
                        <input
                            type="text"
                            placeholder="SEARCH EXPENSES..."
                            className="w-full h-12 border-2 border-black bg-white pl-11 pr-4 font-mono text-xs font-bold text-black uppercase focus:bg-neon-yellow focus:outline-none transition-colors shadow-neo-4 placeholder:text-black/30"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                                <span className="material-symbols-outlined text-sm text-black/40 font-black">close</span>
                            </button>
                        )}
                    </div>

                    {/* Filter toggle + result count row */}
                    <div className="flex items-center justify-end gap-2">
                        {/* Result count when filtered */}
                        {(searchQuery || filterCategory !== 'all' || sortBy !== 'newest') && (
                            <div className="bg-black text-white px-3 py-1.5 brutalist-border border-white inline-flex items-center gap-2 mr-auto">
                                <span className="font-mono text-[10px] font-bold uppercase">
                                    {sortedExpenses.length} OF {expenses.length}
                                </span>
                                <button onClick={() => { setSearchQuery(''); setFilterCategory('all'); setSortBy('newest'); }} className="text-toxic-green font-mono text-[10px] font-black uppercase hover:underline">
                                    CLEAR
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 font-mono text-[10px] font-bold text-black uppercase shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                        >
                            <span className="material-symbols-outlined text-sm font-bold">tune</span>
                            FILTERS
                            {showFilters ? <span className="material-symbols-outlined text-xs">expand_less</span> : <span className="material-symbols-outlined text-xs">expand_more</span>}
                            {(filterCategory !== 'all' || sortBy !== 'newest') && (
                                <span className="size-2 bg-hot-pink border border-black rounded-full"></span>
                            )}
                        </button>
                    </div>

                    {showFilters && (
                        <div className="space-y-3 border-2 border-black bg-background-light p-3 shadow-neo-4">
                            {/* Category Filter Chips */}
                            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                                {categories.map(cat => (
                                    <button
                                        key={cat.value}
                                        onClick={() => setFilterCategory(cat.value)}
                                        className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 border-2 border-black font-mono text-[10px] font-black uppercase transition-all ${filterCategory === cat.value ? 'bg-black text-white shadow-none translate-y-0.5' : 'bg-white text-black shadow-neo-sm hover:translate-y-0.5 hover:shadow-none'}`}
                                    >
                                        <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                                        {cat.label}
                                    </button>
                                ))}
                            </div>

                            {/* Sort Options */}
                            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                                <span className="flex-shrink-0 font-mono text-[10px] font-black text-black/40 uppercase self-center mr-1">SORT:</span>
                                {sortOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setSortBy(opt.value)}
                                        className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 border-2 border-black font-mono text-[10px] font-black uppercase transition-all ${sortBy === opt.value ? 'bg-electric-blue text-white shadow-none translate-y-0.5' : 'bg-white text-black shadow-neo-sm hover:translate-y-0.5 hover:shadow-none'}`}
                                    >
                                        <span className="material-symbols-outlined text-xs">{opt.icon}</span>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {expenses.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 brutalist-border dark:border-white shadow-neo-8 p-8 text-center">
                    <p className="font-mono font-bold text-black dark:text-white uppercase">NO ACTIVITY DETECTED.</p>
                </div>
            ) : sortedExpenses.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 brutalist-border dark:border-white shadow-neo-4 p-6 text-center">
                    <span className="material-symbols-outlined text-3xl text-black/30 dark:text-white/30 block mb-2">search_off</span>
                    <p className="font-mono font-bold text-black/40 dark:text-white/40 uppercase text-xs">NO MATCHING EXPENSES FOUND</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedExpenses.map((expense, i) => {
                        const cardStyles = [
                            { card: 'bg-electric-blue dark:bg-blue-900', amountText: 'text-white' },
                            { card: 'bg-hot-pink dark:bg-pink-900', amountText: 'text-white' },
                            { card: 'bg-white dark:bg-gray-800', amountText: 'text-white dark:text-white' },
                            { card: 'bg-neon-yellow dark:bg-yellow-700', amountText: 'text-white dark:text-white' },
                        ][i % 4];
                        return (
                            <div key={expense._id} className={`${cardStyles.card} brutalist-border dark:border-white p-4 shadow-neo-4 dark:shadow-neo-4-light flex justify-between items-center transition-colors`}>
                                <div className="flex items-center gap-4">
                                    <div className="bg-white dark:bg-gray-900 brutalist-border dark:border-white p-2">
                                        <span className="material-symbols-outlined text-3xl text-black dark:text-white font-black">
                                            {expense.category === 'food' ? 'restaurant' : expense.category === 'transport' ? 'directions_car' : 'receipt_long'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="font-display text-xl uppercase leading-none text-black dark:text-white">{expense.description}</h4>
                                        <p className="font-mono text-[10px] font-bold text-black dark:text-gray-300 uppercase mt-1 flex items-center gap-2">
                                            <span>PAID BY {expense.paidBy.name} • {new Date(expense.date).toLocaleDateString()}</span>
                                            {expense.recurrence?.interval && (
                                                <span className="flex items-center gap-1 bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5 rounded-none text-[8px] leading-none">
                                                    <span className="material-symbols-outlined text-[10px]">event_repeat</span>
                                                    {expense.recurrence.interval}
                                                </span>
                                            )}
                                        </p>
                                        {expense.note && (
                                            <p className="font-mono text-[9px] text-black/50 dark:text-gray-400 italic mt-0.5 leading-tight">
                                                {expense.note}
                                            </p>
                                        )}
                                        {expense.receipt && (
                                            <div className="mt-2 text-[10px] font-mono font-bold text-black dark:text-white border-2 border-black dark:border-white bg-white dark:bg-gray-900 inline-flex items-center gap-1 px-1.5 py-0.5 shadow-neo-sm">
                                                <span className="material-symbols-outlined text-[12px]">attachment</span>
                                                <a
                                                    href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${expense.receipt}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="hover:underline uppercase text-electric-blue dark:text-neo-blue"
                                                >
                                                    VIEW RECEIPT
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`font-display text-2xl font-black ${cardStyles.amountText} bg-black dark:bg-white dark:text-black px-2 py-1 brutalist-border dark:border-black`}>
                                        {formatCurrency(expense.amount, true)}
                                    </span>
                                    {(expense.paidBy._id === currentUser._id || group.createdBy === currentUser._id) && (
                                        <div className="flex gap-1">
                                            <button onClick={() => handleEdit(expense)} className="bg-electric-blue dark:bg-blue-600 text-white border-2 border-black dark:border-white px-2 py-0.5 font-mono text-[10px] font-black uppercase hover:bg-black dark:hover:bg-white dark:hover:text-black transition-colors">
                                                EDIT
                                            </button>
                                            <button onClick={() => handleDelete(expense._id)} className="bg-white dark:bg-gray-900 text-black dark:text-white border-2 border-black dark:border-white px-2 py-0.5 font-mono text-[10px] font-black uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
                                                DELETE
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Neo-Brutalist Add Expense Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
                    <div className="relative w-full max-w-md bg-white brutalist-border shadow-brutal-lg flex flex-col max-h-[85vh]">

                        {/* Sticky Header */}
                        <div className="flex justify-between items-center p-4 border-b-4 border-black bg-white flex-shrink-0">
                            <button onClick={() => { setShowAddModal(false); setEditingExpense(null); }} className="size-10 flex items-center justify-center bg-white border-2 border-black shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                                <span className="material-symbols-outlined font-bold text-black">close</span>
                            </button>
                            <span className="font-display font-black text-black uppercase tracking-widest text-sm">{editingExpense ? 'EDIT EXPENSE' : 'ADD EXPENSE'}</span>
                            <button onClick={handleSaveExpense} className="size-10 flex items-center justify-center bg-toxic-green border-2 border-black shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                                <span className="material-symbols-outlined font-bold text-black">done</span>
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                            <style>{`.modal-scroll::-webkit-scrollbar { display: none; }`}</style>

                            <div className="text-center py-4 relative flex flex-col items-center">
                                <div className="inline-flex items-end gap-2 relative z-10 w-fit max-w-[280px]">
                                    <select
                                        className="font-display font-black text-3xl text-black bg-transparent border-none outline-none cursor-pointer appearance-none text-right shrink-0 py-1 pl-1"
                                        value={currency}
                                        onChange={e => setCurrency(e.target.value)}
                                        dir="rtl"
                                    >
                                        <option value="INR">₹</option>
                                        <option value="USD">$</option>
                                        <option value="EUR">€</option>
                                        <option value="GBP">£</option>
                                        <option value="AUD">A$</option>
                                        <option value="CAD">C$</option>
                                        <option value="JPY">¥</option>
                                    </select>
                                    <input
                                        type="number"
                                        className="font-display font-black text-6xl text-black bg-transparent min-w-[120px] max-w-full text-left focus:outline-none p-0 border-none inline-block appearance-none break-all"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="h-4 w-full bg-toxic-green absolute -bottom-1 left-0 -z-10 border-2 border-black border-t-0"></div>
                                </div>
                                {currency !== (group.baseCurrency || 'INR') && amount && (
                                    <div className="mt-4 font-mono text-[10px] font-bold text-black/60 bg-neon-yellow brutalist-border px-3 py-1 inline-flex items-center gap-1 shadow-neo-sm">
                                        {fetchingRate ? 'FETCHING RATE...' : `≈ ${formatCurrency(amount * exchangeRate, true, group.baseCurrency || 'INR')} (Rate: 1 ${currency} = ${exchangeRate} ${group.baseCurrency || 'INR'})`}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <label className="font-mono font-bold text-xs uppercase text-black">What for?</label>
                                    <input
                                        type="text"
                                        className="w-full h-14 border-2 border-black bg-white p-4 font-mono font-bold text-black focus:bg-neon-yellow focus:outline-none placeholder:text-gray-400 transition-colors shadow-neo-4"
                                        placeholder="DINNER AT PIZZA HUT"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="font-mono font-bold text-xs uppercase text-black">Category</label>
                                    <div className="relative h-14 border-2 border-black bg-electric-blue flex items-center px-4 shadow-neo-4">
                                        <span className="material-symbols-outlined text-white mr-3">category</span>
                                        <select
                                            className="w-full bg-transparent border-none font-mono font-bold text-white focus:outline-none appearance-none"
                                            value={category}
                                            onChange={e => setCategory(e.target.value)}
                                        >
                                            <option value="food" className="text-black">Food & Drink</option>
                                            <option value="transport" className="text-black">Travel / Transport</option>
                                            <option value="entertainment" className="text-black">Entertainment</option>
                                            <option value="other" className="text-black">Other Expenses</option>
                                        </select>
                                        <span className="material-symbols-outlined text-white absolute right-4 pointer-events-none">expand_more</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="font-mono font-bold text-xs uppercase text-black">Note <span className="text-black/30">(optional)</span></label>
                                    <textarea
                                        className="w-full border-2 border-black bg-white p-3 font-mono text-xs font-bold text-black focus:bg-neon-yellow focus:outline-none placeholder:text-gray-400 transition-colors shadow-neo-4 resize-none"
                                        placeholder="Avro paid for everyone at McDonald's..."
                                        value={expenseNote}
                                        onChange={e => setExpenseNote(e.target.value)}
                                        maxLength={300}
                                        rows={2}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="font-mono font-bold text-xs uppercase text-black">Date</label>
                                    <div className="relative h-14 border-2 border-black bg-white flex items-center px-4 shadow-neo-4">
                                        <span className="material-symbols-outlined text-black mr-3">calendar_today</span>
                                        <input
                                            type="date"
                                            className="w-full bg-transparent border-none font-mono font-bold text-black focus:outline-none appearance-none"
                                            value={expenseDate}
                                            onChange={e => setExpenseDate(e.target.value)}
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="font-mono font-bold text-xs uppercase text-black">Repeat</label>
                                    <div className="relative h-14 border-2 border-black bg-white flex items-center px-4 shadow-neo-4">
                                        <span className="material-symbols-outlined text-black mr-3">event_repeat</span>
                                        <select
                                            className="w-full bg-transparent border-none font-mono font-bold text-black focus:outline-none appearance-none"
                                            value={recurrenceInterval}
                                            onChange={e => setRecurrenceInterval(e.target.value)}
                                        >
                                            <option value="none">Does not repeat</option>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                        <span className="material-symbols-outlined text-black absolute right-4 pointer-events-none">expand_more</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="font-mono font-bold text-xs uppercase text-black">Paid By</label>
                                    <div className="relative h-12 border-2 border-black bg-white flex items-center px-4 shadow-neo-4">
                                        <span className="material-symbols-outlined text-black mr-3">person</span>
                                        <select
                                            className="w-full bg-transparent border-none font-mono font-bold text-black focus:outline-none appearance-none"
                                            value={paidBy}
                                            onChange={e => setPaidBy(e.target.value)}
                                        >
                                            {group.members.map(m => (
                                                <option key={m._id} value={m._id}>{m.name} {m._id === currentUser._id ? '(You)' : ''}</option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined text-black absolute right-4 pointer-events-none">expand_more</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="font-mono font-bold text-xs uppercase text-black">Receipt / Attachment <span className="text-black/30">(optional)</span></label>
                                    <div className="relative h-14 border-2 border-dashed border-black bg-white flex items-center px-4 shadow-neo-4 group hover:bg-neon-yellow transition-colors cursor-pointer">
                                        <span className="material-symbols-outlined text-black mr-3 group-hover:animate-bounce">upload_file</span>
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={e => setReceiptFile(e.target.files[0])}
                                        />
                                        <span className="font-mono font-bold text-xs text-black truncate pr-4">
                                            {receiptFile ? receiptFile.name : (editingExpense?.receipt ? 'New file will replace old receipt' : 'CHOOSE FILE... max 5MB')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="font-mono font-bold text-xs uppercase text-black">Split Method</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setSplitType('equal')} className={`flex-1 py-3 border-2 border-black font-display font-black text-xs flex items-center justify-center shadow-neo-sm transition-colors ${splitType === 'equal' ? 'bg-hot-pink text-white' : 'bg-white text-black'}`}>EQUAL</button>
                                    <button type="button" onClick={() => setSplitType('exact')} className={`flex-1 py-3 border-2 border-black font-display font-black text-xs flex items-center justify-center shadow-neo-sm transition-colors ${splitType === 'exact' ? 'bg-electric-blue text-white' : 'bg-white text-black'}`}>EXACT</button>
                                    <button type="button" onClick={() => setSplitType('percentage')} className={`flex-1 py-3 border-2 border-black font-display font-black text-xl flex items-center justify-center shadow-neo-sm transition-colors ${splitType === 'percentage' ? 'bg-neon-yellow text-black' : 'bg-white text-black'}`}>%</button>
                                </div>
                            </div>

                            {splitType === 'equal' && (
                                <div className="border-2 border-black p-4 bg-background-light shadow-neo-4 space-y-3">
                                    <p className="font-mono text-xs font-bold text-black mb-2 uppercase">
                                        Who is included in this split?
                                    </p>
                                    {group.members.map((m, idx) => {
                                        const split = splitsInput[idx];
                                        return (
                                            <div
                                                key={m._id}
                                                className="flex items-center gap-3 cursor-pointer select-none border-2 border-transparent hover:border-black/10 p-1 -m-1 transition-all"
                                                onClick={() => {
                                                    const updated = [...splitsInput];
                                                    // Default is true, so toggle explicitly
                                                    updated[idx] = { ...updated[idx], included: updated[idx].included === false ? true : false };
                                                    setSplitsInput(updated);
                                                }}
                                            >
                                                <div className={`size-6 border-2 border-black flex items-center justify-center transition-colors shadow-neo-sm ${split.included !== false ? 'bg-toxic-green text-black' : 'bg-white text-transparent'}`}>
                                                    <span className="material-symbols-outlined text-[16px] font-black">check</span>
                                                </div>
                                                <div className="size-8 border-2 border-black flex items-center justify-center font-display text-xs font-black bg-gray-200 text-black flex-shrink-0">
                                                    {m.name?.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-mono text-xs font-bold text-black flex-1 truncate">
                                                    {m.name} {m._id === currentUser._id ? '(You)' : ''}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {splitType !== 'equal' && (
                                <div className="border-2 border-black p-4 bg-background-light shadow-neo-4 space-y-3">
                                    <p className="font-mono text-xs font-bold text-black mb-2 uppercase">
                                        {splitType === 'exact' ? 'Enter exact amounts' : 'Enter percentages'}
                                    </p>
                                    {group.members.map((m, idx) => {
                                        const split = splitsInput[idx];
                                        return (
                                            <div key={m._id} className="flex items-center gap-3">
                                                <div className="size-8 border-2 border-black flex items-center justify-center font-display text-xs font-black bg-gray-200 text-black flex-shrink-0">
                                                    {m.name?.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-mono text-xs font-bold text-black flex-1 truncate">
                                                    {m.name} {m._id === currentUser._id ? '(You)' : ''}
                                                </span>
                                                <div className="relative w-24">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-black">
                                                        {splitType === 'exact' ? '₹' : '%'}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="w-full h-10 border-2 border-black bg-white pl-6 pr-2 font-mono font-bold text-black text-sm focus:bg-neon-yellow focus:outline-none"
                                                        placeholder="0"
                                                        value={splitType === 'exact' ? (split.amount || '') : (split.percent || '')}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            const updated = [...splitsInput];
                                                            if (splitType === 'exact') {
                                                                updated[idx] = { ...updated[idx], amount: val };
                                                            } else {
                                                                updated[idx] = { ...updated[idx], percent: val };
                                                            }
                                                            setSplitsInput(updated);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {/* Running total indicator */}
                                    {(() => {
                                        const total = splitsInput.reduce((acc, s) =>
                                            acc + Number(splitType === 'exact' ? (s.amount || 0) : (s.percent || 0)), 0
                                        );
                                        const target = splitType === 'exact' ? Number(amount || 0) : 100;
                                        const isValid = Math.abs(total - target) < 0.02;
                                        return (
                                            <div className={`mt-2 p-2 border-2 border-black font-mono text-xs font-bold uppercase text-center ${isValid ? 'bg-neo-green text-black' : 'bg-neo-pink text-white'}`}>
                                                {splitType === 'exact'
                                                    ? `${formatCurrency(total, true, group.baseCurrency)} / ${formatCurrency(Number(amount || 0), true, group.baseCurrency)}`
                                                    : `${total.toFixed(1)}% / 100%`
                                                }
                                                {isValid ? ' ✓' : ' — MISMATCH'}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-4 border-t-4 border-black bg-white flex-shrink-0">
                            <button onClick={handleSaveExpense} disabled={saving} className="w-full h-14 bg-primary border-4 border-black shadow-brutal flex items-center justify-center gap-3 hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-y-2 transition-all disabled:opacity-50 disabled:translate-y-1 disabled:shadow-none">
                                <span className="font-display font-black text-black text-xl tracking-tighter italic">{saving ? (editingExpense ? 'UPDATING...' : 'SAVING...') : (editingExpense ? 'UPDATE EXPENSE' : 'SAVE EXPENSE')}</span>
                                {!saving && <span className="material-symbols-outlined font-black text-black">trending_flat</span>}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseTab;
