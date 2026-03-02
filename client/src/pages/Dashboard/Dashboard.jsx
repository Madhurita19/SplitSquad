import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { formatCurrency, formatSignedCurrency } from '../../utils/currency';
import toast from 'react-hot-toast';
import { DashboardSkeleton } from '../../components/SkeletonLoader';
import NotificationsDropdown from '../../components/NotificationsDropdown';

const Dashboard = () => {
    const { user, updateProfile, logout } = useContext(AuthContext);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showHelp, setShowHelp] = useState(false); // New help state
    const [newGroup, setNewGroup] = useState({ name: '', description: '', category: 'other', baseCurrency: 'INR' });
    const [profileData, setProfileData] = useState({ name: user?.name || '', email: user?.email || '', upiId: user?.upiId || '', password: '' });
    const [stats, setStats] = useState({ totalExpenses: 0, totalAmountSpent: 0, avgPerExpense: 0, topSquad: null });
    const [creating, setCreating] = useState(false);
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [showArchived, setShowArchived] = useState(false);

    // Calculate total net balance across all groups
    const totalBalance = groups.reduce((acc, curr) => {
        if (curr.isArchived && !showArchived) return acc;
        return acc + curr.myBalance;
    }, 0);

    // Compute level
    const level = Math.max(1, Math.floor(
        groups.length +
        (stats.totalExpenses / 5) +
        (stats.totalAmountSpent / 1000)
    ));

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const [{ data: groupsData }, { data: balanceMap }, { data: statsData }] = await Promise.all([
                api.get('/groups'),
                api.get('/groups/my-balances'),
                api.get('/groups/my-stats'),
            ]);
            const enriched = groupsData.map(g => ({
                ...g,
                myBalance: balanceMap[g._id] || 0,
            }));
            setGroups(enriched);
            setStats(statsData);
        } catch (error) {
            toast.error('Failed to load groups');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const { data } = await api.post('/groups', newGroup);
            setGroups([{ ...data, myBalance: 0 }, ...groups]);
            setShowModal(false);
            setNewGroup({ name: '', description: '', category: 'other' });
            toast.success('Group created!');
        } catch (error) {
            toast.error('Failed to create group');
        } finally {
            setCreating(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdatingProfile(true);
        if (profileData.upiId && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(profileData.upiId)) {
            toast.error('Please enter a valid UPI ID (e.g., name@bank)');
            setUpdatingProfile(false);
            return;
        }

        try {
            const payload = { ...profileData };
            if (!payload.password) delete payload.password;

            await updateProfile(payload);
            toast.success('Profile updated successfully!');
            setShowProfileModal(false);
            setProfileData(prev => ({ ...prev, password: '' })); // clear password field
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setUpdatingProfile(false);
        }
    };

    const getLevelTitle = (lvl) => {
        if (lvl >= 50) return 'SQUAD LORD';
        if (lvl >= 30) return 'BIG SPENDER';
        if (lvl >= 15) return 'SQUAD LEADER';
        if (lvl >= 8) return 'ACTIVE USER';
        if (lvl >= 3) return 'NEWCOMER';
        return 'ROOKIE';
    };

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="font-body text-white min-h-screen p-4 pb-32">
            <div className="max-w-md mx-auto space-y-6">

                {/* UPI Missing Warning */}
                {!user?.upiId && (
                    <div className="bg-hot-pink brutalist-border shadow-neo-4 p-4 flex items-center gap-4 animate-bounce">
                        <span className="material-symbols-outlined text-white text-3xl font-black">warning</span>
                        <div className="flex-1">
                            <p className="font-display text-sm text-white uppercase leading-tight">UPI ID MISSING</p>
                            <p className="font-mono text-[10px] text-white/80 uppercase">You can't receive payments via QR code until you set this!</p>
                        </div>
                        <button onClick={() => setShowProfileModal(true)} className="bg-white text-black px-3 py-1 font-display text-xs uppercase brutalist-border shadow-neo-sm">FIX</button>
                    </div>
                )}

                {/* Header */}
                <header className="bg-neon-yellow brutalist-border shadow-neo-4 p-3 sm:p-4 flex items-center justify-between mt-2 gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="size-12 brutalist-border bg-white overflow-hidden flex items-center justify-center font-display text-2xl text-black">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="flex flex-col min-w-0 mr-2">
                            <h2 className="font-display text-xl sm:text-2xl text-black uppercase leading-tight whitespace-normal break-words">
                                YO {user?.name?.split(' ')[0]}!
                            </h2>
                            <div className="mt-1.5 flex items-center">
                                <div className="bg-hot-pink border-2 border-black px-2 shadow-[2px_2px_0px_#000] transform -rotate-2">
                                    <span className="text-[10px] font-black text-white uppercase italic leading-none">LVL {level}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <NotificationsDropdown />
                        <button onClick={() => setShowHelp(true)} className="size-10 brutalist-border bg-electric-blue flex items-center justify-center text-white active:translate-y-1 active:shadow-none transition-all" title="How to use">
                            <span className="material-symbols-outlined font-bold text-[22px]">help</span>
                        </button>
                        <button onClick={() => setShowProfileModal(true)} className="size-10 brutalist-border bg-white flex items-center justify-center text-black active:translate-y-1 active:shadow-none transition-all" title="Edit Profile">
                            <span className="material-symbols-outlined font-bold text-[22px]">settings</span>
                        </button>
                        <button onClick={logout} className="size-10 brutalist-border bg-white flex items-center justify-center text-black active:translate-y-1 active:shadow-none transition-all" title="Logout">
                            <span className="material-symbols-outlined font-bold text-xl ml-1">logout</span>
                        </button>
                    </div>
                </header>

                {/* Summary Section */}
                <section className="relative">
                    <div className="bg-white brutalist-border shadow-neo-8 p-6 flex flex-col items-start gap-4">
                        <div className="flex items-center gap-2 w-full">
                            <div className="bg-black text-white px-2 py-1 text-xs font-bold uppercase tracking-widest">
                                TOTAL BALANCE
                            </div>
                            {totalBalance !== 0 && (
                                <div className={`${totalBalance > 0 ? 'bg-neo-green' : 'bg-neo-pink'} brutalist-border px-2 py-0.5`}>
                                    <span className={`material-symbols-outlined text-sm font-black ${totalBalance > 0 ? 'text-black' : 'text-white'}`}>
                                        {totalBalance > 0 ? 'arrow_upward' : 'arrow_downward'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <h1 className={`font-display text-6xl leading-none break-all ${totalBalance > 0 ? 'text-neo-green' : totalBalance < 0 ? 'text-neo-pink' : 'text-black'}`}>
                            {formatSignedCurrency(totalBalance)}
                        </h1>
                        <div className={`${totalBalance > 0 ? 'bg-neo-green text-black' : totalBalance < 0 ? 'bg-neo-pink text-white' : 'bg-black text-white'} brutalist-border px-3 py-1 font-display text-sm uppercase tracking-wider`}>
                            {totalBalance > 0 ? '↑ YOU ARE OWED' : totalBalance < 0 ? '↓ YOU OWE' : '✓ ALL SETTLED'}
                        </div>
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className="w-full bg-toxic-green brutalist-border py-4 font-display text-2xl text-black shadow-neo-bottom active:translate-y-1 active:shadow-none transition-all uppercase flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined font-black text-black">query_stats</span>
                            {showStats ? 'HIDE STATS' : 'YOUR STATS'}
                        </button>
                    </div>
                </section>

                {/* Stats Panel */}
                {showStats && (
                    <section className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-electric-blue brutalist-border p-4 shadow-neo-4">
                                <p className="font-mono text-[10px] font-bold text-white/70 uppercase">SQUADS JOINED</p>
                                <p className="font-display text-4xl text-white leading-none mt-1">{groups.length}</p>
                            </div>
                            <div className="bg-hot-pink brutalist-border p-4 shadow-neo-4">
                                <p className="font-mono text-[10px] font-bold text-white/70 uppercase">YOUR EXPENSES</p>
                                <p className="font-display text-4xl text-white leading-none mt-1">{stats.totalExpenses}</p>
                            </div>
                            <div className="bg-neon-yellow brutalist-border p-4 shadow-neo-4">
                                <p className="font-mono text-[10px] font-bold text-black/60 uppercase">TOTAL SPENT</p>
                                <p className="font-display text-3xl text-black leading-none mt-1">{formatCurrency(stats.totalAmountSpent)}</p>
                            </div>
                            <div className="bg-white brutalist-border p-4 shadow-neo-4">
                                <p className="font-mono text-[10px] font-bold text-black/60 uppercase">AVG / EXPENSE</p>
                                <p className="font-display text-3xl text-black leading-none mt-1">{formatCurrency(stats.avgPerExpense)}</p>
                            </div>
                        </div>
                        {stats.topSquad && (
                            <div className="bg-black brutalist-border p-4 shadow-neo-4 flex items-center justify-between border-white">
                                <div>
                                    <p className="font-mono text-[10px] font-bold text-white/50 uppercase">TOP SQUAD</p>
                                    <p className="font-display text-2xl text-toxic-green leading-none mt-1 uppercase">{stats.topSquad}</p>
                                </div>
                                <div className="bg-toxic-green brutalist-border px-3 py-2">
                                    <span className="material-symbols-outlined text-black font-black">emoji_events</span>
                                </div>
                            </div>
                        )}
                        <div className="bg-hot-pink brutalist-border p-3 shadow-neo-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-white font-black">military_tech</span>
                                <span className="font-display text-sm text-white uppercase">{getLevelTitle(level)}</span>
                            </div>
                            <div className="bg-white brutalist-border px-2 py-1">
                                <span className="font-display text-sm font-black text-black">LVL {level}</span>
                            </div>
                        </div>
                    </section>
                )}

                {/* Groups Grid */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="font-display text-2xl uppercase tracking-tighter text-white">THE SQUADS</h3>
                            <div className="h-1 w-12 bg-white brutalist-border border-white"></div>
                        </div>
                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            className="bg-white border-2 border-black px-3 py-1 text-black font-mono text-[10px] font-black uppercase hover:bg-black hover:text-white transition-colors brutalist-border shadow-neo-sm"
                        >
                            {showArchived ? 'VIEW ACTIVE' : 'VIEW ARCHIVED'}
                        </button>
                    </div>

                    {(() => {
                        const activeGroups = groups.filter(g => !g.isArchived);
                        const archivedGroups = groups.filter(g => g.isArchived);
                        const displayedGroups = showArchived ? archivedGroups : activeGroups;

                        if (loading) return null; // Handled by skeleton

                        if (groups.length === 0) return (
                            <div className="space-y-4">
                                {/* Welcome Card */}
                                <div className="bg-neon-yellow brutalist-border shadow-neo-8 p-6 text-center space-y-3">
                                    <span className="material-symbols-outlined text-6xl text-black">waving_hand</span>
                                    <h4 className="font-display text-3xl text-black uppercase leading-tight">WELCOME TO SPLITSQUAD</h4>
                                    <p className="font-mono text-xs font-bold text-black/60 uppercase">Split bills, track debts, settle up — all in one place.</p>
                                </div>

                                {/* How it works - 3 steps */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-electric-blue brutalist-border p-3 text-center space-y-2">
                                        <div className="bg-white brutalist-border size-10 flex items-center justify-center mx-auto">
                                            <span className="font-display text-xl text-black font-black">1</span>
                                        </div>
                                        <span className="material-symbols-outlined text-2xl text-white">group_add</span>
                                        <p className="font-mono text-[9px] font-bold text-white uppercase leading-tight">CREATE A SQUAD</p>
                                    </div>
                                    <div className="bg-hot-pink brutalist-border p-3 text-center space-y-2">
                                        <div className="bg-white brutalist-border size-10 flex items-center justify-center mx-auto">
                                            <span className="font-display text-xl text-black font-black">2</span>
                                        </div>
                                        <span className="material-symbols-outlined text-2xl text-white">person_add</span>
                                        <p className="font-mono text-[9px] font-bold text-white uppercase leading-tight">ADD YOUR FRIENDS</p>
                                    </div>
                                    <div className="bg-toxic-green brutalist-border p-3 text-center space-y-2">
                                        <div className="bg-white brutalist-border size-10 flex items-center justify-center mx-auto">
                                            <span className="font-display text-xl text-black font-black">3</span>
                                        </div>
                                        <span className="material-symbols-outlined text-2xl text-black">receipt_long</span>
                                        <p className="font-mono text-[9px] font-bold text-black uppercase leading-tight">SPLIT EXPENSES</p>
                                    </div>
                                </div>

                                {/* CTA */}
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="w-full bg-white brutalist-border shadow-neo-8 p-5 flex items-center gap-4 hover:translate-y-1 hover:shadow-neo-4 active:translate-y-2 active:shadow-none transition-all"
                                >
                                    <div className="bg-toxic-green brutalist-border p-3">
                                        <span className="material-symbols-outlined text-3xl text-black font-black">add_box</span>
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-display text-xl text-black uppercase leading-none">CREATE YOUR FIRST SQUAD</h4>
                                        <p className="font-mono text-[10px] font-bold text-black/50 uppercase mt-1">Trips, flatmates, events — you name it</p>
                                    </div>
                                </button>

                                <div className="bg-black brutalist-border border-white p-4 text-center space-y-2">
                                    <p className="font-mono text-[10px] font-bold text-white/50 uppercase">GOT AN INVITE LINK?</p>
                                    <p className="font-mono text-xs font-bold text-toxic-green uppercase">Paste it in your browser to join a squad instantly</p>
                                </div>
                            </div>
                        );

                        if (displayedGroups.length === 0) return (
                            <div className="bg-background-light border-2 border-white border-dashed p-8 text-center opacity-50">
                                <p className="font-mono font-bold text-white uppercase">{showArchived ? 'NO ARCHIVED SQUADS' : 'NO ACTIVE SQUADS'}</p>
                            </div>
                        );

                        return (
                            <div className="grid grid-cols-2 gap-4">
                                {displayedGroups.map((group, index) => {
                                    const colors = ['bg-electric-blue', 'bg-hot-pink', 'bg-toxic-green', 'bg-white'];
                                    const textColor = index % 4 === 1 ? 'text-white' : 'text-black';
                                    const bgColor = showArchived ? 'bg-gray-400' : colors[index % colors.length]; // Gray out if archived
                                    const isWide = index === 0 || index % 4 === 3;

                                    return (
                                        <Link key={group._id} to={`/group/${group._id}`} className={`${isWide ? 'col-span-2' : ''} ${bgColor} brutalist-border p-4 shadow-neo-4 ${!isWide ? 'flex flex-col justify-between aspect-square' : ''}`}>
                                            <div className="flex justify-between items-start">
                                                <span className={`material-symbols-outlined text-${isWide ? '5xl' : '4xl'} font-bold ${index === 3 && !showArchived ? 'text-black' : textColor}`}>
                                                    {group.category === 'trip' ? 'beach_access' : group.category === 'flat' ? 'cottage' : 'group'}
                                                </span>
                                                {/* Per-squad balance badge */}
                                                <div className={`${group.myBalance > 0 ? 'bg-neo-green text-black' : group.myBalance < 0 ? 'bg-neo-pink text-white' : 'bg-black text-white'} brutalist-border px-2 py-1 font-black text-[10px] font-mono flex items-center gap-1`}>
                                                    {group.myBalance > 0 ? `+${formatCurrency(group.myBalance)}` : group.myBalance < 0 ? `-${formatCurrency(Math.abs(group.myBalance))}` : '✓ SETTLED'}
                                                </div>
                                            </div>
                                            <div className={isWide && index !== 0 ? 'mt-2' : ''}>
                                                <h4 className={`font-display ${isWide ? 'text-3xl' : 'text-lg'} ${textColor} uppercase leading-tight ${index === 3 && !showArchived ? '!text-black' : ''}`}>
                                                    {group.name}
                                                    {group.isArchived && <span className="ml-2 text-xs bg-black text-white px-1">ARCHIVED</span>}
                                                </h4>
                                                <p className={`font-bold ${textColor} ${index === 3 && !showArchived ? '!text-electric-blue' : (index === 2 && !showArchived ? 'text-black/60' : '')} ${isWide ? 'mt-1 text-sm' : 'text-[10px]'} uppercase`}>
                                                    {group.members?.length || 1} MEMBERS
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </section>

                {/* FAB */}
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <button onClick={() => setShowModal(true)} className="bg-toxic-green brutalist-border px-6 py-4 flex items-center gap-3 shadow-neo-8 hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-4 active:translate-y-2 active:shadow-none transition-all">
                        <span className="material-symbols-outlined text-3xl font-bold text-black" style={{ fontStyle: 'normal' }}>add_box</span>
                        <span className="font-display text-xl text-black uppercase">NEW SQUAD</span>
                    </button>
                </div>

                {/* Create Group Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
                        <div className="bg-white brutalist-border shadow-neo-8 p-6 w-full max-w-sm">
                            <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-2">
                                <h2 className="font-display text-2xl text-black uppercase">NEW SQUAD</h2>
                                <button onClick={() => setShowModal(false)}>
                                    <span className="material-symbols-outlined font-bold text-black">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleCreateGroup} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="font-mono font-bold text-xs uppercase text-black">Squad Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-background-light brutalist-border p-3 text-black font-mono focus:bg-neo-yellow focus:outline-none transition-colors"
                                        placeholder="e.g. Goa Trip 2026"
                                        value={newGroup.name}
                                        onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-mono font-bold text-xs uppercase text-black">Category</label>
                                    <select
                                        className="w-full bg-background-light brutalist-border p-3 text-black font-mono focus:bg-electric-blue focus:text-white focus:outline-none transition-colors appearance-none"
                                        value={newGroup.category}
                                        onChange={e => setNewGroup({ ...newGroup, category: e.target.value })}
                                    >
                                        <option value="trip">Trip</option>
                                        <option value="flat">Flat / Roommates</option>
                                        <option value="event">Event</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="font-mono font-bold text-xs uppercase text-black">Base Currency</label>
                                    <select
                                        className="w-full bg-background-light brutalist-border p-3 text-black font-mono focus:bg-neon-yellow focus:text-black focus:outline-none transition-colors appearance-none"
                                        value={newGroup.baseCurrency}
                                        onChange={e => setNewGroup({ ...newGroup, baseCurrency: e.target.value })}
                                    >
                                        <option value="INR">Indian Rupee (₹)</option>
                                        <option value="USD">US Dollar ($)</option>
                                        <option value="EUR">Euro (€)</option>
                                        <option value="GBP">British Pound (£)</option>
                                        <option value="AUD">Australian Dollar (A$)</option>
                                        <option value="CAD">Canadian Dollar (C$)</option>
                                        <option value="JPY">Japanese Yen (¥)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="font-mono font-bold text-xs uppercase text-black">Description</label>
                                    <input
                                        type="text"
                                        className="w-full bg-background-light brutalist-border p-3 text-black font-mono focus:bg-hot-pink focus:text-white focus:outline-none transition-colors"
                                        placeholder="Optional"
                                        value={newGroup.description}
                                        onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}
                                    />
                                </div>
                                <button type="submit" disabled={creating} className="w-full mt-4 bg-toxic-green brutalist-border py-4 font-display text-xl text-black shadow-neo-bottom active:translate-y-1 active:shadow-none transition-all uppercase disabled:opacity-50 disabled:translate-y-1 disabled:shadow-none">
                                    {creating ? 'CREATING...' : 'CREATE'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Profile Modal */}
                {showProfileModal && (
                    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
                        <div className="bg-white brutalist-border shadow-neo-8 p-6 w-full max-w-sm">
                            <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-2">
                                <h2 className="font-display text-2xl text-black uppercase">EDIT PROFILE</h2>
                                <button onClick={() => setShowProfileModal(false)}>
                                    <span className="material-symbols-outlined font-bold text-black">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="font-mono font-bold text-xs uppercase text-black">Handle (Name)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-background-light brutalist-border p-3 text-black font-mono focus:bg-neon-yellow focus:outline-none transition-colors"
                                        value={profileData.name}
                                        onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-mono font-bold text-xs uppercase text-black">Secure Comms (Email)</label>
                                    <input
                                        type="email"
                                        className="w-full bg-background-light brutalist-border p-3 text-black font-mono focus:bg-neo-blue focus:outline-none transition-colors"
                                        value={profileData.email}
                                        onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-mono font-bold text-xs uppercase text-black">UPI ID / VPA (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-background-light brutalist-border p-3 text-black font-mono focus:bg-toxic-green focus:outline-none transition-colors placeholder:text-black/30"
                                        placeholder="username@okicici"
                                        value={profileData.upiId}
                                        onChange={e => setProfileData({ ...profileData, upiId: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-mono font-bold text-xs uppercase text-black">New Access Code (Optional)</label>
                                    <input
                                        type="password"
                                        className="w-full bg-background-light brutalist-border p-3 text-black font-mono focus:bg-hot-pink focus:text-white focus:outline-none transition-colors placeholder:text-black/30"
                                        placeholder="Leave blank to keep current"
                                        value={profileData.password}
                                        onChange={e => setProfileData({ ...profileData, password: e.target.value })}
                                        minLength="6"
                                    />
                                </div>
                                <button type="submit" disabled={updatingProfile} className="w-full mt-4 bg-electric-blue brutalist-border py-4 font-display text-xl text-white shadow-neo-bottom active:translate-y-1 active:shadow-none transition-all uppercase disabled:opacity-50 disabled:translate-y-1 disabled:shadow-none">
                                    {updatingProfile ? 'SAVING...' : 'SAVE CHANGES'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Quick Help Modal */}
                {showHelp && (
                    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
                        <div className="bg-white brutalist-border shadow-neo-8 p-6 w-full max-w-sm space-y-6">
                            <div className="flex justify-between items-center border-b-4 border-black pb-2">
                                <h2 className="font-display text-2xl text-black uppercase">HOW TO USE</h2>
                                <button onClick={() => setShowHelp(false)}>
                                    <span className="material-symbols-outlined font-bold text-black">close</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="bg-neon-yellow brutalist-border size-8 flex items-center justify-center shrink-0 font-display font-black text-black">1</div>
                                    <div>
                                        <p className="font-display text-sm text-black uppercase">Create a Squad</p>
                                        <p className="font-mono text-[10px] text-black/60 uppercase">Tap the + button to start a group for your trip or dinner.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="bg-electric-blue brutalist-border size-8 flex items-center justify-center shrink-0 font-display font-black text-white">2</div>
                                    <div>
                                        <p className="font-display text-sm text-black uppercase">Invite Friends</p>
                                        <p className="font-mono text-[10px] text-black/60 uppercase">Share your Squad Link. They'll appear in your list instantly.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="bg-hot-pink brutalist-border size-8 flex items-center justify-center shrink-0 font-display font-black text-white">3</div>
                                    <div>
                                        <p className="font-display text-sm text-black uppercase">Add Expenses</p>
                                        <p className="font-mono text-[10px] text-black/60 uppercase">Log what you spent. We'll handle the math and show who owes who.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="bg-toxic-green brutalist-border size-8 flex items-center justify-center shrink-0 font-display font-black text-black">4</div>
                                    <div>
                                        <p className="font-display text-sm text-black uppercase">Settle with QR</p>
                                        <p className="font-mono text-[10px] text-black/60 uppercase">Tap "Settle" inside a squad to pay back via any UPI app instantly.</p>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => setShowHelp(false)} className="w-full bg-black text-white brutalist-border py-4 font-display text-xl uppercase shadow-neo-bottom active:translate-y-1 active:shadow-none transition-all">
                                GOT IT!
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
