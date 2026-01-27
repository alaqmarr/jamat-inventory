"use client";

import { Check, Package, CalendarCheck, Clock, ArrowRightLeft, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventStepperProps {
    currentStep: number; // 0 to 4
    isCancelled?: boolean;
    settlementInfo?: string;
}

export function EventStepper({ currentStep, isCancelled, settlementInfo }: EventStepperProps) {
    const steps = [
        { label: "Booked", icon: CalendarCheck },
        { label: "Dispatched", icon: Package },
        { label: "Active", icon: Clock },
        { label: "Returning", icon: ArrowRightLeft },
        { label: "Settled", icon: Flag },
    ];

    if (isCancelled) {
        return (
            <div className="w-full py-6">
                <div className="flex items-center justify-center p-4 bg-red-50 border border-red-100 rounded-lg text-red-700 font-medium">
                    🚫 This event has been cancelled.
                </div>
            </div>
        )
    }

    return (
        <div className="w-full py-6">
            <div className="relative flex items-center justify-between w-full">
                {/* Connecting Line - Background */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full -z-10" />

                {/* Connecting Line - Progress */}
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 rounded-full -z-0 transition-all duration-700 ease-in-out"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isActive = index === currentStep;
                    const isPending = index > currentStep;

                    const isFirst = index === 0;
                    const isLast = index === steps.length - 1;

                    return (
                        <div key={index} className="flex flex-col items-center gap-2 group relative z-10 bg-white px-2">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                                    isCompleted && "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200",
                                    isActive && "bg-white border-emerald-500 text-emerald-600 shadow-lg shadow-emerald-100 scale-110",
                                    isPending && "bg-white border-slate-200 text-slate-300"
                                )}
                            >
                                {isCompleted || (isActive && isLast) ? (
                                    <Check className="w-5 h-5 animate-in zoom-in duration-300" />
                                ) : (
                                    <step.icon className={cn("w-5 h-5", isActive && "animate-pulse")} />
                                )}
                            </div>
                            <span
                                className={cn(
                                    "text-xs font-semibold whitespace-nowrap transition-colors duration-300 absolute -bottom-8",
                                    (isActive || isCompleted) ? "text-slate-800" : "text-slate-400",
                                    isFirst ? "left-0" : isLast ? "right-0" : "left-1/2 -translate-x-1/2"
                                )}
                            >
                                {step.label}
                            </span>
                            {/* Settlement Info Footer */}
                            {step.label === "Settled" && settlementInfo && (
                                <span
                                    className={cn(
                                        "absolute top-12 text-[10px] sm:text-xs font-medium whitespace-nowrap px-2 py-0.5 rounded-full border mt-1",
                                        "bg-emerald-50 text-emerald-600 border-emerald-200", // Green badge
                                        isLast ? "right-0" : "left-1/2 -translate-x-1/2"
                                    )}
                                >
                                    {settlementInfo}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="h-4" /> {/* Spacer for text */}
        </div>
    );
}
