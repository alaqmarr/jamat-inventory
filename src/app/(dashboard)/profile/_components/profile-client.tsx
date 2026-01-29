"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
    Loader2,
    Save,
    Lock,
    User as UserIcon,
    Mail,
    Phone,
    Shield,
    KeyRound,
    CheckCircle,
    Camera,
    History,
    LogOut
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { Separator } from "@/components/ui/separator";

interface UserData {
    id: string;
    name: string;
    email: string;
    mobile: string;
    username: string;
    role: string;
}

interface ProfileClientProps {
    initialUser: UserData;
}

export default function ProfileClient({ initialUser }: ProfileClientProps) {
    const { update } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<"profile" | "security">("profile");

    // Profile State
    const [name, setName] = useState(initialUser.name || "");
    const [email, setEmail] = useState(initialUser.email || "");
    const [mobile, setMobile] = useState(initialUser.mobile || "");
    const username = initialUser.username || "";
    const role = initialUser.role || "Member";

    // Password State
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [showOtpInput, setShowOtpInput] = useState(false);

    const handleUpdateProfile = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/user/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, mobile }),
            });

            if (!res.ok) throw new Error("Failed to update profile");

            await update({ name, email, mobile });
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendOtp = async () => {
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/otp/send", { method: "POST" });
            if (!res.ok) throw new Error("Failed to send OTP");

            toast.success("OTP sent to your email");
            setShowOtpInput(true);
        } catch (error) {
            toast.error("Failed to send OTP. Ensure your email is correct.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/user/update-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otp, newPassword }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update password");

            toast.success("Password updated successfully");
            setNewPassword("");
            setConfirmPassword("");
            setOtp("");
            setShowOtpInput(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to update password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Sidebar: Navigation & User Card */}
                <div className="lg:col-span-4 space-y-6">
                    {/* User Profile Card */}
                    <Card className="overflow-hidden border-slate-200 shadow-md">
                        <div className="h-32 bg-gradient-to-r from-slate-900 to-slate-800 relative">
                            <div className="absolute inset-0 opacity-20 bg-[url('/patterns/grid.svg')]"></div>
                        </div>
                        <CardContent className="relative pt-0 px-6 pb-6 text-center">
                            <div className="relative -mt-16 mb-4 inline-block">
                                <div className="h-32 w-32 rounded-full bg-white p-1 shadow-xl ring-4 ring-slate-50/50 mx-auto">
                                    <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-4xl font-bold text-white overflow-hidden">
                                        {name?.charAt(0)?.toUpperCase() || "U"}
                                    </div>
                                </div>
                                <Badge className="absolute bottom-1 right-1 h-8 w-8 rounded-full p-0 flex items-center justify-center border-2 border-white bg-green-500 hover:bg-green-600">
                                    <CheckCircle className="h-4 w-4 text-white" />
                                </Badge>
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900">{name}</h2>
                            <p className="text-slate-500 font-medium text-sm mt-1">@{username}</p>

                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                    <Shield className="w-3 h-3 mr-1" />
                                    {role}
                                </Badge>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                    <History className="w-3 h-3 mr-1" />
                                    Active Now
                                </Badge>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50 border-t border-slate-100 p-4">
                            <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100" onClick={() => signOut()}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Navigation Pills */}
                    <nav className="flex flex-col space-y-2">
                        <button
                            onClick={() => setActiveSection("profile")}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left",
                                activeSection === "profile"
                                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                                    : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <div className={cn("p-2 rounded-lg", activeSection === "profile" ? "bg-white/10" : "bg-slate-100")}>
                                <UserIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="block font-semibold">Personal Information</span>
                                <span className={cn("text-xs block mt-0.5", activeSection === "profile" ? "text-slate-300" : "text-slate-400")}>
                                    Name, Email, Contact
                                </span>
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveSection("security")}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left",
                                activeSection === "security"
                                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                                    : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <div className={cn("p-2 rounded-lg", activeSection === "security" ? "bg-white/10" : "bg-slate-100")}>
                                <Lock className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="block font-semibold">Security & Password</span>
                                <span className={cn("text-xs block mt-0.5", activeSection === "security" ? "text-slate-300" : "text-slate-400")}>
                                    Update Password, 2FA
                                </span>
                            </div>
                        </button>
                    </nav>
                </div>

                {/* Right Content: Forms */}
                <div className="lg:col-span-8 space-y-6">

                    {activeSection === "profile" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Personal Information</h1>
                                <p className="text-slate-500">Update your account details and public profile info.</p>
                            </div>

                            <Card className="border-slate-200 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base font-semibold">Basic Details</CardTitle>
                                            <CardDescription>
                                                This information is visible to other admins.
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="bg-white">
                                            <Shield className="w-3 h-3 mr-1 text-emerald-500" />
                                            Admin Verification
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 md:p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label className="text-slate-700">Username</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">@</span>
                                                <Input value={username} disabled className="pl-8 bg-slate-50 text-slate-500 border-slate-200" />
                                            </div>
                                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                                <Lock className="w-3 h-3" /> Cannot be changed
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-slate-700">Full Name</Label>
                                            <Input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="h-11 border-slate-200 focus:border-indigo-500 transition-colors"
                                                placeholder="Enter your full name"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-slate-700">Email Address</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <Input
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    type="email"
                                                    className="pl-10 h-11 border-slate-200 focus:border-indigo-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-slate-700">Mobile Number</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <Input
                                                    value={mobile}
                                                    onChange={(e) => setMobile(e.target.value)}
                                                    type="tel"
                                                    className="pl-10 h-11 border-slate-200 focus:border-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 flex gap-3">
                                        <div className="p-2 bg-blue-100 rounded-full h-fit">
                                            <Shield className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-blue-900">Privacy Note</h4>
                                            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                                                Your email and mobile number are used for critical system notifications and password recovery.
                                                Ensure they are always up to date.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end">
                                    <Button
                                        onClick={handleUpdateProfile}
                                        disabled={isLoading}
                                        className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
                                    >
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Save Changes
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    )}

                    {activeSection === "security" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Security Settings</h1>
                                <p className="text-slate-500">Manage your password and account security.</p>
                            </div>

                            <Card className="border-slate-200 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-100 rounded-lg">
                                            <KeyRound className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-semibold">Change Password</CardTitle>
                                            <CardDescription>
                                                We recommend using a strong password.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 md:p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label className="text-slate-700">New Password</Label>
                                            <Input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                disabled={showOtpInput}
                                                placeholder="••••••••"
                                                className="h-11 border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-slate-700">Confirm Password</Label>
                                            <Input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                disabled={showOtpInput}
                                                placeholder="••••••••"
                                                className="h-11 border-slate-200"
                                            />
                                        </div>
                                    </div>

                                    {showOtpInput && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 animate-in zoom-in-95 duration-300">
                                            <div className="max-w-xs mx-auto text-center space-y-4">
                                                <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                                                    <Mail className="w-6 h-6 text-amber-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-amber-900">Enter Verification Code</h3>
                                                    <p className="text-xs text-amber-700 mt-1">
                                                        We sent a 6-digit code to <strong>{email}</strong>
                                                    </p>
                                                </div>
                                                <Input
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    placeholder="XXXXXX"
                                                    maxLength={6}
                                                    className="text-center text-2xl tracking-[0.5em] font-mono h-14 bg-white border-amber-200 focus:ring-amber-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end gap-3">
                                    {!showOtpInput ? (
                                        <Button
                                            onClick={handleSendOtp}
                                            disabled={isLoading || !newPassword || !confirmPassword}
                                            className="bg-slate-900 hover:bg-slate-800 text-white"
                                        >
                                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Next Step
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowOtpInput(false)}
                                                disabled={isLoading}
                                                className="border-slate-200"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleChangePassword}
                                                disabled={isLoading || otp.length !== 6}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                )}
                                                Confirm Update
                                            </Button>
                                        </>
                                    )}
                                </CardFooter>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
