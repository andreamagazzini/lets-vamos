import type { Group } from "@/lib/db";
import { getDaysUntilGoal } from "@/lib/dashboard-utils";

interface CountdownCardProps {
	group: Group;
}

export default function CountdownCard({ group }: CountdownCardProps) {
	const daysUntil = getDaysUntilGoal(group.goalDate);

	return (
		<div className="text-center py-8 bg-primary text-white rounded-2xl shadow-lg border-0">
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
	);
}
