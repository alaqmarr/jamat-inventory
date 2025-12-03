import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryItem } from "@/types";
import { Package, AlertTriangle, XCircle, Layers } from "lucide-react";

interface InventoryStatsProps {
    items: InventoryItem[];
}

export function InventoryStats({ items }: InventoryStatsProps) {
    const totalProducts = items.length;
    const outOfStock = items.filter((i) => i.availableQuantity === 0).length;
    const lowStock = items.filter((i) => i.availableQuantity > 0 && i.availableQuantity < 20).length; // Threshold: 20
    const categories = new Set(items.map((i) => i.category)).size;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalProducts}</div>
                    <p className="text-xs text-muted-foreground">Across {categories} categories</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{lowStock}</div>
                    <p className="text-xs text-muted-foreground">Items below 20 units</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{outOfStock}</div>
                    <p className="text-xs text-muted-foreground">Needs reordering</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Categories</CardTitle>
                    <Layers className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{categories}</div>
                    <p className="text-xs text-muted-foreground">Active categories</p>
                </CardContent>
            </Card>
        </div>
    );
}
