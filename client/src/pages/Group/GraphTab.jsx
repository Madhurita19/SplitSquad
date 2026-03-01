import { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { formatCurrency } from '../../utils/currency';

const GraphTab = ({ group, debts, rawDebts }) => {
    const containerRef = useRef();
    const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: 500
            });
        }
    }, []);

    const neoColors = ["#FF007A", "#00F0FF", "#0DF20D", "#F0FF00", "#FF00F5"];

    const generateGraphData = (debtList) => {
        const nodesMap = {};

        group.members.forEach((m, idx) => {
            nodesMap[m._id] = {
                id: m._id,
                name: m.name,
                initials: m.name.substring(0, 2).toUpperCase(),
                val: 25,
                color: neoColors[idx % neoColors.length]
            };
        });

        const links = debtList.map(d => ({
            source: d.from._id || d.from,
            target: d.to._id || d.to,
            amount: d.amount,
            name: formatCurrency(d.amount, false, group.baseCurrency)
        }));

        const nodes = Object.values(nodesMap);
        return { nodes, links };
    };

    const graphData = generateGraphData(debts);

    return (
        <div className="flex flex-col h-full relative grid-pattern min-h-[70vh]">
            <div className="flex justify-between items-center mb-4 bg-background-light dark:bg-background-dark border-4 border-black p-4 shadow-brutal z-10 mx-[-1rem] mt-[-1rem] sticky top-0">
                <h3 className="font-display text-2xl uppercase tracking-tighter text-black dark:text-white italic">VISUAL DEBT ENGINE</h3>
            </div>

            <div
                ref={containerRef}
                className="w-full flex-1 relative z-0 border-4 border-black bg-background-light dark:bg-background-dark shadow-brutal overflow-hidden"
                style={{ height: '500px' }}
            >
                {debts.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-black dark:text-white font-mono font-bold uppercase z-10">
                        NO DEBTS DETECTED.
                    </div>
                ) : (
                    <ForceGraph2D
                        width={dimensions.width}
                        height={dimensions.height}
                        graphData={graphData}
                        nodeLabel="name"
                        nodeColor="color"
                        nodeRelSize={8}
                        linkDirectionalArrowLength={6}
                        linkDirectionalArrowRelPos={1}
                        linkWidth={link => Math.max(2, Math.log10(link.amount) * 3)}
                        linkLabel="name"
                        linkColor={() => '#000000'} // Solid black lines for brutalism
                        linkDirectionalParticles={3}
                        linkDirectionalParticleSpeed={d => 0.005}
                        linkDirectionalParticleColor={() => '#FF007A'}
                        backgroundColor="rgba(245, 248, 245, 0.9)" // Matches background-light with insight
                        d3VelocityDecay={0.4}
                        nodeCanvasObject={(node, ctx, globalScale) => {
                            const label = node.initials;
                            const fontSize = 12 / globalScale;
                            ctx.font = `900 ${fontSize}px "Space Grotesk"`;

                            // Draw circle with thick border
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI, false);
                            ctx.fillStyle = node.color;
                            ctx.fill();
                            ctx.lineWidth = 2 / globalScale;
                            ctx.strokeStyle = '#000000';
                            ctx.stroke();

                            // Draw text
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillStyle = '#000000';
                            ctx.fillText(label, node.x, node.y);
                        }}
                    />
                )}
            </div>

            {/* Bento Floating Insight Card */}
            <div className="mt-6 z-10 w-full mb-8">
                <div className="bg-background-light dark:bg-background-dark border-4 border-black p-4 shadow-brutal-lg flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="bg-black text-neo-pink text-[10px] font-black px-2 py-0.5 w-fit uppercase italic tracking-widest">Stark Insight</span>
                        <p className="text-black dark:text-white text-xl font-black font-mono leading-none">
                            MIN-FLOW ALGO ACTIVE
                        </p>
                        <p className="text-slate-500 font-mono text-xs font-bold mt-1">
                            Calculated {debts.length} optimal settlements for {group.members.length} members.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-neo-green border-l-4 border-black -my-4 -mr-4 p-4 h-[110px]">
                        <span className="text-black font-black text-xs uppercase font-mono leading-none [writing-mode:vertical-rl] rotate-180">Simplified</span>
                        <div className="w-10 h-8 bg-black p-1 flex items-center justify-center">
                            <span className="material-symbols-outlined text-neo-green">bolt</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GraphTab;
