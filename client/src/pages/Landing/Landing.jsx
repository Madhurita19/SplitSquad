import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
    // Dynamic subheadline logic to make it engaging
    const words = ['awkward', 'drama', 'math', 'arguments'];
    const [wordIndex, setWordIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setWordIndex((prev) => (prev + 1) % words.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-background-light text-slate-900 antialiased overflow-x-hidden font-body min-h-screen">
            {/* Top Navigation */}
            <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-background-light border-b-4 border-black">
                <div className="flex items-center gap-2">
                    <div className="bg-toxic-green p-1 brutalist-border flex items-center justify-center">
                        <span className="material-symbols-outlined text-black font-bold">payments</span>
                    </div>
                    <h1 className="font-display text-2xl font-black tracking-tighter uppercase italic">SplitSquad</h1>
                </div>
                <Link to="/login" className="bg-white brutalist-border shadow-neo-4 px-6 py-2 font-display font-black text-sm uppercase hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                    Login
                </Link>
            </nav>

            {/* Hero Section */}
            <header className="px-6 py-16 flex flex-col xl:flex-row gap-16 xl:gap-8 items-center bg-background-light min-h-[80vh] border-b-4 border-black">
                {/* Hero Text */}
                <div className="flex-1 flex flex-col gap-8 w-full">
                    <div className="relative">
                        <div className="absolute -top-4 -left-2 w-24 h-24 bg-electric-blue/20 rounded-full blur-2xl"></div>
                        <h2 className="font-display text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter uppercase relative z-10 text-black pt-4">
                            Split bills. <br className="hidden md:block" />
                            Skip the <br />
                            <span className="bg-toxic-green text-black px-2 mt-2 inline-block transition-all duration-300">
                                {words[wordIndex]}
                            </span>
                        </h2>
                    </div>
                    <p className="font-mono text-xl font-bold leading-tight max-w-[90%] md:max-w-[70%] border-l-4 border-black pl-4 text-black/80">
                        Stop the "who owes who" headache. SplitSquad simplifies complex debts into one single move so you get paid back instantly via UPI.
                    </p>
                    <div className="relative group mt-4 md:w-2/3">
                        <Link to="/register" className="block text-center w-full bg-neon-yellow brutalist-border shadow-neo-8 py-5 font-display text-xl font-black uppercase tracking-widest text-black hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all">
                            Start Splitting Now
                        </Link>
                    </div>
                </div>

                {/* Debt Loop Visual Graphic */}
                <div className="flex-1 w-full max-w-[500px] flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-hot-pink/10 rounded-full blur-3xl"></div>
                    <div className="relative w-full aspect-square max-w-[400px] flex items-center justify-center z-10 scale-90 md:scale-100">
                        {/* Central SVG Arrows */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
                            <defs>
                                <marker id="arrowhead" markerHeight="7" markerWidth="10" orient="auto" refX="9" refY="3.5">
                                    <polygon fill="black" points="0 0, 10 3.5, 0 7"></polygon>
                                </marker>
                            </defs>
                            {/* Arrow A to B */}
                            <path d="M 220,110 Q 280,120 290,190" fill="none" markerEnd="url(#arrowhead)" stroke="black" strokeWidth="4"></path>
                            {/* Arrow B to C */}
                            <path d="M 270,300 Q 200,340 130,300" fill="none" markerEnd="url(#arrowhead)" stroke="black" strokeWidth="4"></path>
                            {/* Arrow C to A */}
                            <path d="M 110,190 Q 120,120 180,110" fill="none" markerEnd="url(#arrowhead)" stroke="black" strokeWidth="4"></path>
                        </svg>

                        {/* Person A (Top) */}
                        <div className="absolute top-0 flex flex-col items-center">
                            {/* Thought Bubble A */}
                            <div className="relative mb-2 animate-bounce flex flex-col items-center" style={{ animationDelay: '0s', animationDuration: '3s' }}>
                                <div className="absolute inset-0 bg-black translate-x-1 translate-y-1"></div>
                                <div className="bg-hot-pink border-2 border-black p-3 relative" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 65% 75%, 50% 100%, 35% 75%, 0% 75%)' }}>
                                    <p className="font-bold font-mono text-xs uppercase text-white whitespace-nowrap">Waiting on C...</p>
                                </div>
                            </div>
                            {/* Character Avatar A */}
                            <div className="w-20 h-20 rounded-full bg-white border-4 border-black shadow-neo-4 flex items-center justify-center overflow-hidden">
                                <img alt="Character A" className="w-full h-full object-cover" src="/avatar-a.png" />
                            </div>
                            <div className="bg-black text-white font-mono font-bold px-2 py-0.5 mt-2 text-xs">USER A</div>
                        </div>

                        {/* Person B (Bottom Right) */}
                        <div className="absolute bottom-10 right-0 flex flex-col items-center">
                            {/* Thought Bubble B */}
                            <div className="relative mb-2 animate-bounce flex flex-col items-center" style={{ animationDelay: '1s', animationDuration: '3s' }}>
                                <div className="absolute inset-0 bg-black translate-x-1 translate-y-1"></div>
                                <div className="bg-toxic-green border-2 border-black p-3 relative" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 65% 75%, 50% 100%, 35% 75%, 0% 75%)' }}>
                                    <p className="font-bold font-mono text-xs uppercase text-black whitespace-nowrap">Waiting on A...</p>
                                </div>
                            </div>
                            {/* Character Avatar B */}
                            <div className="w-20 h-20 rounded-full bg-white border-4 border-black shadow-neo-4 flex items-center justify-center overflow-hidden">
                                <img alt="Character B" className="w-full h-full object-cover" src="/avatar-b.png" />
                            </div>
                            <div className="bg-black text-white font-mono font-bold px-2 py-0.5 mt-2 text-xs">USER B</div>
                        </div>

                        {/* Person C (Bottom Left) */}
                        <div className="absolute bottom-10 left-0 flex flex-col items-center">
                            {/* Thought Bubble C */}
                            <div className="relative mb-2 animate-bounce flex flex-col items-center" style={{ animationDelay: '2s', animationDuration: '3s' }}>
                                <div className="absolute inset-0 bg-black translate-x-1 translate-y-1"></div>
                                <div className="bg-electric-blue border-2 border-black p-3 relative" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 65% 75%, 50% 100%, 35% 75%, 0% 75%)' }}>
                                    <p className="font-bold font-mono text-xs uppercase text-white whitespace-nowrap">Waiting on B...</p>
                                </div>
                            </div>
                            {/* Character Avatar C */}
                            <div className="w-20 h-20 rounded-full bg-white border-4 border-black shadow-neo-4 flex items-center justify-center overflow-hidden">
                                <img alt="Character C" className="w-full h-full object-cover" src="/avatar-c.png" />
                            </div>
                            <div className="bg-black text-white font-mono font-bold px-2 py-0.5 mt-2 text-xs">USER C</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Traditional vs SplitSquad Section */}
            <section className="px-6 py-20 bg-white border-b-4 border-black">
                <div className="max-w-5xl mx-auto">
                    <h3 className="font-display text-4xl md:text-6xl font-black uppercase text-center mb-16 tracking-tighter">
                        Why choose <span className="text-electric-blue italic">SplitSquad?</span>
                    </h3>

                    <div className="grid md:grid-cols-2 gap-0 border-4 border-black shadow-neo-8 overflow-hidden">
                        {/* Traditional */}
                        <div className="p-8 border-b-4 md:border-b-0 md:border-r-4 border-black bg-gray-50">
                            <h4 className="font-display text-2xl font-black uppercase mb-6 text-gray-500 line-through">Traditional Splitting</h4>
                            <ul className="space-y-4 font-mono font-bold text-sm">
                                <li className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-red-500">close</span>
                                    MANUAL CALCULATIONS IN NOTES
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-red-500">close</span>
                                    AWKWARD "WHO OWES WHO" TEXTS
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-red-500">close</span>
                                    10 SEPARATE BANK TRANSFERS
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-red-500">close</span>
                                    HUNTING FOR UPI IDS & HANDLES
                                </li>
                            </ul>
                        </div>

                        {/* SplitSquad */}
                        <div className="p-8 bg-neon-yellow">
                            <h4 className="font-display text-2xl font-black uppercase mb-6 text-black">The SplitSquad Way</h4>
                            <ul className="space-y-4 font-mono font-bold text-sm">
                                <li className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-toxic-green bg-black rounded-full">check</span>
                                    AUTO-OPTIMIZED SETTLEMENTS
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-toxic-green bg-black rounded-full">check</span>
                                    REAL-TIME GROUP NOTIFICATIONS
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-toxic-green bg-black rounded-full">check</span>
                                    ONE-CLICK UPI QR SCAN
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-toxic-green bg-black rounded-full">check</span>
                                    ZERO MATH. ZERO DRAMA.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="px-6 py-16 bg-background-light border-b-4 border-black">
                <h3 className="font-display text-4xl font-black uppercase italic mb-8 underline decoration-toxic-green decoration-4 underline-offset-8 text-center">Your 3-Step Success Plan</h3>
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Step 1 */}
                    <div className="flex-1 bg-hot-pink brutalist-border shadow-neo-4 p-6 flex flex-col gap-4 transform -rotate-1 hover:rotate-0 transition-transform">
                        <div className="flex justify-between items-start">
                            <span className="bg-black text-white font-mono px-3 py-1 font-bold text-xs uppercase brutalist-border border-white">Step 01</span>
                            <span className="material-symbols-outlined text-5xl text-black">group_add</span>
                        </div>
                        <h4 className="font-display text-3xl font-black uppercase text-white mt-4">Create Squad</h4>
                        <p className="font-mono text-lg font-bold text-black/90">Start a group for your trip, house, or dinner. It's ready in 10 seconds.</p>
                    </div>

                    {/* Step 2 */}
                    <div className="flex-1 bg-electric-blue brutalist-border shadow-neo-4 p-6 flex flex-col gap-4 transform md:rotate-1 hover:rotate-0 transition-transform">
                        <div className="flex justify-between items-start">
                            <span className="bg-black text-white font-mono px-3 py-1 font-bold text-xs uppercase brutalist-border border-white">Step 02</span>
                            <span className="material-symbols-outlined text-5xl text-white">share</span>
                        </div>
                        <h4 className="font-display text-3xl font-black uppercase text-white mt-4">Add the Crew</h4>
                        <p className="font-mono text-lg font-bold text-white/90">Send your squad an invite link. They join with one click. No long forms.</p>
                    </div>

                    {/* Step 3 */}
                    <div className="flex-1 bg-toxic-green brutalist-border shadow-neo-4 p-6 flex flex-col gap-4 transform -rotate-1 hover:rotate-0 transition-transform">
                        <div className="flex justify-between items-start">
                            <span className="bg-black text-white font-mono px-3 py-1 font-bold text-xs uppercase brutalist-border border-white">Step 03</span>
                            <span className="material-symbols-outlined text-5xl text-black">settings_suggest</span>
                        </div>
                        <h4 className="font-display text-3xl font-black uppercase text-black mt-4">Settle Up</h4>
                        <p className="font-mono text-lg font-bold text-black/80">Log expenses and scan the QR to pay. Let our engine handle the math.</p>
                    </div>
                </div>
            </section>

            {/* Visual Debt Engine Feature */}
            <section className="px-6 py-16 bg-background-light border-b-4 border-black bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                <div className="flex items-center gap-2 mb-8">
                    <span className="bg-black text-white px-3 py-1 font-display font-black text-sm uppercase">The Tech</span>
                    <h3 className="font-display text-3xl md:text-5xl font-black uppercase italic">"The Magic Settle-Up"</h3>
                </div>

                <div className="brutalist-border border-black p-6 md:p-12 bg-white shadow-neo-8 relative md:w-3/4 mx-auto">
                    <div className="mb-12">
                        <h4 className="font-mono text-sm font-bold uppercase mb-8 opacity-60 text-center">Why Everyone is Confused:</h4>

                        <div className="relative h-64 md:h-80 flex items-center justify-center max-w-lg mx-auto">
                            {/* Avatars */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-16 h-16 md:w-20 md:h-20 rounded-full bg-electric-blue brutalist-border flex items-center justify-center text-white font-black text-2xl md:text-3xl shadow-neo-4">A</div>
                            <div className="absolute bottom-0 left-4 md:left-12 z-10 w-16 h-16 md:w-20 md:h-20 rounded-full bg-hot-pink brutalist-border flex items-center justify-center text-white font-black text-2xl md:text-3xl shadow-neo-4">B</div>
                            <div className="absolute bottom-0 right-4 md:right-12 z-10 w-16 h-16 md:w-20 md:h-20 rounded-full bg-neon-yellow brutalist-border flex items-center justify-center text-black font-black text-2xl md:text-3xl shadow-neo-4">C</div>

                            {/* Lines/Pointers (SVG) */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 400 320" preserveAspectRatio="none">
                                <defs>
                                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                        <polygon fill="black" points="0 0, 10 3.5, 0 7" />
                                    </marker>
                                </defs>
                                {/* A -> B Arrow */}
                                <path d="M 180,80 Q 120,150 100,240" fill="none" stroke="black" strokeWidth="4" markerEnd="url(#arrowhead)" />
                                {/* C -> A Arrow */}
                                <path d="M 300,240 Q 280,150 220,80" fill="none" stroke="black" strokeWidth="4" markerEnd="url(#arrowhead)" />
                            </svg>

                            {/* Pointer Labels */}
                            <div className="absolute left-1/4 top-1/2 -translate-y-4 -translate-x-8 z-20">
                                <div className="bg-hot-pink text-white font-black px-3 py-1 md:py-2 text-xs md:text-sm brutalist-border shadow-neo-4 transform -rotate-12">A owes B 500</div>
                            </div>
                            <div className="absolute right-1/4 top-1/2 -translate-y-4 translate-x-8 z-20">
                                <div className="bg-electric-blue text-white font-black px-3 py-1 md:py-2 text-xs md:text-sm brutalist-border shadow-neo-4 transform rotate-12">C owes A 500</div>
                            </div>
                        </div>
                    </div>

                    <div className="my-12 flex flex-col items-center relative z-20">
                        <div className="bg-black text-white px-6 py-3 font-display font-black uppercase tracking-widest flex items-center gap-3 animate-pulse shadow-neo-4">
                            <span className="material-symbols-outlined">settings_suggest</span>
                            Our engine merging debts
                        </div>
                        <div className="h-12 border-l-4 border-black border-dashed"></div>
                    </div>

                    <div className="bg-toxic-green brutalist-border border-black p-8 flex flex-col items-center text-center shadow-neo-4 relative z-20">
                        <h4 className="font-mono text-sm font-bold uppercase mb-4 opacity-80">The Result:</h4>
                        <div className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 text-black">C pays B 500</div>
                        <p className="font-mono text-sm md:text-base font-bold uppercase border-t-2 border-black pt-2">One simple QR scan settles the whole group.</p>
                    </div>
                </div>
            </section>

            {/* Bottom Final CTA */}
            <section className="px-6 py-20 bg-electric-blue border-b-4 border-black text-center flex flex-col items-center gap-8">
                <h2 className="font-display text-5xl md:text-7xl font-black uppercase text-white tracking-tighter transform -rotate-2">Stop the awkward.<br />Start the splitting.</h2>
                <Link to="/register" className="inline-block bg-neon-yellow brutalist-border shadow-neo-8 py-5 px-12 font-display text-2xl font-black uppercase tracking-widest text-black hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all transform rotate-1">
                    Create Your First Squad
                </Link>
            </section>

            {/* Social Proof / Footer */}
            <footer className="px-6 py-12 bg-background-light">
                <div className="flex flex-col gap-8 flex-wrap">
                    <div className="flex flex-wrap gap-3">
                        <span className="bg-neon-yellow brutalist-border px-4 py-2 font-mono font-bold text-xs uppercase text-black">#GenZApproved</span>
                        <span className="bg-hot-pink brutalist-border px-4 py-2 font-mono font-bold text-xs uppercase text-white">#NoMoreDrama</span>
                        <span className="bg-electric-blue brutalist-border px-4 py-2 font-mono font-bold text-xs uppercase text-white">#SplitTheBill</span>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div className="flex flex-col gap-2">
                            <h5 className="font-display font-black uppercase italic text-3xl">SplitSquad</h5>
                            <p className="font-mono text-xs font-bold uppercase opacity-60">© Created by Madhurita Mukherjee</p>
                        </div>
                        <div className="flex gap-4">
                            <Link to="/login" className="font-mono text-sm font-bold uppercase hover:text-hot-pink transition-colors">Login</Link>
                            <Link to="/register" className="font-mono text-sm font-bold uppercase hover:text-electric-blue transition-colors">Sign Up</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;

