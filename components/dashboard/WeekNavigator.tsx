"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { getWeekKey, getWeekRange, getAdjacentWeekKey } from "@/lib/dashboard-utils";

interface WeekNavigatorProps {
	currentWeekKey: string;
	onWeekChange: (weekKey: string) => void;
	onToday?: () => void;
}

export default function WeekNavigator({
	currentWeekKey,
	onWeekChange,
	onToday,
}: WeekNavigatorProps) {
	const { start } = getWeekRange(currentWeekKey);
	const isCurrentWeek = currentWeekKey === getWeekKey();

	const handlePrev = () => {
		const prevWeek = getAdjacentWeekKey(currentWeekKey, "prev");
		onWeekChange(prevWeek);
	};

	const handleNext = () => {
		const nextWeek = getAdjacentWeekKey(currentWeekKey, "next");
		onWeekChange(nextWeek);
	};

	const formatWeekLabel = (date: Date) => {
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	return (
		<div className="flex items-center justify-between mb-4">
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						handlePrev();
					}}
					className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
					aria-label="Previous week"
				>
					<ChevronLeft className="w-5 h-5 text-gray-600" />
				</button>

				<div className="text-sm font-semibold text-gray-700 min-w-[180px] text-center">
					Week of {formatWeekLabel(start)}
				</div>

				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						handleNext();
					}}
					className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
					aria-label="Next week"
				>
					<ChevronRight className="w-5 h-5 text-gray-600" />
				</button>
			</div>

			{onToday && !isCurrentWeek && (
				<button
					type="button"
					onClick={onToday}
					className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
				>
					Today
				</button>
			)}
		</div>
	);
}
