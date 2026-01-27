"use client";

import { useState } from "react";
import { useRole } from "@/hooks/use-role";
import { Loader2, Mail, RefreshCw, Send, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const TEMPLATES = [
    { id: "otp", name: "OTP / Password Reset" },
    { id: "new_event", name: "New Event Notification" },
    { id: "inventory_update", name: "Inventory Update" },
    { id: "new_item", name: "New Item Created" },
    { id: "new_user", name: "New User Welcome" },
    { id: "system_error", name: "System Error Alert" },
];

export default function EmailTestClient() {
    const { isAdmin, isLoading: roleLoading } = useRole();
    const [selectedTemplate, setSelectedTemplate] = useState("otp");
    const [customEmail, setCustomEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string>("");
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
        setIsLoading(true);
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
            setIsLoading(false);
        }
    };

    // Load preview on mount or template change
    useState(() => {
        fetchPreview();
    });

    if (roleLoading) return null;
    if (!isAdmin) return <div className="p-8">Unauthorized</div>;

    return (
        <div className="container mx-auto p-6 space-y-8 max-w-7xl">
            <PageHeader
                title="Email Templates"
                description="Preview and test system email templates."
                backUrl="/settings"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>Select a template to test.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Template Type</label>
                            <Select
                                value={selectedTemplate}
                                onValueChange={(v) => {
                                    setSelectedTemplate(v);
                                    // Trigger fetch immediately after state update (handled by useEffect dependency usually, but here explicit or effect)
                                    // Let's use effect but for now simple button refresh is safer or pass to fetch
                                    setTimeout(() => fetchPreview(), 0);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TEMPLATES.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Target Email (Optional)</label>
                            <Input
                                placeholder="Leave empty to send to yourself"
                                value={customEmail}
                                onChange={(e) => setCustomEmail(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <Button onClick={fetchPreview} variant="outline" className="w-full" disabled={isLoading}>
                                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                                Refresh Preview
                            </Button>
                            <Button onClick={sendTest} className="w-full bg-slate-900 text-white" disabled={isLoading}>
                                <Send className="mr-2 h-4 w-4" />
                                Send Test Email
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Preview Area */}
                <Card className="lg:col-span-2 border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                    <div className="border-b bg-slate-50 px-4 py-2 flex items-center gap-4">
                        <button
                            onClick={() => setActiveTab("preview")}
                            className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${activeTab === 'preview' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            Visual Preview
                        </button>
                        <button
                            onClick={() => setActiveTab("code")}
                            className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${activeTab === 'code' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            HTML Source
                        </button>
                    </div>

                    <div className="flex-1 bg-slate-100 p-4 overflow-auto relative">
                        {isLoading && !previewHtml ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                            </div>
                        ) : null}

                        {activeTab === "preview" ? (
                            <div className="mx-auto max-w-[640px] bg-white shadow-xl min-h-[500px] rounded-lg overflow-hidden">
                                {previewHtml ? (
                                    <iframe
                                        srcDoc={previewHtml}
                                        className="w-full h-[800px] border-0"
                                        title="Email Preview"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400">
                                        Select a template to preview
                                    </div>
                                )}
                            </div>
                        ) : (
                            <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-auto text-xs font-mono h-[600px]">
                                {previewHtml || "No HTML loaded"}
                            </pre>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
