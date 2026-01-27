"use client";

import { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface FloorItem {
    id: string;
    type?: string;
    typeId?: string;
    label: string;
    x: number;
    y: number;
    width?: number; // fallback
    length?: number; // fallback
    rotation: number;
    shape?: string;
    color?: string;
}

export default function PublicFloorPlanViewer({ plan }: { plan: any }) {
    const [zoom, setZoom] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(plan.width || 40);
    const [length, setLength] = useState(plan.length || 60);
    const items: FloorItem[] = Array.isArray(plan.data) ? plan.data : [];

    const handleFitToScreen = () => {
        if (!containerRef.current) return;
        const { clientWidth, clientHeight } = containerRef.current;
        const padding = 60;
        const availableW = clientWidth - padding;
        const availableH = clientHeight - padding;

        const scaleW = availableW / (width * 10);
        const scaleH = availableH / (length * 10);

        setZoom(Math.max(0.2, Math.min(scaleW, scaleH, 1.5)));
    };

    useEffect(() => {
        setTimeout(handleFitToScreen, 100);
    }, []);

    return (
        <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden">
            <div className="h-14 bg-white border-b flex items-center px-6 justify-between shrink-0 shadow-sm z-10">
                <h1 className="font-bold text-lg text-slate-800">{plan.name}</h1>
                <div className="text-sm text-slate-500">Read Only View</div>
            </div>

            <div className="flex-1 relative overflow-hidden flex flex-col">
                <div ref={containerRef} className="flex-1 relative overflow-auto flex items-center justify-center p-8">
                    <div
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.1s ease-out'
                        }}
                    >
                        <div
                            className="bg-white shadow-2xl relative"
                            style={{
                                width: width * 10,
                                height: length * 10,
                                backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px), radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
                                backgroundSize: '20px 20px',
                                backgroundPosition: '0 0, 10px 10px',
                            }}
                        >
                            {/* Rulers */}
                            <div className="absolute -top-6 left-0 w-full h-6 border-b border-slate-300 flex text-[10px] text-slate-400 font-mono">
                                <span className="absolute left-0">0</span>
                                <span className="absolute left-1/2 -translate-x-1/2">{width} ft</span>
                                <span className="absolute right-0">{width}</span>
                            </div>
                            <div className="absolute -left-6 top-0 h-full w-6 border-r border-slate-300 flex flex-col text-[10px] text-slate-400 font-mono">
                                <span className="absolute top-0 right-1">0</span>
                                <span className="absolute top-1/2 right-1 -translate-y-1/2 vertical-text">{length} ft</span>
                                <span className="absolute bottom-0 right-1">{length}</span>
                            </div>

                            {items.map(item => (
                                <div
                                    key={item.id}
                                    className={`
                                        flex items-center justify-center p-1 text-[10px] font-bold select-none overflow-hidden
                                        ${item.color || 'bg-slate-200'} 
                                        ${item.shape === 'circle' ? 'rounded-full' : 'rounded-[2px]'}
                                        border border-black/10 shadow-sm
                                    `}
                                    style={{
                                        left: item.x,
                                        top: item.y,
                                        width: item.rotation % 180 === 0 ? item.width! * 10 : item.length! * 10,
                                        height: item.rotation % 180 === 0 ? item.length! * 10 : item.width! * 10,
                                        position: 'absolute',
                                    }}
                                >
                                    <span className="pointer-events-none text-slate-700/90 leading-[1.1] text-center break-words w-full">
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-6 left-6 z-30 flex gap-2 bg-white items-center border rounded-lg shadow px-2 py-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
                    <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom(z => Math.min(3, z + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
                    <Separator orientation="vertical" className="h-4" />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleFitToScreen} title="Fit to Screen"><Maximize className="h-4 w-4" /></Button>
                </div>
            </div>
        </div>
    );
}
