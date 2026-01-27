import { InventoryItem } from "@/types";
import { Package, AlertTriangle, XCircle, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";

interface InventoryStatsProps {
    items: InventoryItem[];
}

export function InventoryStats({ items }: InventoryStatsProps) {
    const totalProducts = items.length;
    const outOfStock = items.filter((i) => i.availableQuantity === 0).length;
    const lowStock = items.filter((i) => i.availableQuantity > 0 && i.availableQuantity < 20).length;
    const categories = new Set(items.map((i) => i.category)).size;

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Products - Indigo */}
            <Card className="p-5 border-l-4 border-l-indigo-500 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                    <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Package className="w-5 h-5" />
                    </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">{totalProducts}</p>
                <p className="text-xs text-slate-400 mt-1">Across {categories} categories</p>
            </Card>

            {/* Low Stock - Amber */}
            <Card className="p-5 border-l-4 border-l-amber-500 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                    <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">{lowStock}</p>
                <p className="text-xs text-slate-400 mt-1">Items below 20 units</p>
            </Card>

            {/* Out of Stock - Rose (Destructive) */}
            <Card className="p-5 border-l-4 border-l-red-500 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                    <div className="h-10 w-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                        <XCircle className="w-5 h-5" />
                    </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">{outOfStock}</p>
                <p className="text-xs text-slate-400 mt-1">Needs reordering</p>
            </Card>

            {/* Categories - Emerald */}
            <Card className="p-5 border-l-4 border-l-emerald-500 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Categories</p>
                    <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Layers className="w-5 h-5" />
                    </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">{categories}</p>
                <p className="text-xs text-slate-400 mt-1">Active categories</p>
            </Card>
        </div>
    );
}
