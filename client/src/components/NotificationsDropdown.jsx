import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const NotificationsDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Check for notifications periodically
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read');
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleNotificationClick = async (notif) => {
        setIsOpen(false);
        if (!notif.isRead) {
            try {
                await api.put(`/notifications/${notif._id}/read`);
                setNotifications(notifications.map(n =>
                    n._id === notif._id ? { ...n, isRead: true } : n
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        }

        if (notif.group) {
            navigate(`/group/${notif.group._id || notif.group}`);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative size-10 bg-white brutalist-border flex items-center justify-center text-black active:translate-y-1 active:shadow-none transition-all"
                title="Notifications"
            >
                <span className="material-symbols-outlined font-bold text-[22px]">notifications</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-neo-pink text-white text-[10px] font-black font-mono w-5 h-5 flex items-center justify-center brutalist-border">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-[80vh] bg-black border-4 border-black shadow-[8px_8px_0px_0px_#25aff4] z-50 flex flex-col">
                    <div className="p-3 border-b-4 border-black bg-toxic-green flex justify-between items-center sticky top-0 z-10">
                        <h3 className="font-display font-black text-xl uppercase leading-none text-black tracking-widest">ACTIVITY</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-[10px] bg-black text-white px-2 py-1 font-mono font-bold uppercase hover:bg-hot-pink transition-colors border-2 border-transparent hover:border-black"
                            >
                                MARK ALL READ
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-white/20 mb-2">notifications_off</span>
                                <div className="font-mono text-sm font-bold text-white uppercase tracking-widest">NO ACTIVITY YET.</div>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {notifications.map(notif => (
                                    <div
                                        key={notif._id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-3 border-b-2 border-white/10 cursor-pointer transition-colors ${!notif.isRead ? 'bg-[#1a1a1a] hover:bg-[#2a2a2a]' : 'bg-black hover:bg-white/5'} last:border-b-0`}
                                    >
                                        <div className="flex justify-between items-start gap-3 mb-1">
                                            <div className={`font-mono text-xs leading-tight pr-2 ${!notif.isRead ? 'font-black text-white' : 'font-medium text-white/50'}`}>
                                                {notif.message}
                                            </div>
                                            {!notif.isRead && (
                                                <div className="w-3 h-3 rounded-full bg-neo-pink flex-shrink-0 mt-0.5 border border-black shadow-[2px_2px_0px_#000]"></div>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center mt-2 text-[10px] font-bold font-mono text-neon-yellow uppercase tracking-wider">
                                            <span className="bg-white/10 px-1.5 py-0.5">{notif.group?.name || 'SQUAD'}</span>
                                            <span className="text-white/30">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationsDropdown;
