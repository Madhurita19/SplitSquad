import { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

const SESSION_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

const isSessionExpired = () => {
    const loginTimestamp = localStorage.getItem('loginTimestamp');
    if (!loginTimestamp) return true;
    return Date.now() - Number(loginTimestamp) > SESSION_MAX_AGE_MS;
};

const clearSession = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('loginTimestamp');
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser && !isSessionExpired()) {
            setUser(JSON.parse(storedUser));
        } else {
            // Session expired or no user — clean up
            clearSession();
        }
        setLoading(false);
    }, []);

    // Periodic check: auto-logout if session expires while the tab is open
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => {
            if (isSessionExpired()) {
                clearSession();
                setUser(null);
                window.location.href = '/login?expired=1';
            }
        }, 60 * 1000); // Check every 60 seconds
        return () => clearInterval(interval);
    }, [user]);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        localStorage.setItem('loginTimestamp', String(Date.now()));
        return data;
    };

    const register = async (name, email, password) => {
        const { data } = await api.post('/auth/register', { name, email, password });
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        localStorage.setItem('loginTimestamp', String(Date.now()));
        return data;
    };

    const updateProfile = async (profileData) => {
        const { data } = await api.put('/auth/profile', profileData);
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        return data;
    };

    const logout = () => {
        setUser(null);
        clearSession();
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, updateProfile, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
