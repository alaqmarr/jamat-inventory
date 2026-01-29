"use client";

import { useState, useEffect } from "react";
import { useRole } from "@/hooks/use-role";
import {
    Loader2,
    Mail,
    RefreshCw,
    Send,
    Smartphone,
    Monitor,
    Code,
    Eye,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TEMPLATES = [
    { id: "otp", name: "OTP / Password Reset", description: "Verification code email" },
    { id: "new_event", name: "New Event Notification", description: "Admin alert for new bookings" },
    { id: "inventory_update", name: "Inventory Update", description: "Stock movement alerts" },
    { id: "new_item", name: "New Item Created", description: "New inventory item alert" },
    { id: "new_user", name: "New User Welcome", description: "Welcome email for new staff" },
    { id: "system_error", name: "System Error Alert", description: "Critical system errors" },
];

export default function EmailTestClient() {
    const { isAdmin, isLoading: roleLoading } = useRole();
    const [selectedTemplate, setSelectedTemplate] = useState("otp");
    const [customEmail, setCustomEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string>("");
    const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
    const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

    const fetchPreview = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/email-test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "preview", template: selectedTemplate }),
            });
            const data = await res.json();
            if (res.ok) setPreviewHtml(data.html);
            else toast.error("Failed to load preview");
        } catch (error) {
            toast.error("Error loading preview");
        } finally {
            setIsLoading(false);
        }
    };

    const sendTest = async () => {
        setIsSending(true);
        try {
            const res = await fetch("/api/admin/email-test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "send",
                    template: selectedTemplate,
                    email: customEmail
                }),
            });
            if (res.ok) toast.success(`Test email sent for ${selectedTemplate}`);
            else toast.error("Failed to send test email");
        } catch (error) {
            toast.error("Error sending email");
        } finally {
            setIsSending(false);
        }
    };

    // Load preview on mount or template change
    useEffect(() => {
        fetchPreview();
    }, [selectedTemplate]);

    if (roleLoading) return null;
    if (!isAdmin) return <div className="p-8 flex items-center justify-center text-slate-500">Unauthorized Access</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-7xl animate-in fade-in duration-500">
            <PageHeader
                title="Email Studio"
                description="visualize, test, and debug system email templates."
                backUrl="/settings"
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-200px)] min-h-[600px]">
                {/* Left Panel: Configuration */}
                <Card className="lg:col-span-4 h-full flex flex-col border-0 shadow-xl bg-white/50 backdrop-blur-sm ring-1 ring-slate-200">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Mail className="h-5 w-5 text-indigo-600" />
                            </div>
                            Configuration
                        </CardTitle>
                        <CardDescription>Select template & recipient.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 flex-1 flex flex-col">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Template</label>
                                <Select
                                    value={selectedTemplate}
                                    onValueChange={setSelectedTemplate}
                                >
                                    <SelectTrigger className="h-12 border-slate-200 bg-white/80 focus:ring-indigo-500">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TEMPLATES.map(t => (
                                            <SelectItem key={t.id} value={t.id}>
                                                <div className="flex flex-col text-left py-1">
                                                    <span className="font-medium">{t.name}</span>
                                                    <span className="text-xs text-muted-foreground">{t.description}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Recipient</label>
                                <Input
                                    placeholder="me@example.com (Default: You)"
                                    value={customEmail}
                                    onChange={(e) => setCustomEmail(e.target.value)}
                                    className="h-12 border-slate-200 bg-white/80 focus-visible:ring-indigo-500"
                                />
                                <p className="text-xs text-slate-400">If empty, sends to current admin email.</p>
                            </div>
                        </div>

                        <Separator className="my-2" />

                        <div className="flex-1" />

                        <div className="space-y-3">
                            <Button
                                onClick={fetchPreview}
                                variant="outline"
                                className="w-full h-11 border-slate-200 hover:bg-slate-50 text-slate-700"
                                disabled={isLoading}
                            >
                                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                                Refresh Preview
                            </Button>
                            <Button
                                onClick={sendTest}
                                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20"
                                disabled={isSending || isLoading}
                            >
                                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                {isSending ? "Sending..." : "Send Test Email"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Panel: Preview */}
                <Card className="lg:col-span-8 h-full flex flex-col border-0 shadow-xl overflow-hidden bg-slate-50/50 backdrop-blur-sm ring-1 ring-slate-200">
                    {/* Toolbar */}
                    <div className="border-b bg-white px-4 py-3 flex items-center justify-between shrink-0">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-auto">
                            <TabsList className="bg-slate-100/50">
                                <TabsTrigger value="preview" className="px-4 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <Eye className="h-4 w-4" /> Visual
                                </TabsTrigger>
                                <TabsTrigger value="code" className="px-4 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <Code className="h-4 w-4" /> Source
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {activeTab === "preview" && (
                            <div className="flex items-center bg-slate-100/50 rounded-lg p-1 border border-slate-200/50">
                                <button
                                    onClick={() => setViewMode("desktop")}
                                    className={cn(
                                        "p-2 rounded-md transition-all duration-200",
                                        viewMode === "desktop" ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-900"
                                    )}
                                    title="Desktop View"
                                >
                                    <Monitor className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("mobile")}
                                    className={cn(
                                        "p-2 rounded-md transition-all duration-200",
                                        viewMode === "mobile" ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-900"
                                    )}
                                    title="Mobile View"
                                >
                                    <Smartphone className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-slate-200/50 p-6 overflow-hidden relative flex flex-col items-center justify-center">
                        {isLoading && !previewHtml && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[2px] z-20">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                    <p className="text-sm font-medium text-slate-500">Rendering Template...</p>
                                </div>
                            </div>
                        )}

                        {activeTab === "preview" ? (
                            <div
                                className={cn(
                                    "bg-white shadow-2xl transition-all duration-500 ease-in-out border border-slate-200 overflow-hidden relative flex flex-col",
                                    viewMode === "mobile"
                                        ? "w-[375px] h-[667px] rounded-[3rem] border-[8px] border-slate-800"
                                        : "w-full h-full rounded-xl max-w-4xl"
                                )}
                            >
                                {viewMode === "mobile" && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-10" />
                                )}

                                <div className="flex-1 w-full h-full overflow-hidden bg-white">
                                    {previewHtml ? (
                                        <iframe
                                            srcDoc={previewHtml}
                                            className="w-full h-full border-0"
                                            title="Email Preview"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-400">
                                            Select a template to generate preview
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
                                <pre className="w-full h-full p-6 overflow-auto text-xs font-mono text-emerald-400 leading-relaxed">
                                    {previewHtml || "// No source loaded"}
                                </pre>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
