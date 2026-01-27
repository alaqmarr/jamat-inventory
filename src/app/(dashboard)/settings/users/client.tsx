
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash2, User as UserIcon, Shield, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { User } from "@/types";

const userSchema = z.object({
    name: z.string().min(2, "Name is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["ADMIN", "MANAGER", "STAFF", "WATCHER"]),
    mobile: z.string().optional(),
});

import { useCurrentRole } from "@/hooks/use-current-role";

export default function UsersPage() {
    const role = useCurrentRole();
    const isAdmin = role === "ADMIN";
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);

    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    const form = useForm<z.infer<typeof userSchema>>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: "",
            username: "",
            password: "",
            role: "STAFF",
            mobile: "",
        },
    });

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            toast.error("Failed to fetch users");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const onSubmit = async (values: z.infer<typeof userSchema>) => {
        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create user");
            }

            toast.success("User created successfully");
            setIsDialogOpen(false);
            form.reset();
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        try {
            const res = await fetch(`/api/users/${userToDelete}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("User deleted");
            fetchUsers();
        } catch (error) {
            toast.error("Failed to delete user");
        } finally {
            setUserToDelete(null);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "ADMIN": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Admin</Badge>;
            case "MANAGER": return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Manager</Badge>;
            case "STAFF": return <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200">Staff</Badge>;
            default: return <Badge variant="secondary" className="bg-slate-100 text-slate-600">Watcher</Badge>;
        }
    };

    const handleEditUser = async (values: any) => {
        try {
            const res = await fetch("/api/user/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...values, userId: userToEdit?.uid }),
            });

            if (!res.ok) throw new Error("Failed to update user");

            toast.success("User updated successfully");
            setUserToEdit(null);
            fetchUsers();
        } catch (error) {
            toast.error("Failed to update user");
        }
    };

    // ... existing code ...

    return (
        <div className="container mx-auto p-8 md:p-12 max-w-7xl space-y-10">
            <PageHeader
                title="User Management"
                description="Create and manage system users and their roles."
                actions={
                    isAdmin && (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button id="btn-user-add" className="bg-emerald-600 hover:bg-emerald-700 shadow-sm text-white">
                                    <Plus className="mr-2 h-4 w-4" /> Add User
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New User</DialogTitle>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Name</FormLabel>
                                                    <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="username"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Username</FormLabel>
                                                    <FormControl><Input placeholder="johndoe" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Password</FormLabel>
                                                    <FormControl><Input type="password" placeholder="******" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="role"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Role</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a role" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                                            <SelectItem value="MANAGER">Manager</SelectItem>
                                                            <SelectItem value="STAFF">Staff</SelectItem>
                                                            <SelectItem value="WATCHER">Watcher</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button id="btn-user-create-save" type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Create User</Button>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    )
                }
            />

            {isLoading ? (
                <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user) => (
                        <Card key={user.uid} className="group hover:shadow-md transition-all duration-300 border-0 shadow-sm overflow-hidden">
                            <div className="h-1 bg-indigo-500"></div>
                            <CardHeader className="pt-6 pb-2 px-6 flex flex-row items-center justify-between space-y-0">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                        {(user.name || user.username).charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold text-slate-900">{user.name || user.username}</CardTitle>
                                        <CardDescription className="text-sm">@{user.username}</CardDescription>
                                    </div>
                                </div>
                                {getRoleBadge(user.role)}
                            </CardHeader>
                            <CardContent className="pt-4 border-t border-slate-100 mt-2">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-slate-500 flex items-center gap-1">
                                        <Shield className="h-3 w-3" /> {user.role}
                                    </div>
                                    {isAdmin && (
                                        <div className="flex gap-1">
                                            <Button
                                                id={`btn-user-edit-${user.uid}`}
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                onClick={() => setUserToEdit(user)}
                                            >
                                                <UserIcon className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                id={`btn-user-delete-${user.uid}`}
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => setUserToDelete(user.uid)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit User Dialog */}
            <Dialog open={!!userToEdit} onOpenChange={(open) => !open && setUserToEdit(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    {userToEdit && (
                        <EditUserForm user={userToEdit} onSubmit={handleEditUser} />
                    )}
                </DialogContent>
            </Dialog>

            <Drawer open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <DrawerContent className="px-4 pb-8">
                    <DrawerHeader className="text-center pt-6">
                        <DrawerTitle className="text-xl font-bold">Delete User</DrawerTitle>
                        <DrawerDescription className="text-slate-500 mt-2">
                            This action cannot be undone. This will permanently delete the user account.
                        </DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter className="flex flex-col gap-3 mt-4">
                        <Button
                            id="btn-user-delete-confirm"
                            onClick={handleDelete}
                            className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                        >
                            Yes, Delete User
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full h-12 rounded-xl border-slate-300">
                                Cancel
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    );
}

function EditUserForm({ user, onSubmit }: { user: User, onSubmit: (values: any) => void }) {
    const [name, setName] = useState(user.name || "");
    const [email, setEmail] = useState(user.email || "");
    const [mobile, setMobile] = useState(user.mobile || "");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, email, mobile, password: password || undefined });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Username</Label>
                <Input value={user.username} disabled className="bg-slate-100" />
            </div>
            <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
            <div className="space-y-2">
                <Label>Mobile</Label>
                <Input value={mobile} onChange={(e) => setMobile(e.target.value)} type="tel" />
            </div>
            <div className="space-y-2">
                <Label>New Password (Optional)</Label>
                <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Leave blank to keep current"
                />
            </div>
            <Button id="btn-user-update-save" type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Update User</Button>
        </form>
    );
}
