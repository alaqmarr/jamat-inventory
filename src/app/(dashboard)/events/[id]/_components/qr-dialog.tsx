"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Printer } from "lucide-react";
import QRCode from "react-qr-code";
import { useRef } from "react";

interface QRDialogProps {
    eventId: string;
    eventName: string;
}

export function QRDialog({ eventId, eventName }: QRDialogProps) {
    const link = typeof window !== "undefined" ? `${window.location.origin}/events/${eventId}/inventory` : "";

    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        if (printWindow) {
            printWindow.document.write('<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">');
            printWindow.document.write(`<h2 style="font-family:sans-serif;margin-bottom:20px;">${eventName}</h2>`);
            // We can't easily clone the SVG from here to new window without serialization, 
            // simpler to let the user print the dialog or Use a standard library.
            // For now, simpler approach:
            printWindow.document.write(document.getElementById("qr-code-container")?.innerHTML || "");
            printWindow.document.write(`<p style="font-family:sans-serif;margin-top:20px;">Scan to Manage Inventory</p>`);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <QrCode className="mr-2 h-4 w-4" /> QR Code
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Event QR Code</DialogTitle>
                    <DialogDescription>
                        Scan this code to instantly access the inventory management page for <strong>{eventName}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-6 space-y-6">
                    <div id="qr-code-container" className="p-4 bg-white border rounded-xl shadow-sm">
                        <QRCode
                            value={link}
                            size={200}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                        />
                    </div>
                    <div className="text-center text-xs text-slate-400 break-all px-4">
                        {link}
                    </div>
                    <Button onClick={handlePrint} className="w-full" variant="secondary">
                        <Printer className="mr-2 h-4 w-4" /> Print QR
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
