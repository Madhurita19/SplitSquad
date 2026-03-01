import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (searchParams.get('expired') === '1') {
            toast.error('Session expired. Please log in again.', { id: 'session-expired', duration: 5000 });
            // Clean up URL
            window.history.replaceState({}, '', '/login');
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="font-body text-white min-h-screen p-4 flex flex-col items-center justify-center pt-10">
            <div className="w-full max-w-sm space-y-6">

                {/* Branding Header */}
                <div className="bg-electric-blue brutalist-border p-6 shadow-neo-4 text-center transform -rotate-2">
                    <h1 className="font-display text-5xl text-black uppercase leading-none tracking-tighter">
                        SPLIT<br />SQUAD
                    </h1>
                    <div className="mt-2 bg-black text-white px-2 py-1 font-mono text-xs uppercase font-bold inline-block border-2 border-white">
                        V1.0 ALPHA
                    </div>
                </div>

                {/* Login Form Panel */}
                <div className="bg-white brutalist-border shadow-neo-8 p-6 relative">
                    <div className="absolute -top-3 left-4 bg-neon-yellow px-2 py-1 brutalist-border font-black text-black uppercase text-sm shadow-neo-4">
                        ENTER
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                        <div className="space-y-1">
                            <label className="font-mono font-bold text-xs uppercase text-black">Email</label>
                            <input
                                type="email"
                                className="w-full bg-background-light brutalist-border p-3 text-black font-mono focus:bg-neo-blue focus:outline-none transition-colors shadow-neo-4"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="font-mono font-bold text-xs uppercase text-black">Password</label>
                            <input
                                type="password"
                                className="w-full bg-background-light brutalist-border p-3 text-black font-mono focus:bg-hot-pink focus:text-white focus:outline-none transition-colors shadow-neo-4"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" disabled={submitting} className="w-full mt-6 bg-toxic-green brutalist-border py-4 font-display text-2xl text-black shadow-neo-bottom hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-4 active:translate-y-2 active:shadow-none transition-all uppercase disabled:opacity-50 disabled:translate-y-1 disabled:shadow-none">
                            {submitting ? 'SIGNING IN...' : 'SIGN IN'}
                        </button>
                    </form>

                    <div className="mt-6 pt-4 border-t-4 border-black text-center font-mono">
                        <span className="text-black text-xs font-bold uppercase">NO ACCOUNT? </span>
                        <Link to="/register" className="text-electric-blue text-xs font-black hover:text-hot-pink hover:underline uppercase transition-colors">
                            CREATE ONE
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;
