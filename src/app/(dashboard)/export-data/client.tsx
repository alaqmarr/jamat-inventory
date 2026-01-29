"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, subDays, startOfDay, endOfDay } from "date-fns";
import {
    Calendar as CalendarIcon,
    Download,
    FileSpreadsheet,
    Filter,
    CheckCircle2,
    Loader2,
    Table as TableIcon,
    AlertCircle,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { getEventsForExport } from "@/app/actions/export";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function ExportDataClient() {
    // State
    const [date, setDate] = useState<{ from: Date; to: Date } | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [loading, setLoading] = useState(false);
    const [preset, setPreset] = useState("current_month");
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [hasGenerated, setHasGenerated] = useState(false);

    // Handlers
    const handlePresetChange = (val: string) => {
        setPreset(val);
        const now = new Date();
        if (val === "current_month") {
            setDate({ from: startOfMonth(now), to: endOfMonth(now) });
        } else if (val === "last_month") {
            const lastMonth = subDays(startOfMonth(now), 1);
            setDate({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        } else if (val === "last_30") {
            setDate({ from: subDays(now, 30), to: now });
        } else if (val === "last_90") {
            setDate({ from: subDays(now, 90), to: now });
        } else if (val === "custom") {
            // Keep current selection logic
        }
    };

    const handleGeneratePreview = async () => {
        if (!date?.from || !date?.to) {
            toast.error("Please select a date range");
            return;
        }

        setLoading(true);
        setPreviewData([]); // Clear previous
        setHasGenerated(false);

        try {
            const data = await getEventsForExport(startOfDay(date.from), endOfDay(date.to));

            if (data.length === 0) {
                toast.info("No events found for the selected period");
                setLoading(false);
                return;
            }

            // Flatten Data for Excel
            const rows = data.map(event => ({
                "Event Name": event.name,
                "Booker Mobile": event.mobile,
                "Email": event.email || "",
                "Occasion Date": format(new Date(event.occasionDate), "yyyy-MM-dd"),
                "Occasion Time": event.occasionTime,
                "Day": event.occasionDay || "",
                "Type": event.eventType,
                "Description": event.description,
                "Status": event.status,
                "Hall(s)": Array.isArray(event.hall) ? event.hall.join(", ") : event.hall,
                "Caterer Name": event.catererName,
                "Caterer Phone": event.catererPhone,
                "Thaal Count": event.thaalCount,
                "Sarkari Sets": event.sarkariThaalSet,
                "Gas Count": event.gasCount || 0,
                "Kitchen Charge": "Check Print View",
                "Tables & Chairs": event.tablesAndChairs,
                "Extra Chilamchi": event.extraChilamchiLota,
                "Bhai Saab Izzan": event.bhaiSaabIzzan ? "Yes" : "No",
                "Ben Saab Izzan": event.benSaabIzzan ? "Yes" : "No",
                "Mic": event.mic ? "Yes" : "No",
                "Crockery": event.crockeryRequired ? "Yes" : "No",
                "Devri Thaal": event.thaalForDevri ? "Yes" : "No",
                "Paat": event.paat ? "Yes" : "No",
                "Masjid Light": event.masjidLight ? "Yes" : "No",
                "Decorations": event.decorations ? "Yes" : "No",
                "AC Start Time": event.acStartTime || "",
                "Party Time": event.partyTime || "",
                "Menu": event.menu || "",
                "Created By": (event as any).createdBy?.name || "System"
            }));

            setPreviewData(rows);
            setHasGenerated(true);
            toast.success(`Preview generated for ${data.length} events`);

        } catch (error) {
            console.error(error);
            toast.error("Failed to generate preview");
        } finally {
            setLoading(false);
        }
    };

    const downloadExcel = () => {
        if (previewData.length === 0) return;

        try {
            const worksheet = XLSX.utils.json_to_sheet(previewData);

            // Auto-width columns (basic)
            const colWidths = Object.keys(previewData[0]).map(key => ({ wch: key.length + 5 }));
            colWidths[0] = { wch: 30 }; // Event Name
            colWidths[7] = { wch: 30 }; // Description
            colWidths[9] = { wch: 25 }; // Halls
            colWidths[28] = { wch: 50 }; // Menu

            worksheet["!cols"] = colWidths;

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Events");

            const fileName = `Events_Export_${format(date?.from || new Date(), "yyyyMMdd")}_to_${format(date?.to || new Date(), "yyyyMMdd")}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            toast.success("Excel file downloaded");
        } catch (e) {
            console.error(e);
            toast.error("Download failed");
        }
    };

    return (
        <div className="container mx-auto px-6 py-10 md:py-12 max-w-7xl animate-in fade-in duration-500 space-y-10">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Data Export</h1>
                    <p className="text-slate-500 mt-2 max-w-2xl">
                        Generate comprehensive Excel reports for logistics, analysis, and record-keeping.
                        Preview data before downloading to ensure accuracy.
                    </p>
                </div>
                {previewData.length > 0 && (
                    <Button
                        onClick={downloadExcel}
                        size="lg"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all hover:scale-105"
                    >
                        <Download className="mr-2 h-5 w-5" />
                        Download Report
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Column: Configuration */}
                <Card className="lg:col-span-4 border-slate-200 shadow-md bg-white/50 backdrop-blur-sm sticky top-6">
                    <CardHeader className="bg-slate-50/50 p-8 pb-6 border-b border-slate-100">
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <Filter className="w-5 h-5 text-indigo-600" />
                            Configuration
                        </CardTitle>
                        <CardDescription className="text-base">
                            Define the scope of your report.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 p-8 pt-8">
                        {/* Presets */}
                        <div className="space-y-3">
                            <Label className="text-slate-700 font-semibold">Time Period</Label>
                            <Select value={preset} onValueChange={handlePresetChange}>
                                <SelectTrigger className="bg-white border-slate-200 h-11">
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="current_month" className="font-medium">Current Month</SelectItem>
                                    <SelectItem value="last_month">Last Month</SelectItem>
                                    <SelectItem value="last_30">Last 30 Days</SelectItem>
                                    <SelectItem value="last_90">Last 90 Days</SelectItem>
                                    <SelectItem value="custom">Custom Range...</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Picker */}
                        <div className="space-y-3">
                            <Label className="text-slate-700 font-semibold">Date Range</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-white border-slate-200 h-11",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" />
                                        {date?.from ? (
                                            date.to ? (
                                                <>
                                                    {format(date.from, "LLL dd, y")} -{" "}
                                                    {format(date.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(date.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>Pick a date range</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={(D) => {
                                            if (D?.from) {
                                                setDate({ from: D.from, to: D.to || D.from });
                                                setPreset("custom");
                                            }
                                        }}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Generate Button */}
                        <Button
                            onClick={handleGeneratePreview}
                            disabled={loading || !date?.from}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-base shadow-md shadow-indigo-600/10 mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Analyzing Data...
                                </>
                            ) : (
                                <>
                                    Generate Preview
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>

                        {/* Info Box */}
                        <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 flex items-start gap-3 mt-4">
                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                                The generated Excel file includes detailed logistics including Mic, Crockery, Thaal Counts, and Caterer info.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Preview Area */}
                <div className="lg:col-span-8 space-y-6">

                    {previewData.length > 0 ? (
                        <Card className="border-slate-200 shadow-md overflow-hidden bg-white animate-in zoom-in-95 duration-300">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/30 flex flex-row items-center justify-between p-6 py-5">
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <TableIcon className="w-5 h-5 text-emerald-600" />
                                        Data Preview
                                    </CardTitle>
                                    <CardDescription>
                                        Found <span className="font-bold text-slate-900">{previewData.length}</span> records for export.
                                    </CardDescription>
                                </div>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                    Ready to Download
                                </Badge>
                            </CardHeader>
                            <div className="relative w-full overflow-auto max-h-[600px]">
                                <table className="w-full caption-bottom text-sm text-left">
                                    <thead className="[&_tr]:border-b sticky top-0 bg-slate-50 z-10 shadow-sm">
                                        <tr className="border-b transition-colors">
                                            {Object.keys(previewData[0]).slice(0, 6).map((head) => (
                                                <th key={head} className="h-10 px-6 text-left align-middle font-semibold text-xs text-slate-500 uppercase tracking-wider whitespace-nowrap bg-slate-50">
                                                    {head}
                                                </th>
                                            ))}
                                            <th className="h-10 px-6 text-left align-middle font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50">...</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.map((row: any, i: number) => (
                                            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                                {Object.values(row).slice(0, 6).map((cell: any, j) => (
                                                    <td key={j} className="p-4 px-6 align-middle whitespace-nowrap text-slate-700 font-medium group-hover:text-slate-900">
                                                        {cell}
                                                    </td>
                                                ))}
                                                <td className="p-4 px-6 align-middle text-slate-400 text-xs italic">
                                                    +{Object.keys(row).length - 6} fields
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-indigo-50/50">
                                <FileSpreadsheet className="w-10 h-10 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Generate</h3>
                            <p className="text-slate-500 text-center max-w-sm mb-8">
                                Select a date range from the configuration panel to verify data before exporting to Excel.
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
