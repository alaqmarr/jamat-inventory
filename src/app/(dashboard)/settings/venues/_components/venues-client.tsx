"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2, Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface Venue {
    id: string;
    name: string;
}

interface VenuesClientProps {
    initialVenues: Venue[];
}

export function VenuesClient({ initialVenues }: VenuesClientProps) {
    const router = useRouter();
    const [venues, setVenues] = useState<Venue[]>(initialVenues);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
    const [venueName, setVenueName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleOpenDialog = (venue?: Venue) => {
        if (venue) {
            setEditingVenue(venue);
            setVenueName(venue.name);
        } else {
            setEditingVenue(null);
            setVenueName("");
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!venueName.trim()) return;

        setIsSaving(true);
        try {
            const method = editingVenue ? "PUT" : "POST";
            const body = editingVenue
                ? { id: editingVenue.id, name: venueName }
                : { id: uuidv4(), name: venueName };

            const res = await fetch("/api/settings/venues", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success(editingVenue ? "Venue updated" : "Venue added");
            setVenueName("");
            setIsDialogOpen(false);

            // Optimistic update
            if (editingVenue) {
                setVenues(venues.map(v => v.id === editingVenue.id ? { ...v, name: venueName } : v));
            } else {
                setVenues([...venues, body as Venue]);
            }
            router.refresh(); // Sync with server
        } catch (error) {
            toast.error("Operation failed");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const res = await fetch("/api/settings/venues", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Venue deleted");
            setVenues(venues.filter(v => v.id !== id));
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete venue");
        }
    };

    return (
        <div className="container mx-auto p-6 md:p-10 max-w-6xl space-y-10">
            <PageHeader
                title="Venues Management"
                description="Add or edit halls and locations for events."
                backUrl="/settings"
            />

            <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between p-6 md:p-8">
                    <div>
                        <CardTitle>Registered Venues</CardTitle>
                        <CardDescription>List of all available venues.</CardDescription>
                    </div>
                    <Button id="btn-venue-add" onClick={() => handleOpenDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> Add Venue
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {venues.length === 0 ? (
                            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                                <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Building2 className="h-6 w-6 text-slate-400" />
                                </div>
                                <h3 className="font-medium text-slate-900">No venues added</h3>
                                <p className="text-sm text-slate-500 mt-1">Get started by creating a new venue.</p>
                            </div>
                        ) : (
                            venues.map((venue) => (
                                <Card key={venue.id} className="group border-0 shadow-sm hover:shadow-md transition-all overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    id={`btn-venue-edit-${venue.id}`}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                                                    onClick={() => handleOpenDialog(venue)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    id={`btn-venue-delete-${venue.id}`}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                                    onClick={() => handleDelete(venue.id, venue.name)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <h3 className="font-semibold text-slate-900 text-lg mb-1">{venue.name}</h3>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> Venue Location
                                        </p>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingVenue ? "Edit Venue" : "Add New Venue"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Venue Name</label>
                            <Input
                                placeholder="e.g. Main Hall"
                                value={venueName}
                                onChange={(e) => setVenueName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button id="btn-venue-create-save" onClick={handleSave} disabled={isSaving || !venueName.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
