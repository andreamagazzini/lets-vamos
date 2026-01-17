import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { Interval } from "@/lib/db";

interface IntervalsSectionProps {
	type: "Run" | "Bike" | "Swim";
	intervals: Interval[];
	expanded: boolean;
	onToggle: () => void;
	onAdd: () => void;
	onRemove: (index: number) => void;
	onUpdate: (index: number, field: keyof Interval, value: string | number) => void;
}

export default function IntervalsSection({
	type,
	intervals,
	expanded,
	onToggle,
	onAdd,
	onRemove,
	onUpdate,
}: IntervalsSectionProps) {
	return (
		<div className="border-t border-gray-200 pt-6">
			<button
				type="button"
				onClick={onToggle}
				className="flex items-center justify-between w-full mb-4"
			>
				<h3 className="text-sm font-semibold text-black">Intervals (Optional)</h3>
				{expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
			</button>

			{expanded && (
				<div className="space-y-4">
					{intervals.map((interval, index) => (
						<div
							key={`interval-${index}-${interval.type}`}
							className="p-4 bg-gray-50 rounded-xl border border-gray-200"
						>
							<div className="flex items-center justify-between mb-4">
								<select
									value={interval.type}
									onChange={(e) =>
										onUpdate(
											index,
											"type",
											e.target.value as "warmup" | "work" | "recovery",
										)
									}
									className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:border-primary"
								>
									<option value="warmup">Warmup</option>
									<option value="work">Work</option>
									<option value="recovery">Recovery</option>
								</select>
								<button
									type="button"
									onClick={() => onRemove(index)}
									className="text-red-500 hover:text-red-700 p-1"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label
										htmlFor={`interval-${index}-distance`}
										className="block text-xs font-medium text-gray-600 mb-1"
									>
										Distance ({type === "Swim" ? "m" : "km"})
									</label>
									<input
										id={`interval-${index}-distance`}
										type="number"
										step={type === "Swim" ? "1" : "0.1"}
										value={interval.distance || ""}
										onChange={(e) =>
											onUpdate(
												index,
												"distance",
												e.target.value === "" ? "" : parseFloat(e.target.value),
											)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
										placeholder={type === "Swim" ? "100" : "0.4"}
									/>
								</div>

								<div>
									<label
										htmlFor={`interval-${index}-time`}
										className="block text-xs font-medium text-gray-600 mb-1"
									>
										Time (sec)
									</label>
									<input
										id={`interval-${index}-time`}
										type="number"
										value={interval.time || ""}
										onChange={(e) =>
											onUpdate(
												index,
												"time",
												e.target.value === "" ? "" : parseInt(e.target.value),
											)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
										placeholder="90"
									/>
								</div>

								<div>
									<label
										htmlFor={`interval-${index}-pace`}
										className="block text-xs font-medium text-gray-600 mb-1"
									>
										Pace (min/{type === "Swim" ? "100m" : "km"})
									</label>
									<input
										id={`interval-${index}-pace`}
										type="number"
										step="0.1"
										value={interval.pace || ""}
										onChange={(e) =>
											onUpdate(
												index,
												"pace",
												e.target.value === "" ? "" : parseFloat(e.target.value),
											)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
										placeholder="3.75"
									/>
								</div>

								<div>
									<label
										htmlFor={`interval-${index}-hr`}
										className="block text-xs font-medium text-gray-600 mb-1"
									>
										Heart Rate (bpm)
									</label>
									<input
										id={`interval-${index}-hr`}
										type="number"
										value={interval.avgHeartRate || ""}
										onChange={(e) =>
											onUpdate(
												index,
												"avgHeartRate",
												e.target.value === "" ? "" : parseInt(e.target.value),
											)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
										placeholder="175"
									/>
								</div>
							</div>
						</div>
					))}

					<button
						type="button"
						onClick={onAdd}
						className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary border-2 border-primary rounded-full hover:bg-primary hover:text-white transition-colors"
					>
						<Plus className="w-4 h-4" />
						Add Interval
					</button>
				</div>
			)}
		</div>
	);
}
