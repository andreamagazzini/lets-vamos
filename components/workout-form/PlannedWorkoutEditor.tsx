"use client";

import { useState } from "react";
import {
	Footprints,
	Bike,
	Waves,
	Dumbbell,
	Activity,
	Trash2,
	Clock,
	MapPin,
} from "lucide-react";
import type { PlannedWorkout } from "@/lib/db";

interface PlannedWorkoutEditorProps {
	workout: string | PlannedWorkout;
	onUpdate: (workout: string | PlannedWorkout) => void;
	onDelete: () => void;
}

const WORKOUT_TYPES: PlannedWorkout["type"][] = [
	"Run",
	"Bike",
	"Swim",
	"Strength",
	"Rest",
	"Other",
];

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
		default:
			return <Activity className="w-4 h-4" />;
	}
}

export default function PlannedWorkoutEditor({
	workout,
	onUpdate,
	onDelete,
}: PlannedWorkoutEditorProps) {
	const isString = typeof workout === "string";
	const isEmpty = workout === "" || (isString && workout.trim() === "");
	const [isEditing, setIsEditing] = useState(isEmpty);

	const [type, setType] = useState<PlannedWorkout["type"]>(
		isString ? "Other" : workout.type,
	);
	const [description, setDescription] = useState(
		isString ? workout : workout.description || "",
	);
	const [duration, setDuration] = useState(
		isString ? "" : workout.duration?.toString() || "",
	);
	const [distance, setDistance] = useState(
		isString ? "" : workout.distance?.toString() || "",
	);
	const [notes, setNotes] = useState(
		isString ? "" : workout.notes || "",
	);

	const handleSave = () => {
		if (type === "Rest") {
			onUpdate({ type: "Rest" });
		} else if (description.trim() || duration || distance) {
			const plannedWorkout: PlannedWorkout = {
				type,
				description: description.trim() || undefined,
				duration: duration ? parseInt(duration) : undefined,
				distance: distance ? parseFloat(distance) : undefined,
				notes: notes.trim() || undefined,
			};
			onUpdate(plannedWorkout);
		} else {
			// Fallback to string if no structured data
			onUpdate(description.trim() || "Workout");
		}
		setIsEditing(false);
	};

	const handleCancel = () => {
		// Reset to original values
		if (typeof workout === "string") {
			setDescription(workout);
			setType("Other");
		} else {
			setType(workout.type);
			setDescription(workout.description || "");
			setDuration(workout.duration?.toString() || "");
			setDistance(workout.distance?.toString() || "");
			setNotes(workout.notes || "");
		}
		setIsEditing(false);
	};

	if (!isEditing) {
		return (
			<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
				<div className="flex items-center gap-2 flex-1">
					{getWorkoutIcon(type)}
					<span className="text-sm font-medium text-gray-700">
						{typeof workout === "string"
							? workout
							: workout.type === "Rest"
								? "Rest Day"
								: workout.description || workout.type}
					</span>
					{typeof workout === "object" && workout.duration && (
						<span className="text-xs text-gray-500">
							{workout.duration} min
						</span>
					)}
					{typeof workout === "object" && workout.distance && (
						<span className="text-xs text-gray-500">
							{workout.distance} km
						</span>
					)}
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setIsEditing(true)}
						className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/5 rounded transition-colors"
						aria-label="Edit workout"
					>
						<Activity className="w-4 h-4" />
					</button>
					<button
						type="button"
						onClick={onDelete}
						className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
						aria-label="Delete workout"
					>
						<Trash2 className="w-4 h-4" />
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 bg-white border-2 border-primary rounded-xl space-y-4">
			<div className="flex items-center justify-between">
				<span className="text-sm font-semibold text-gray-700">
					Workout Type
				</span>
				<button
					type="button"
					onClick={handleCancel}
					className="text-sm text-gray-500 hover:text-gray-700"
				>
					Cancel
				</button>
			</div>

			<select
				id="workout-type"
				value={type}
				onChange={(e) =>
					setType(e.target.value as PlannedWorkout["type"])
				}
				className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors"
			>
				{WORKOUT_TYPES.map((t) => (
					<option key={t} value={t}>
						{t}
					</option>
				))}
			</select>

			{type !== "Rest" && (
				<>
					<div>
						<label
							htmlFor="workout-description"
							className="block text-xs font-medium text-gray-600 mb-1"
						>
							Description
						</label>
						<input
							id="workout-description"
							type="text"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="e.g., 5K easy run, Upper body strength"
							className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label
								htmlFor="workout-duration"
								className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1"
							>
								<Clock className="w-3 h-3" />
								Duration (min)
							</label>
							<input
								id="workout-duration"
								type="number"
								value={duration}
								onChange={(e) => setDuration(e.target.value)}
								placeholder="45"
								className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
							/>
						</div>

						<div>
							<label
								htmlFor="workout-distance"
								className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1"
							>
								<MapPin className="w-3 h-3" />
								Distance (km)
							</label>
							<input
								id="workout-distance"
								type="number"
								step="0.1"
								value={distance}
								onChange={(e) => setDistance(e.target.value)}
								placeholder="8.5"
								className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
							/>
						</div>
					</div>

					<div>
						<label
							htmlFor="workout-notes"
							className="block text-xs font-medium text-gray-600 mb-1"
						>
							Notes (optional)
						</label>
						<textarea
							id="workout-notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Additional notes..."
							rows={2}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
						/>
					</div>
				</>
			)}

			<button
				type="button"
				onClick={handleSave}
				className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
			>
				Save Workout
			</button>
		</div>
	);
}
