"use client";

import { useState, useEffect, useRef } from "react";
import {
    DndContext,
    useDraggable,
    useDroppable,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Save, Trash, Plus, LayoutGrid, RotateCw, Grid3X3, Maximize,
    Box, AlertTriangle, FolderOpen, Share2, Copy, ExternalLink, ZoomIn, ZoomOut
} from "lucide-react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createFloorItemType, saveFloorPlan, getSavedPlans as fetchSavedPlansAction } from "./actions";

// -- Types --
type ItemShape = 'rectangle' | 'circle';

interface FloorItemType {
    id: string;
    name: string;
    type: string;
    width: number;
    length: number;
    color: string | null;
    icon: string | null;
}

interface FloorItem {
    id: string;
    type?: string;
    typeId?: string;
    label: string;
    x: number;
    y: number;
    width: number;
    length: number;
    rotation: number;
    shape?: string;
    color?: string;
}

interface Hall {
    id: string;
    name: string;
    width: number | null;
    length: number | null;
}

interface Props {
    initialHalls: Hall[];
    initialItemTypes: FloorItemType[];
    initialSavedPlans: any[];
}

const SNAP_SIZE = 10;
const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
};

// -- Sub Components --

function LibraryItem({ item }: { item: FloorItemType }) {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: `lib-${item.id}`,
        data: { ...item, source: 'sidebar' }
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className="group flex flex-col gap-2 p-3 rounded-md border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
            style={{ height: 'auto' }}
        >
            <div className={`h-12 w-full rounded flex items-center justify-center text-xs font-mono text-slate-400 border border-dashed ${(item.color || 'bg-slate-200').replace('bg-', 'border-').replace('100', '300')} bg-slate-50 shrink-0`}>
                <Box className="h-5 w-5 opacity-50" />
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-700 leading-tight break-words">{item.name}</span>
                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono self-start">
                    {item.width}'x{item.length}'
                </span>
            </div>
        </div>
    );
}

function CanvasItem({ item, selected, onClick }: { item: FloorItem, selected: boolean, onClick: () => void }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: item.id,
        data: { ...item, source: 'canvas' }
    });

    const style = {
        left: item.x,
        top: item.y,
        width: item.rotation % 180 === 0 ? item.width * 10 : item.length * 10,
        height: item.rotation % 180 === 0 ? item.length * 10 : item.width * 10,
        position: 'absolute' as const,
        zIndex: selected ? 20 : 10,
    };

    return (
        <div
            ref={setNodeRef}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            {...listeners}
            {...attributes}
            className={`
                flex items-center justify-center p-1 text-[10px] font-bold select-none cursor-move transition-all overflow-hidden
                ${item.color || 'bg-slate-200'}
                ${item.shape === 'circle' ? 'rounded-full' : 'rounded-[2px]'}
                ${isDragging ? 'opacity-50 ring-2 ring-indigo-500' : ''}
                ${selected ? 'ring-2 ring-indigo-600 shadow-xl z-50' : 'hover:ring-1 hover:ring-indigo-300'}
                border border-black/10 shadow-sm
            `}
            style={style}
        >
            <span className="pointer-events-none text-slate-700/90 leading-[1.1] text-center break-words w-full" style={{ transform: `rotate(${-item.rotation}deg)` }}>
                {item.label}
            </span>
            {selected && <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 rounded-full" />}
        </div>
    );
}

function TrashDroppable() {
    const { setNodeRef, isOver } = useDroppable({ id: 'trash' });
    return (
        <div ref={setNodeRef} className={`w-full h-full flex flex-col items-center justify-center transition-all ${isOver ? 'text-red-500 scale-110' : ''}`}>
            <Trash className="mb-2 h-5 w-5" />
            <span className="text-xs font-medium">Drag to Delete</span>
        </div>
    );
}

function CanvasContent({ width, length, items, selectedId, onSelect, showGrid }: { width: number, length: number, items: FloorItem[], selectedId: string | null, onSelect: (id: string) => void, showGrid: boolean }) {
    const { setNodeRef } = useDroppable({ id: 'canvas-droppable' });
    return (
        <div
            ref={setNodeRef}
            className="bg-white shadow-2xl relative transition-all duration-300 ease-in-out"
            style={{
                width: width * 10,
                height: length * 10,
                backgroundImage: showGrid ? 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px), radial-gradient(#cbd5e1 1.5px, transparent 1.5px)' : 'none',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px',
            }}
            onClick={(e) => {
                e.preventDefault();
                // We rely on parent click to deselect, but ensure we catch drops
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
                <CanvasItem
                    key={item.id}
                    item={item}
                    selected={item.id === selectedId}
                    onClick={() => onSelect(item.id)}
                />
            ))}
        </div>
    );
}

// -- Main Component --

export default function FloorPlanClient({ initialHalls, initialItemTypes, initialSavedPlans }: Props) {
    const [width, setWidth] = useState(40);
    const [length, setLength] = useState(60);

    const [zoom, setZoom] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    const [snapToGrid, setSnapToGrid] = useState(true);
    const [showGrid, setShowGrid] = useState(true);
    const [isOpenNewItemInfo, setIsOpenNewItem] = useState(false);

    const [savedPlans, setSavedPlans] = useState<any[]>(initialSavedPlans || []);
    const [currentPlan, setCurrentPlan] = useState<any>(null);
    const [isLoadOpen, setIsLoadOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    const [overlapDialog, setOverlapDialog] = useState<{ isOpen: boolean; pendingItem: FloorItem | null; actionType: 'add' | 'move'; }>({ isOpen: false, pendingItem: null, actionType: 'add' });

    const [halls] = useState<Hall[]>(initialHalls || []);
    const [itemTypes, setItemTypes] = useState<FloorItemType[]>(initialItemTypes || []);
    const [selectedHall, setSelectedHall] = useState<Hall | null>(null);
    const [planName, setPlanName] = useState("");

    const [canvasItems, setCanvasItems] = useState<FloorItem[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    const getBoundingBox = (item: FloorItem) => {
        const isRotated = item.rotation % 180 !== 0;
        const widthPx = (isRotated ? item.length : item.width) * 10;
        const heightPx = (isRotated ? item.width : item.length) * 10;
        return {
            x: item.x,
            y: item.y,
            width: widthPx,
            height: heightPx,
            left: item.x,
            right: item.x + widthPx,
            top: item.y,
            bottom: item.y + heightPx
        };
    };

    const isOverlapping = (item1: FloorItem, item2: FloorItem) => {
        const b1 = getBoundingBox(item1);
        const b2 = getBoundingBox(item2);
        return !(b1.right <= b2.left || b1.left >= b2.right || b1.bottom <= b2.top || b1.top >= b2.bottom);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemId) {
                if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
                deleteSelected();
                toast.info("Item deleted");
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedItemId]);

    useEffect(() => {
        if (selectedHall) {
            setWidth(selectedHall.width || 40);
            setLength(selectedHall.length || 60);
        }
    }, [selectedHall]);

    useEffect(() => {
        setTimeout(handleFitToScreen, 100);
    }, [width, length]);

    const handleCreateType = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name') as string,
            type: formData.get('type') as string,
            width: parseFloat(formData.get('width') as string),
            length: parseFloat(formData.get('length') as string),
            color: formData.get('color') as string
        };
        try {
            const res = await createFloorItemType(data);
            if (res.success && res.data) {
                setItemTypes(prev => [...prev, res.data]);
                setIsOpenNewItem(false);
                toast.success("Item created");
            } else {
                toast.error(res.error || "Failed to create");
            }
        } catch (e) { toast.error("Error creating item"); }
    };

    const handleSave = async () => {
        if (!selectedHall || !planName) return toast.error("Missing Hall or Plan Name");
        try {
            const body = {
                id: currentPlan?.id,
                name: planName,
                hallId: selectedHall.id,
                data: canvasItems,
                width,
                length,
                isPublic: true
            };
            const res = await saveFloorPlan(body);
            if (res.success && res.data) {
                setCurrentPlan(res.data);
                toast.success(currentPlan ? "Plan Updated" : "Plan Saved");
                const plans = await fetchSavedPlansAction();
                setSavedPlans(plans);
            } else {
                toast.error(res.error || "Save failed");
            }
        } catch (e) { toast.error("Save failed"); }
    };

    const fetchSavedPlans = async () => {
        const plans = await fetchSavedPlansAction();
        setSavedPlans(plans);
    };

    const handleLoadPlan = (plan: any) => {
        setPlanName(plan.name);
        if (plan.hall) setSelectedHall(plan.hall);
        if (plan.width) setWidth(plan.width);
        if (plan.length) setLength(plan.length);
        if (Array.isArray(plan.data)) setCanvasItems(plan.data);
        setCurrentPlan(plan);
        setIsLoadOpen(false);
        toast.success("Plan Loaded");
    };

    const copyPublicLink = () => {
        if (!currentPlan?.publicToken) return;
        const url = `${window.location.origin}/public/floor-plan/${currentPlan.publicToken}`;
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
    };

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

    const onDragEnd = (e: DragEndEvent) => {
        const { active, over, delta } = e;
        if (!over) return;

        if (over.id === 'trash') {
            if (active.data.current?.source === 'canvas') {
                setCanvasItems(prev => prev.filter(i => i.id !== active.id));
                toast.success("Deleted");
                if (selectedItemId === active.id) setSelectedItemId(null);
            }
            return;
        }

        if (active.data.current?.source === 'sidebar' && over.id === 'canvas-droppable') {
            const type = active.data.current as FloorItemType;
            const newItem: FloorItem = {
                id: `item-${Date.now()}`,
                typeId: type.id,
                label: type.name,
                width: type.width,
                length: type.length,
                x: 50,
                y: 50,
                rotation: 0,
                shape: type.type,
                color: type.color || 'bg-slate-200'
            };

            const hasCollision = canvasItems.some(i => isOverlapping(newItem, i));
            if (hasCollision) {
                setOverlapDialog({ isOpen: true, pendingItem: newItem, actionType: 'add' });
            } else {
                setCanvasItems(prev => [...prev, newItem]);
                setSelectedItemId(newItem.id);
            }
        }

        if (active.data.current?.source === 'canvas') {
            const originalItem = canvasItems.find(i => i.id === active.id);
            if (!originalItem) return;

            const adjustedDeltaX = delta.x / zoom;
            const adjustedDeltaY = delta.y / zoom;

            let newX = originalItem.x + adjustedDeltaX;
            let newY = originalItem.y + adjustedDeltaY;

            const maxX = (width * 10) - (originalItem.rotation % 180 === 0 ? originalItem.width * 10 : originalItem.length * 10);
            const maxY = (length * 10) - (originalItem.rotation % 180 === 0 ? originalItem.length * 10 : originalItem.width * 10);

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            if (snapToGrid) {
                newX = Math.round(newX / SNAP_SIZE) * SNAP_SIZE;
                newY = Math.round(newY / SNAP_SIZE) * SNAP_SIZE;
            }

            const updatedItem = { ...originalItem, x: newX, y: newY };
            const others = canvasItems.filter(i => i.id !== active.id);
            const hasCollision = others.some(i => isOverlapping(updatedItem, i));

            if (hasCollision) {
                setOverlapDialog({ isOpen: true, pendingItem: updatedItem, actionType: 'move' });
            } else {
                setCanvasItems(prev => prev.map(item => item.id === active.id ? updatedItem : item));
            }
        }
    };

    const handleConfirmOverlap = () => {
        if (!overlapDialog.pendingItem) return;
        if (overlapDialog.actionType === 'add') {
            setCanvasItems(prev => [...prev, overlapDialog.pendingItem!]);
            setSelectedItemId(overlapDialog.pendingItem!.id);
        } else {
            setCanvasItems(prev => prev.map(item => item.id === overlapDialog.pendingItem!.id ? overlapDialog.pendingItem! : item));
        }
        setOverlapDialog({ isOpen: false, pendingItem: null, actionType: 'add' });
        toast.success("Placed with overlap");
    };

    const rotateSelected = () => {
        if (!selectedItemId) return;
        setCanvasItems(prev => prev.map(item => {
            if (item.id === selectedItemId) {
                return { ...item, rotation: (item.rotation + 90) % 360 };
            }
            return item;
        }));
    };

    const deleteSelected = () => {
        if (!selectedItemId) return;
        setCanvasItems(prev => prev.filter(i => i.id !== selectedItemId));
        setSelectedItemId(null);
    };

    const selectedItem = canvasItems.find(i => i.id === selectedItemId);

    return (
        <TooltipProvider>
            <DndContext onDragEnd={onDragEnd}>
                <div className="h-[calc(100vh-2rem)] flex flex-col bg-white overflow-hidden border rounded-xl shadow-sm m-4">
                    {/* Header Toolbar */}
                    <div className="h-14 border-b bg-slate-50/50 px-4 flex items-center justify-between shrink-0 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 mr-4">
                                <Box className="h-5 w-5 text-indigo-600" />
                                <h1 className="font-bold text-slate-700 whitespace-nowrap">Floor Designer</h1>
                            </div>
                            <Separator orientation="vertical" className="h-6" />
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Plan Name"
                                    className="h-8 w-40 text-sm bg-white"
                                    value={planName}
                                    onChange={e => setPlanName(e.target.value)}
                                />
                                <Select onValueChange={(v) => setSelectedHall(halls.find(h => h.id === v) || null)}>
                                    <SelectTrigger className="h-8 w-40 text-xs bg-white">
                                        <SelectValue placeholder="Select Hall" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {halls.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Separator orientation="vertical" className="h-6" />
                            {/* Tools */}
                            <div className="flex items-center bg-white rounded-md border shadow-sm p-0.5">
                                <Tooltip><TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSnapToGrid(!snapToGrid)}>
                                        <Grid3X3 className={`h-3.5 w-3.5 ${snapToGrid ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    </Button>
                                </TooltipTrigger><TooltipContent>Snap to Grid</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowGrid(!showGrid)}>
                                        <LayoutGrid className={`h-3.5 w-3.5 ${showGrid ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    </Button>
                                </TooltipTrigger><TooltipContent>Toggle Grid</TooltipContent></Tooltip>
                                <Separator orientation="vertical" className="h-4 mx-1" />
                                <Tooltip><TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={rotateSelected} disabled={!selectedItemId}>
                                        <RotateCw className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger><TooltipContent>Rotate Selected (R)</TooltipContent></Tooltip>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {currentPlan?.publicToken && (
                                <div className="hidden lg:flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 mr-2">
                                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">Public Link</span>
                                    <div className="h-3 w-[1px] bg-slate-200 mx-1" />
                                    <button onClick={copyPublicLink} className="text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition-colors" title="Copy Public Link">
                                        <span className="text-[10px] font-mono max-w-[100px] truncate select-all">{typeof window !== 'undefined' ? `${window.location.origin}/public/floor-plan/${currentPlan.publicToken}` : '...'}</span>
                                        <Copy className="h-3 w-3" />
                                    </button>
                                </div>
                            )}

                            <Button size="sm" variant="outline" onClick={() => { fetchSavedPlans(); setIsLoadOpen(true); }} className="h-8 text-xs gap-2">
                                <FolderOpen className="h-3.5 w-3.5" /> Open
                            </Button>
                            <Button size="sm" onClick={handleSave} className="h-8 text-xs gap-2">
                                <Save className="h-3.5 w-3.5" /> {currentPlan ? "Update" : "Save"}
                            </Button>
                            {currentPlan && (
                                <Button size="sm" variant="ghost" onClick={() => setIsShareOpen(true)} className="h-8 w-8 p-0">
                                    <Share2 className="h-4 w-4 text-slate-500" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Library Panel */}
                        <div className="w-60 bg-white border-r flex flex-col shrink-0 z-10">
                            <div className="p-3 border-b flex justify-between items-center bg-slate-50/30">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Item Library</span>
                                <Dialog open={isOpenNewItemInfo} onOpenChange={setIsOpenNewItem}>
                                    <DialogTrigger asChild>
                                        <Button size="icon" variant="ghost" className="h-6 w-6"><Plus className="h-3.5 w-3.5" /></Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>Create Item Type</DialogTitle></DialogHeader>
                                        <form onSubmit={handleCreateType} className="space-y-4 pt-4">
                                            <div className="grid gap-2">
                                                <Label>Name</Label><Input name="name" required placeholder="e.g. VIP Table" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label>Shape</Label>
                                                    <Select name="type" defaultValue="rectangle">
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="rectangle">Rectangle</SelectItem>
                                                            <SelectItem value="circle">Circle</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Color</Label>
                                                    <Select name="color" defaultValue="bg-indigo-100">
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="bg-indigo-100">Indigo</SelectItem>
                                                            <SelectItem value="bg-emerald-100">Emerald</SelectItem>
                                                            <SelectItem value="bg-amber-100">Amber</SelectItem>
                                                            <SelectItem value="bg-rose-100">Rose</SelectItem>
                                                            <SelectItem value="bg-slate-200">Gray</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><Label>Width (ft)</Label><Input name="width" type="number" step="0.5" required /></div>
                                                <div><Label>Length (ft)</Label><Input name="length" type="number" step="0.5" required /></div>
                                            </div>
                                            <Button type="submit" className="w-full">Create</Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <ScrollArea className="flex-1 p-2">
                                <div className="grid grid-cols-2 gap-2">
                                    {itemTypes.map(item => <LibraryItem key={item.id} item={item} />)}
                                </div>
                            </ScrollArea>
                            <div className="p-2 border-t bg-slate-50/50">
                                <TrashDroppable />
                            </div>
                        </div>

                        {/* Canvas */}
                        <div className="flex-1 bg-slate-100/50 relative overflow-hidden flex flex-col">
                            <div ref={containerRef} className="flex-1 relative overflow-auto flex items-center justify-center p-8">
                                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.1s ease-out' }}>
                                    <CanvasContent
                                        width={width}
                                        length={length}
                                        items={canvasItems}
                                        selectedId={selectedItemId}
                                        onSelect={setSelectedItemId}
                                        showGrid={showGrid}
                                    />
                                </div>
                            </div>
                            <div className="absolute bottom-4 left-4 z-30 flex gap-2 bg-white items-center border rounded-lg shadow px-2 py-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}><ZoomOut className="h-3 w-3" /></Button>
                                <span className="text-xs font-mono w-8 text-center">{Math.round(zoom * 100)}%</span>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setZoom(z => Math.min(3, z + 0.1))}><ZoomIn className="h-3 w-3" /></Button>
                                <Separator orientation="vertical" className="h-4" />
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleFitToScreen} title="Fit to Screen"><Maximize className="h-3 w-3" /></Button>
                            </div>
                        </div>

                        {/* Properties Panel */}
                        <div className="w-64 bg-white border-l flex flex-col shrink-0 z-10">
                            <div className="p-3 border-b bg-slate-50/30">
                                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    {selectedItem ? "Item Properties" : "Hall Config"}
                                </h3>
                            </div>
                            <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                                {selectedItem ? (
                                    <div className="space-y-4">
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs">Label</Label>
                                            <Input className="h-8" value={selectedItem.label} onChange={(e) => setCanvasItems(items => items.map(i => i.id === selectedItem.id ? { ...i, label: e.target.value } : i))} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div><Label className="text-xs">X Pos</Label><div className="text-xs font-mono p-2 bg-slate-100 rounded mt-1">{(selectedItem.x / 10).toFixed(1)}'</div></div>
                                            <div><Label className="text-xs">Y Pos</Label><div className="text-xs font-mono p-2 bg-slate-100 rounded mt-1">{(selectedItem.y / 10).toFixed(1)}'</div></div>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs">Rotation ({selectedItem.rotation}°)</Label>
                                            <Slider value={[selectedItem.rotation]} max={360} step={15} onValueChange={(v) => setCanvasItems(items => items.map(i => i.id === selectedItem.id ? { ...i, rotation: v[0] } : i))} />
                                        </div>
                                        <Separator />
                                        <Button variant="destructive" size="sm" className="w-full text-xs" onClick={deleteSelected}>
                                            <Trash className="h-3.5 w-3.5 mr-2" /> Delete
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs">Dimensions (ft)</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input type="number" className="h-8" placeholder="W" value={width} onChange={e => setWidth(Number(e.target.value))} />
                                                <Input type="number" className="h-8" placeholder="L" value={length} onChange={e => setLength(Number(e.target.value))} />
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-400 italic">Select an item on the canvas to view its properties.</div>
                                        <div className="pt-4 border-t">
                                            <div className="flex justify-between items-center text-xs text-slate-500 mb-2"><span>Items</span><span className="font-medium">{canvasItems.length}</span></div>
                                            <div className="flex justify-between items-center text-xs text-slate-500"><span>Area</span><span className="font-medium">{width * length} sqft</span></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <AlertDialog open={overlapDialog.isOpen} onOpenChange={(open) => !open && setOverlapDialog(prev => ({ ...prev, isOpen: false }))}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-amber-600"><AlertTriangle className="h-5 w-5" /> Overlap Detected</AlertDialogTitle>
                            <AlertDialogDescription>This item overlaps with another. Active spaces should keep items clear.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setOverlapDialog({ isOpen: false, pendingItem: null, actionType: 'add' })}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmOverlap} className="bg-amber-600 hover:bg-amber-700">Place Anyway</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Load Plan Dialog */}
                <Dialog open={isLoadOpen} onOpenChange={setIsLoadOpen}>
                    <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
                        <DialogHeader className="p-6 pb-2"><DialogTitle>Open Saved Plan</DialogTitle></DialogHeader>
                        <ScrollArea className="flex-1 p-6 pt-2">
                            <div className="grid grid-cols-3 gap-4">
                                {savedPlans.map(plan => (
                                    <div key={plan.id} className="border rounded-lg p-4 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all bg-white" onClick={() => handleLoadPlan(plan)}>
                                        <div className="h-24 bg-slate-50 mb-3 rounded border border-dashed flex items-center justify-center text-slate-300"><Grid3X3 className="h-8 w-8" /></div>
                                        <h4 className="font-semibold text-sm truncate">{plan.name}</h4>
                                        <p className="text-xs text-slate-500">{plan.hall?.name || 'Unknown Hall'}</p>
                                        <p className="text-[10px] text-slate-400 mt-2">Updated: {new Date(plan.updatedAt).toLocaleDateString()}</p>
                                    </div>
                                ))}
                                {savedPlans.length === 0 && <div className="col-span-3 text-center text-slate-500 py-10">No saved plans found.</div>}
                            </div>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>

                {/* Share Dialog */}
                <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Share Floor Plan</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="bg-slate-50 p-4 rounded border flex flex-col gap-2">
                                <Label className="text-xs">Public Link</Label>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-xs bg-white p-2 border rounded font-mono truncate">{typeof window !== 'undefined' ? `${window.location.origin}/public/floor-plan/${currentPlan?.publicToken}` : ''}</code>
                                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={copyPublicLink}><Copy className="h-4 w-4" /></Button>
                                    <a href={`/public/floor-plan/${currentPlan?.publicToken}`} target="_blank" rel="noreferrer"><Button size="icon" variant="ghost" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button></a>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500">Anyone with this link can view this floor plan in read-only mode.</p>
                        </div>
                    </DialogContent>
                </Dialog>
            </DndContext>
        </TooltipProvider>
    );
}
