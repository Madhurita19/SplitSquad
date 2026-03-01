import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const JoinGroup = () => {
    const { inviteCode } = useParams();
    const { user, loading: authLoading } = useContext(AuthContext);
    const navigate = useNavigate();
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) return;

        const fetchPreview = async () => {
            try {
                const { data } = await api.get(`/groups/invite/${inviteCode}`);
                setPreview(data);
                if (data.alreadyMember) {
                    toast.success("You're already in this squad!");
                    navigate(`/group/${data._id}`);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Invalid invite link');
            } finally {
                setLoading(false);
            }
        };
        fetchPreview();
    }, [inviteCode, user, authLoading]);

    const handleJoin = async () => {
        setJoining(true);
        try {
            const { data } = await api.post(`/groups/join/${inviteCode}`);
            toast.success('You joined the squad!');
            navigate(`/group/${data.groupId}`);
        } catch (err) {
            if (err.response?.data?.groupId) {
                navigate(`/group/${err.response.data.groupId}`);
            }
            toast.error(err.response?.data?.message || 'Failed to join');
        } finally {
            setJoining(false);
        }
    };

    const categoryIcons = { trip: 'beach_access', flat: 'cottage', event: 'celebration', other: 'group' };

    if (authLoading || loading) {
        return (
            <div className="font-body text-white min-h-screen p-4 flex items-center justify-center">
                <div className="bg-white brutalist-border shadow-neo-8 p-8 text-center">
                    <p className="font-mono font-bold text-black uppercase animate-pulse">LOADING INVITE...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="font-body text-white min-h-screen p-4 flex items-center justify-center">
                <div className="w-full max-w-sm space-y-4">
                    <div className="bg-neo-pink brutalist-border shadow-neo-8 p-8 text-center space-y-4">
                        <span className="material-symbols-outlined text-5xl text-white">link_off</span>
                        <h2 className="font-display text-3xl text-white uppercase">INVALID INVITE</h2>
                        <p className="font-mono text-xs font-bold text-white/70 uppercase">{error}</p>
                    </div>
                    <Link to="/" className="block w-full bg-toxic-green brutalist-border py-4 font-display text-xl text-black shadow-neo-bottom active:translate-y-1 active:shadow-none transition-all uppercase text-center">
                        GO TO DASHBOARD
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="font-body text-white min-h-screen p-4 flex items-center justify-center">
            <div className="w-full max-w-sm space-y-4">
                {/* Invite Card */}
                <div className="bg-white brutalist-border shadow-neo-8 p-6 space-y-5">
                    <div className="bg-electric-blue brutalist-border p-4 text-center">
                        <span className="font-mono text-[10px] font-bold text-white/70 uppercase">YOU'VE BEEN INVITED TO</span>
                    </div>

                    <div className="text-center space-y-3">
                        <div className="bg-neon-yellow brutalist-border p-3 inline-block mx-auto">
                            <span className="material-symbols-outlined text-4xl text-black font-black">
                                {categoryIcons[preview?.category] || 'group'}
                            </span>
                        </div>
                        <h1 className="font-display text-4xl text-black uppercase leading-tight">{preview?.name}</h1>
                        {preview?.description && (
                            <p className="font-mono text-xs font-bold text-black/50 uppercase">{preview.description}</p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1 bg-background-light brutalist-border p-3 text-center">
                            <p className="font-mono text-[10px] font-bold text-black/50 uppercase">MEMBERS</p>
                            <p className="font-display text-2xl text-black">{preview?.memberCount}</p>
                        </div>
                        <div className="flex-1 bg-background-light brutalist-border p-3 text-center">
                            <p className="font-mono text-[10px] font-bold text-black/50 uppercase">CREATED BY</p>
                            <p className="font-display text-lg text-black uppercase leading-tight">{preview?.createdBy}</p>
                        </div>
                    </div>
                </div>

                {/* Join Button */}
                <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="w-full bg-toxic-green brutalist-border py-4 font-display text-2xl text-black shadow-neo-bottom active:translate-y-1 active:shadow-none transition-all uppercase flex items-center justify-center gap-2 disabled:opacity-50 disabled:translate-y-1 disabled:shadow-none"
                >
                    <span className="material-symbols-outlined text-black font-black">group_add</span>
                    {joining ? 'JOINING...' : 'JOIN SQUAD'}
                </button>

                <Link to="/" className="block w-full bg-white brutalist-border py-3 font-display text-sm text-black shadow-neo-4 active:translate-y-1 active:shadow-none transition-all uppercase text-center">
                    CANCEL
                </Link>
            </div>
        </div>
    );
};

export default JoinGroup;
