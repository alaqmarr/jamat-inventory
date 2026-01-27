"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2, Utensils, Phone } from "lucide-react";
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
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface Caterer {
    id: string;
    name: string;
    phone: string;
}

interface CaterersClientProps {
    initialCaterers: Caterer[];
}

export function CaterersClient({ initialCaterers }: CaterersClientProps) {
    const router = useRouter();
    const [caterers, setCaterers] = useState<Caterer[]>(initialCaterers);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCaterer, setEditingCaterer] = useState<Caterer | null>(null);
    const [formData, setFormData] = useState({ name: "", phone: "" });
    const [isSaving, setIsSaving] = useState(false);

    const handleOpenDialog = (caterer?: Caterer) => {
        if (caterer) {
            setEditingCaterer(caterer);
            setFormData({ name: caterer.name, phone: caterer.phone });
        } else {
            setEditingCaterer(null);
            setFormData({ name: "", phone: "" });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;

        setIsSaving(true);
        try {
            const method = editingCaterer ? "PUT" : "POST";
            const body = editingCaterer
                ? { id: editingCaterer.id, ...formData }
                : { id: uuidv4(), ...formData };

            const res = await fetch("/api/settings/caterers", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success(editingCaterer ? "Caterer updated" : "Caterer added");
            setIsDialogOpen(false);

            // Optimistic update
            if (editingCaterer) {
                setCaterers(caterers.map(c => c.id === editingCaterer.id ? { ...c, ...formData } : c));
            } else {
                setCaterers([...caterers, body as Caterer]);
            }
            router.refresh();
        } catch (error) {
            toast.error("Operation failed");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const res = await fetch("/api/settings/caterers", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Caterer deleted");
            setCaterers(caterers.filter(c => c.id !== id));
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete caterer");
        }
    };

    return (
        <div className="container mx-auto p-6 md:p-10 max-w-6xl space-y-10">
            <PageHeader
                title="Caterers Management"
                description="Manage approved food providers and contact details."
                backUrl="/settings"
            />

            <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between p-6 md:p-8">
                    <div>
                        <CardTitle>Registered Caterers</CardTitle>
                        <CardDescription>List of available caterers.</CardDescription>
                    </div>
                    <Button id="btn-caterer-add" onClick={() => handleOpenDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> Add Caterer
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {caterers.length === 0 ? (
                            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                                <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Utensils className="h-6 w-6 text-slate-400" />
                                </div>
                                <h3 className="font-medium text-slate-900">No caterers added</h3>
                                <p className="text-sm text-slate-500 mt-1">Add a caterer to manage their details.</p>
                            </div>
                        ) : (
                            caterers.map((caterer) => (
                                <Card key={caterer.id} className="group border-0 shadow-sm hover:shadow-md transition-all overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                                                <Utensils className="h-5 w-5" />
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    id={`btn-caterer-edit-${caterer.id}`}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                                                    onClick={() => handleOpenDialog(caterer)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    id={`btn-caterer-delete-${caterer.id}`}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                                    onClick={() => handleDelete(caterer.id, caterer.name)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <h3 className="font-semibold text-slate-900 text-lg mb-1">{caterer.name}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                <Phone className="h-3 w-3 text-slate-500" />
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium">{caterer.phone || "No contact info"}</p>
                                        </div>
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
                        <DialogTitle>{editingCaterer ? "Edit Caterer" : "Add New Caterer"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Caterer Name</label>
                            <Input
                                placeholder="e.g. Al-Nour Catering"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone Number</label>
                            <Input
                                placeholder="e.g. 050-1234567"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button id="btn-caterer-create-save" onClick={handleSave} disabled={isSaving || !formData.name.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
