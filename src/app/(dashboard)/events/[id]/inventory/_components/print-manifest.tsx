import { Event, InventoryItem } from "@/types";
import { format } from "date-fns";

interface PrintManifestProps {
    event: Event;
    inventory: InventoryItem[];
    // We pass the pre-calculated stats map to avoid re-calc
    itemStats: Map<string, { issued: number; returned: number; lost: number; deficit: number }>;
}

export function PrintManifest({ event, inventory, itemStats }: PrintManifestProps) {
    // Filter to only active items for the manifest
    const activeItems = inventory.filter(item => {
        const stats = itemStats.get(item.id);
        return (stats?.issued || 0) > 0 || (stats?.returned || 0) > 0;
    });

    const totalIssued = activeItems.reduce((sum, item) => sum + (itemStats.get(item.id)?.issued || 0), 0);
    const totalReturned = activeItems.reduce((sum, item) => sum + (itemStats.get(item.id)?.returned || 0), 0);


    const refId = `INV-${format(new Date(event.occasionDate), "yyyy")}-${event.id.slice(0, 6).toUpperCase()}`;

    return (
        <div className="hidden print:block font-sans text-black p-0 bg-white w-full max-w-[210mm] mx-auto min-h-screen relative flex flex-col">
            {/* Header Image - Full Width */}
            <div className="w-full mb-6 relative">
                <img
                    src="/manifest_thumbnail.png"
                    alt="Manifest Header"
                    className="w-full h-auto object-cover print:w-full"
                />
            </div>

            {/* Content Grows */}
            <div className="flex-grow px-8">

                {/* Stats Summary */}
                <div className="grid grid-cols-4 gap-6 mb-8 border border-slate-200 rounded-lg p-4 bg-slate-50/50 print:bg-transparent print:border-slate-300">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Total Items</p>
                        <p className="text-2xl font-bold text-slate-900">{activeItems.length}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Total Issued</p>
                        <p className="text-2xl font-bold text-slate-900">{totalIssued}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Total Returned</p>
                        <p className="text-2xl font-bold text-slate-900">{totalReturned}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Status</p>
                        <p className="text-2xl font-bold text-slate-900">
                            {totalIssued === totalReturned ? "Settled" : "Pending"}
                        </p>
                    </div>
                </div>

                {/* Event Info (Added since header info is gone) */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">{event.name}</h2>
                    <p className="text-slate-600">{format(new Date(event.occasionDate), "PPP")}</p>
                </div>

                {/* Inventory Table */}
                <div className="mb-8">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-900">
                                <th className="py-3 text-sm font-bold uppercase tracking-wider text-slate-900">Item Name</th>
                                <th className="py-3 text-sm font-bold uppercase tracking-wider text-slate-900 text-center w-24">Category</th>
                                <th className="py-3 text-sm font-bold uppercase tracking-wider text-slate-900 text-center w-24">Issued</th>
                                <th className="py-3 text-sm font-bold uppercase tracking-wider text-slate-900 text-center w-24">Returned</th>
                                <th className="py-3 text-sm font-bold uppercase tracking-wider text-slate-900 text-center w-24">Variance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {activeItems.map((item, idx) => {
                                const stats = itemStats.get(item.id)!;
                                const variance = stats.issued - stats.returned - stats.lost;
                                return (
                                    <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50 print:bg-slate-100"}>
                                        <td className="py-3 pl-2 text-sm font-medium text-slate-900">{item.name}</td>
                                        <td className="py-3 text-sm text-slate-600 text-center">{item.category}</td>
                                        <td className="py-3 text-sm font-bold text-slate-900 text-center">{stats.issued}</td>
                                        <td className="py-3 text-sm font-bold text-slate-900 text-center">{stats.returned}</td>
                                        <td className="py-3 text-sm font-bold text-center">
                                            {variance !== 0 ? (
                                                <span className="text-red-600">{variance > 0 ? `-${variance}` : `+${Math.abs(variance)}`}</span>
                                            ) : (
                                                <span className="text-emerald-600">Considered</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Signatures */}
                <div className="mt-12 page-break-inside-avoid">
                    <div className="grid grid-cols-2 gap-16">
                        <div>
                            <div className="h-24 border border-slate-300 rounded-lg mb-2"></div>
                            <div className="border-t-2 border-slate-900 pt-2">
                                <p className="font-bold text-slate-900 uppercase text-sm">Dispatched By</p>
                                <p className="text-xs text-slate-500">Authorized Signature & Date</p>
                            </div>
                        </div>
                        <div>
                            <div className="h-24 border border-slate-300 rounded-lg mb-2"></div>
                            <div className="border-t-2 border-slate-900 pt-2">
                                <p className="font-bold text-slate-900 uppercase text-sm">Received By</p>
                                <p className="text-xs text-slate-500">Authorized Signature & Date</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Footer */}
            <div className="mt-auto px-8 pb-8 pt-4 border-t border-slate-200">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">INVENTORY MANIFEST</h1>
                        <p className="text-slate-500 text-xs font-medium tracking-wide">Official Inventory Control Document</p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-900 font-mono font-bold text-sm tracking-widest">{refId}</p>
                        <p className="text-slate-400 text-[10px] mt-1">Generated: {format(new Date(), "PPP p")}</p>
                    </div>
                </div>
                <div className="text-center mt-4">
                    <p className="text-[10px] text-slate-300">Jamaat Inventory Management System • Confidential</p>
                </div>
            </div>
        </div>
    );
}
