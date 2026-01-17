"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { Group } from "@/lib/db";
import { getDaysUntilGoal } from "@/lib/dashboard-utils";
import BackgroundImagePicker from "./BackgroundImagePicker";

interface CountdownCardProps {
	group: Group;
	onUpdateGroup: (updates: Partial<Group>) => void;
}

export default function CountdownCard({
	group,
	onUpdateGroup,
}: CountdownCardProps) {
	const [showPicker, setShowPicker] = useState(false);
	const daysUntil = getDaysUntilGoal(group.goalDate);

	const handleBackgroundSelect = (imageUrl: string) => {
		onUpdateGroup({ backgroundImage: imageUrl || undefined });
	};

	return (
		<>
			<div
				className="relative text-center py-8 rounded-2xl shadow-lg border-0 overflow-hidden group"
				style={{
					backgroundImage: group.backgroundImage
						? `url(${group.backgroundImage})`
						: undefined,
					backgroundColor: group.backgroundImage ? "transparent" : undefined,
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			>
				{/* Blue overlay */}
				<div
					className={`absolute inset-0 ${
						group.backgroundImage ? "bg-primary/80" : "bg-primary"
					}`}
				/>

				{/* Content */}
				<div className="relative z-10 text-white">
					<div className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tight">
						{daysUntil}
					</div>
					<div className="text-xl md:text-2xl font-bold text-white mb-2">
						{daysUntil === 1 ? "day" : "days"} until {group.goalType}
					</div>
					<div className="text-white/80 body-md">
						{new Date(group.goalDate).toLocaleDateString("en-US", {
							month: "long",
							day: "numeric",
							year: "numeric",
						})}
					</div>
				</div>

				{/* Edit button */}
				<button
					type="button"
					onClick={() => setShowPicker(true)}
					className="absolute top-4 right-4 z-20 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
					aria-label="Edit background"
				>
					<Pencil className="w-4 h-4 text-gray-700" />
				</button>
			</div>

			<BackgroundImagePicker
				isOpen={showPicker}
				onClose={() => setShowPicker(false)}
				onSelect={handleBackgroundSelect}
				currentImage={group.backgroundImage}
			/>
		</>
	);
}
