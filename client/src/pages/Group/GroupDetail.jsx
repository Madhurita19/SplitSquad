import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmModal';
import { GroupDetailSkeleton } from '../../components/SkeletonLoader';

import ExpenseTab from './ExpenseTab';
import BalanceTab from './BalanceTab';
import GraphTab from './GraphTab';
import AnalyticsTab from './AnalyticsTab';
import NotificationsDropdown from '../../components/NotificationsDropdown';

const GroupDetail = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [group, setGroup] = useState(null);
    const [activeTab, setActiveTab] = useState('expenses');
    const [loading, setLoading] = useState(true);
    const [showAddMember, setShowAddMember] = useState(false);
    const [memberEmail, setMemberEmail] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const navigate = useNavigate();
    const confirm = useConfirm();

    const [expenses, setExpenses] = useState([]);
    const [debts, setDebts] = useState({ rawBalances: [], simplifiedDebts: [] });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [groupRes, expRes, debtRes] = await Promise.all([
                api.get(`/groups/${id}`),
                api.get(`/expenses/group/${id}`),
                api.get(`/settlements/group/${id}/debts`)
            ]);
            setGroup(groupRes.data);
            setExpenses(expRes.data);
            setDebts(debtRes.data);
        } catch (error) {
            toast.error('Failed to load group details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        let eventSource;
        let retryCount = 0;
        let maxRetries = 7;
        let reconnectTimeout;

        const connectSSE = () => {
            const apiUrl = import.meta.env.VITE_API_URL || '/api';
            const storedUser = localStorage.getItem('user');
            const token = storedUser ? JSON.parse(storedUser).token : '';

            eventSource = new EventSource(`${apiUrl}/events/group/${id}?token=${token}`);

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (['NEW_EXPENSE', 'DELETE_EXPENSE', 'NEW_SETTLEMENT', 'EDIT_EXPENSE'].includes(data.type)) {
                    fetchData();
                    toast.success('Group updated in real-time!', { icon: '🔄', id: 'sync-msg' });
                }
            };

            eventSource.onopen = () => {
                retryCount = 0; // Reset retries on successful connection
            };

            eventSource.onerror = (err) => {
                eventSource.close();
                if (retryCount < maxRetries) {
                    retryCount++;
                    // Exponential backoff: 1s, 2s, 4s, 8s, up to 10s max
                    const timeout = Math.min(10000, 1000 * Math.pow(2, retryCount));
                    reconnectTimeout = setTimeout(connectSSE, timeout);
                }
            };
        };

        connectSSE();

        return () => {
            if (eventSource) eventSource.close();
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };
    }, [id]);

    if (loading) return <GroupDetailSkeleton />;
    if (!group) return <div className="p-8 text-white font-mono uppercase font-bold text-center text-neo-pink">Group not found.</div>;

    const getTabClass = (tabName, bgColor) => {
        const isActive = activeTab === tabName;
        return `flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-all cursor-pointer ${isActive ? `bg-${bgColor} border-2 border-black shadow-brutal` : 'hover:bg-gray-800'
            }`;
    };

    const getIconClass = (tabName) => {
        return `material-symbols-outlined font-black ${activeTab === tabName ? 'text-black' : 'text-slate-400'}`;
    };

    const getTextClass = (tabName) => {
        return `text-[10px] font-black uppercase tracking-tighter ${activeTab === tabName ? 'text-black' : 'text-slate-400'}`;
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 overflow-x-hidden min-h-screen pb-24 flex flex-col">

            {/* Header */}
            <div className="flex items-center bg-background-light dark:bg-background-dark p-4 border-b-4 border-black justify-between sticky top-0 z-50">
                <Link to="/" className="flex items-center justify-center border-3 border-black bg-neon-yellow p-2 shadow-brutal hover:translate-y-1 hover:shadow-none transition-all">
                    <span className="material-symbols-outlined text-black font-bold">arrow_back</span>
                </Link>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                        <h2 className="text-black dark:text-white text-2xl font-black uppercase tracking-tighter italic leading-none">{group.name}</h2>
                        {group.isArchived && <span className="bg-black text-white px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider">ARCHIVED</span>}
                    </div>
                    <button onClick={() => setShowMembers(!showMembers)} className="bg-black text-white px-2 py-0.5 text-[10px] font-mono font-bold uppercase hover:bg-electric-blue transition-colors">
                        {group.members?.length} MEMBERS {showMembers ? '▲' : '▼'}
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <NotificationsDropdown />
                    <button onClick={() => setShowAddMember(true)} className="flex items-center justify-center border-3 border-black bg-neo-blue p-2 shadow-brutal hover:translate-y-1 hover:shadow-none transition-all">
                        <span className="material-symbols-outlined text-black font-bold">person_add</span>
                    </button>
                </div>
            </div>

            {/* Member List Panel */}
            {showMembers && (
                <div className="border-b-4 border-black bg-white px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                        {group.members?.map((member, idx) => {
                            const colors = ['bg-electric-blue', 'bg-hot-pink', 'bg-toxic-green', 'bg-neon-yellow', 'bg-neo-pink'];
                            const isCreator = member._id === (group.createdBy?._id || group.createdBy);
                            const isYou = member._id === user._id;
                            return (
                                <div key={member._id} className="flex items-center gap-2 border-2 border-black px-2 py-1.5 shadow-neo-sm bg-background-light">
                                    <div className={`size-7 ${colors[idx % colors.length]} border-2 border-black flex items-center justify-center font-display text-xs font-black text-white`}>
                                        {member.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="leading-none">
                                        <p className="font-mono text-[10px] font-black text-black uppercase">
                                            {member.name}{isYou && ' (YOU)'}
                                        </p>
                                        <p className="font-mono text-[8px] text-black/40">{member.email}</p>
                                    </div>
                                    {isCreator && (
                                        <span className="material-symbols-outlined text-sm text-neon-yellow font-black" title="Creator">crown</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Group Actions Bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b-2 border-black bg-background-light dark:bg-background-dark">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-1 border-2 border-black bg-white px-3 py-1.5 font-mono text-[10px] font-bold text-black uppercase shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                    <span className="material-symbols-outlined text-sm font-bold">settings</span>
                    MANAGE
                </button>
                <button
                    onClick={() => {
                        const link = `${window.location.origin}/join/${group.inviteCode}`;
                        navigator.clipboard.writeText(link).then(() => {
                            toast.success('Invite link copied!');
                        }).catch(() => {
                            // Fallback: show the link in a prompt
                            window.prompt('Copy this invite link:', link);
                        });
                    }}
                    className="flex items-center gap-1 border-2 border-black bg-toxic-green px-3 py-1.5 font-mono text-[10px] font-bold text-black uppercase shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                    <span className="material-symbols-outlined text-sm font-bold">share</span>
                    INVITE LINK
                </button>
                <button
                    onClick={async () => {
                        setRefreshing(true);
                        await fetchData();
                        setRefreshing(false);
                        toast.success('Synced!', { icon: '🔄', id: 'sync' });
                    }}
                    className="flex items-center gap-1 border-2 border-black bg-neon-yellow px-3 py-1.5 font-mono text-[10px] font-bold text-black uppercase shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all ml-auto"
                >
                    <span className={`material-symbols-outlined text-sm font-bold ${refreshing ? 'animate-spin' : ''}`}>sync</span>
                    {refreshing ? 'SYNCING' : 'SYNC'}
                </button>
                {showMenu && (
                    <>
                        {group.createdBy?._id !== user._id ? (
                            <button
                                onClick={async () => {
                                    const ok = await confirm({ title: 'LEAVE SQUAD?', message: 'You will no longer see this squad\'s expenses or balances. You can be re-invited later.', confirmText: 'LEAVE', variant: 'danger' });
                                    if (!ok) return;
                                    try {
                                        await api.post(`/groups/${id}/leave`);
                                        toast.success('You left the squad');
                                        navigate('/');
                                    } catch (error) {
                                        toast.error(error.response?.data?.message || 'Failed to leave');
                                    }
                                }}
                                className="flex items-center gap-1 border-2 border-black bg-neo-pink px-3 py-1.5 font-mono text-[10px] font-bold text-white uppercase shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                            >
                                <span className="material-symbols-outlined text-sm font-bold">logout</span>
                                LEAVE
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={async () => {
                                        const action = group.isArchived ? 'UNARCHIVE' : 'ARCHIVE';
                                        const ok = await confirm({
                                            title: `${action} SQUAD?`,
                                            message: group.isArchived
                                                ? 'This squad will reappear in your active dashboard.'
                                                : 'This squad will be moved to the archived tab. You can still view it, but it cleans up your active dashboard.',
                                            confirmText: action,
                                            variant: 'warning'
                                        });
                                        if (!ok) return;
                                        try {
                                            await api.put(`/groups/${id}/archive`);
                                            toast.success(`Squad ${group.isArchived ? 'unarchived' : 'archived'}`);
                                            fetchData();
                                        } catch (error) {
                                            toast.error(error.response?.data?.message || `Failed to ${action.toLowerCase()}`);
                                        }
                                    }}
                                    className="flex items-center gap-1 border-2 border-black bg-neon-yellow px-3 py-1.5 font-mono text-[10px] font-bold text-black uppercase shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm font-bold">
                                        {group.isArchived ? 'unarchive' : 'archive'}
                                    </span>
                                    {group.isArchived ? 'UNARCHIVE' : 'ARCHIVE SQUAD'}
                                </button>
                                <button
                                    onClick={async () => {
                                        const ok = await confirm({ title: 'DELETE SQUAD?', message: 'This will permanently delete the squad, ALL expenses, and ALL settlements. This cannot be undone!', confirmText: 'DELETE', variant: 'danger' });
                                        if (!ok) return;
                                        try {
                                            await api.delete(`/groups/${id}`);
                                            toast.success('Squad deleted');
                                            navigate('/');
                                        } catch (error) {
                                            toast.error(error.response?.data?.message || 'Failed to delete');
                                        }
                                    }}
                                    className="flex items-center gap-1 border-2 border-black bg-red-600 px-3 py-1.5 font-mono text-[10px] font-bold text-white uppercase shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm font-bold">delete_forever</span>
                                    DELETE SQUAD
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative p-4">
                {activeTab === 'expenses' && (
                    <ExpenseTab
                        group={group}
                        expenses={expenses}
                        onRefresh={fetchData}
                        currentUser={user}
                    />
                )}

                {activeTab === 'balances' && (
                    <BalanceTab
                        group={group}
                        debts={debts}
                        onRefresh={fetchData}
                        currentUser={user}
                    />
                )}

                {activeTab === 'graph' && (
                    <GraphTab
                        group={group}
                        debts={debts.simplifiedDebts}
                        rawDebts={debts.rawBalances}
                    />
                )}

                {activeTab === 'analytics' && (
                    <AnalyticsTab groupId={id} group={group} />
                )}
            </div>

            {/* Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 flex border-t-4 border-black bg-background-light dark:bg-background-dark px-4 pb-6 pt-2 gap-2 z-50">
                <div className={getTabClass('expenses', 'neo-yellow')} onClick={() => setActiveTab('expenses')}>
                    <span className={getIconClass('expenses')}>receipt_long</span>
                    <p className={getTextClass('expenses')}>Expenses</p>
                </div>
                <div className={getTabClass('balances', 'hot-pink')} onClick={() => setActiveTab('balances')}>
                    <span className={getIconClass('balances')}>balance</span>
                    <p className={getTextClass('balances')}>Balances</p>
                </div>
                <div className={getTabClass('graph', 'neo-green')} onClick={() => setActiveTab('graph')}>
                    <span className={getIconClass('graph')}>hub</span>
                    <p className={getTextClass('graph')}>Graph</p>
                </div>
                <div className={getTabClass('analytics', 'neo-blue')} onClick={() => setActiveTab('analytics')}>
                    <span className={getIconClass('analytics')}>pie_chart</span>
                    <p className={getTextClass('analytics')}>Analytics</p>
                </div>
            </div>

            {/* Add Member Modal */}
            {showAddMember && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white brutalist-border shadow-neo-8 p-6 w-full max-w-sm">
                        <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-2">
                            <h2 className="font-display text-2xl text-black uppercase">ADD MEMBER</h2>
                            <button onClick={() => { setShowAddMember(false); setMemberEmail(''); }}>
                                <span className="material-symbols-outlined font-bold text-black">close</span>
                            </button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                await api.post(`/groups/${id}/members`, { email: memberEmail });
                                toast.success(`Member added!`);
                                setShowAddMember(false);
                                setMemberEmail('');
                                fetchData();
                            } catch (error) {
                                toast.error(error.response?.data?.message || 'Failed to add member');
                            }
                        }} className="space-y-4">
                            <div className="space-y-1">
                                <label className="font-mono font-bold text-xs uppercase text-black">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full bg-background-light brutalist-border p-3 text-black font-mono focus:bg-neo-blue focus:text-white focus:outline-none transition-colors"
                                    placeholder="friend@example.com"
                                    value={memberEmail}
                                    onChange={e => setMemberEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <p className="font-mono text-[10px] text-gray-500 uppercase font-bold">
                                The user must already have a SplitSquad account.
                            </p>
                            <button type="submit" className="w-full mt-4 bg-toxic-green brutalist-border py-4 font-display text-xl text-black shadow-neo-bottom active:translate-y-1 active:shadow-none transition-all uppercase">
                                INVITE
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default GroupDetail;
