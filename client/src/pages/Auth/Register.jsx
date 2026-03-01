import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await register(name, email, password);
            toast.success('Account created successfully!');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="font-body text-white min-h-screen p-4 flex flex-col items-center justify-center pt-8 pb-16">
            <div className="w-full max-w-sm space-y-6">

                {/* Branding Header */}
                <div className="bg-hot-pink brutalist-border p-6 shadow-neo-4 text-center transform rotate-2">
                    <h1 className="font-display text-5xl text-black uppercase leading-none tracking-tighter">
                        JOIN<br />THE GRID
                    </h1>
                </div>

                {/* Setup Form Panel */}
                <div className="bg-white brutalist-border shadow-neo-8 p-6 relative">
                    <div className="absolute -top-3 -right-2 bg-toxic-green px-2 py-1 brutalist-border font-black text-black uppercase text-sm shadow-neo-4">
                        NEW RECRUIT
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div className="space-y-1">
                            <label className="font-mono font-bold text-xs uppercase text-black">Handle (Name)</label>
                            <input
                                type="text"
                                className="w-full bg-background-light brutalist-border p-3 text-black font-mono focus:bg-neon-yellow focus:outline-none transition-colors shadow-neo-4"
                                placeholder="Neo"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="font-mono font-bold text-xs uppercase text-black">Secure Comms (Email)</label>
                            <input
                                type="email"
                                className="w-full bg-background-light brutalist-border p-3 text-black font-mono focus:bg-neo-blue focus:outline-none transition-colors shadow-neo-4"
                                placeholder="neo@matrix.org"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="font-mono font-bold text-xs uppercase text-black">Access Code (Pass)</label>
                            <input
                                type="password"
                                className="w-full bg-background-light brutalist-border p-3 text-black font-mono focus:bg-electric-blue focus:text-white focus:outline-none transition-colors shadow-neo-4"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength="6"
                            />
                        </div>

                        <button type="submit" disabled={submitting} className="w-full mt-6 bg-electric-blue brutalist-border py-4 font-display text-xl text-white shadow-neo-bottom hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-4 active:translate-y-2 active:shadow-none transition-all uppercase disabled:opacity-50 disabled:translate-y-1 disabled:shadow-none">
                            {submitting ? 'CREATING ACCOUNT...' : 'INITIALIZE'}
                        </button>
                    </form>

                    <div className="mt-6 pt-4 border-t-4 border-black text-center font-mono">
                        <span className="text-black text-xs font-bold uppercase">ALREADY ENROLLED? </span>
                        <Link to="/login" className="text-hot-pink text-xs font-black hover:text-black hover:underline uppercase transition-colors">
                            SIGN IN
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Register;
