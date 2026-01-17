"use client";

import {
	Footprints,
	Bike,
	Waves,
	Dumbbell,
	Activity,
	Clock,
	MapPin,
} from "lucide-react";
import type { PlannedWorkout, GroupPlanSettings } from "@/lib/db";

interface PlannedWorkoutItemProps {
	workout: string | PlannedWorkout;
	settings: GroupPlanSettings;
	isToday?: boolean;
}

function getWorkoutIcon(type: string) {
	switch (type) {
		case "Run":
			return <Footprints className="w-4 h-4" />;
		case "Bike":
			return <Bike className="w-4 h-4" />;
		case "Swim":
			return <Waves className="w-4 h-4" />;
		case "Strength":
			return <Dumbbell className="w-4 h-4" />;
		case "Rest":
			return <Activity className="w-4 h-4" />;
		default:
			return <Activity className="w-4 h-4" />;
	}
}

function getWorkoutColor(type: string, colorTheme: string) {
	const baseColors = {
		Run: {
			bg: "bg-primary-light/10",
			border: "border-primary-light/30",
			text: "text-primary",
			icon: "text-primary-light",
		},
		Bike: {
			bg: "bg-primary/5",
			border: "border-primary/20",
			text: "text-primary",
			icon: "text-primary",
		},
		Swim: {
			bg: "bg-accent/10",
			border: "border-accent/30",
			text: "text-primary",
			icon: "text-accent",
		},
		Strength: {
			bg: "bg-gray-50",
			border: "border-gray-200",
			text: "text-gray-700",
			icon: "text-gray-600",
		},
		Rest: {
			bg: "bg-gray-100/50",
			border: "border-gray-200/50",
			text: "text-gray-500",
			icon: "text-gray-400",
		},
		Other: {
			bg: "bg-gray-50",
			border: "border-gray-200",
			text: "text-gray-700",
			icon: "text-gray-600",
		},
	};

	const colors = baseColors[type as keyof typeof baseColors] || baseColors.Other;

	if (colorTheme === "minimal") {
		return {
			...colors,
			bg: "bg-transparent",
			border: "border-gray-200",
		};
	}

	if (colorTheme === "vibrant") {
		return {
			...colors,
			bg: colors.bg.replace("/10", "/20").replace("/5", "/15"),
			border: colors.border.replace("/30", "/50").replace("/20", "/40"),
		};
	}

	return colors;
}

export default function PlannedWorkoutItem({
	workout,
	settings,
	isToday = false,
}: PlannedWorkoutItemProps) {
	const isString = typeof workout === "string";
	const plannedWorkout: PlannedWorkout = isString
		? { type: "Other", description: workout }
		: workout;

	const colors = getWorkoutColor(plannedWorkout.type, settings.colorTheme);
	const icon = getWorkoutIcon(plannedWorkout.type);

	const textColor = isToday
		? "text-white"
		: plannedWorkout.type === "Rest"
			? colors.text
			: colors.text;

	const bgColor = isToday
		? "bg-primary/20"
		: plannedWorkout.type === "Rest"
			? colors.bg
			: colors.bg;

	if (settings.displayStyle === "compact") {
		return (
			<div className={`inline-flex items-center gap-1.5 ${textColor}`}>
				{settings.showIcons && <span className={colors.icon}>{icon}</span>}
				{plannedWorkout.type !== "Rest" && (
					<span className="text-xs font-medium">{plannedWorkout.type}</span>
				)}
			</div>
		);
	}

	if (settings.displayStyle === "expanded") {
		return (
			<div
				className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border ${bgColor} ${colors.border} ${textColor}`}
			>
				{settings.showIcons && <span className={colors.icon}>{icon}</span>}
				<span className="text-sm font-medium">
					{plannedWorkout.description ||
						plannedWorkout.type === "Rest"
							? "Rest Day"
							: plannedWorkout.type}
				</span>
			</div>
		);
	}

	// detailed style
	return (
		<div
			className={`inline-flex flex-col gap-1 px-3 py-2 rounded-lg border ${bgColor} ${colors.border} ${textColor}`}
		>
			<div className="flex items-center gap-2">
				{settings.showIcons && <span className={colors.icon}>{icon}</span>}
				<span className="text-sm font-semibold">
					{plannedWorkout.description ||
						plannedWorkout.type === "Rest"
							? "Rest Day"
							: plannedWorkout.type}
				</span>
			</div>
			{settings.showDetails && (
				<div className="flex items-center gap-3 text-xs opacity-80">
					{plannedWorkout.duration && (
						<div className="flex items-center gap-1">
							<Clock className="w-3 h-3" />
							<span>{plannedWorkout.duration} min</span>
						</div>
					)}
					{plannedWorkout.distance && (
						<div className="flex items-center gap-1">
							<MapPin className="w-3 h-3" />
							<span>{plannedWorkout.distance} km</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
