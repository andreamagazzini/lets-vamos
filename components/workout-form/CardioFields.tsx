import { Clock, MapPin, Flame, Heart, Gauge, Waves } from "lucide-react";
import type { Interval } from "@/lib/db";

interface CardioFieldsProps {
	type: "Run" | "Bike" | "Swim";
	duration: string;
	distance: string;
	calories: string;
	avgHeartRate: string;
	avgSpeed: string;
	distancePer100m: string;
	laps: string;
	poolLength: string;
	errors: Record<string, string>;
	onDurationChange: (value: string) => void;
	onDistanceChange: (value: string) => void;
	onCaloriesChange: (value: string) => void;
	onAvgHeartRateChange: (value: string) => void;
	onAvgSpeedChange: (value: string) => void;
	onDistancePer100mChange: (value: string) => void;
	onLapsChange: (value: string) => void;
	onPoolLengthChange: (value: string) => void;
}

export default function CardioFields({
	type,
	duration,
	distance,
	calories,
	avgHeartRate,
	avgSpeed,
	distancePer100m,
	laps,
	poolLength,
	errors,
	onDurationChange,
	onDistanceChange,
	onCaloriesChange,
	onAvgHeartRateChange,
	onAvgSpeedChange,
	onDistancePer100mChange,
	onLapsChange,
	onPoolLengthChange,
}: CardioFieldsProps) {
	return (
		<>
			{/* Main Metrics Grid */}
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label
						htmlFor="duration"
						className="flex items-center gap-2 text-sm font-semibold text-black mb-3"
					>
						<Clock className="w-4 h-4" />
						Duration (min)
					</label>
					<input
						id="duration"
						type="number"
						value={duration}
						onChange={(e) => onDurationChange(e.target.value)}
						className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
						placeholder="45"
					/>
					{errors.duration && (
						<p className="mt-2 text-sm text-red-600 font-medium">
							{errors.duration}
						</p>
					)}
				</div>

				<div>
					<label
						htmlFor="distance"
						className="flex items-center gap-2 text-sm font-semibold text-black mb-3"
					>
						<MapPin className="w-4 h-4" />
						Distance ({type === "Swim" ? "m" : "km"})
					</label>
					<input
						id="distance"
						type="number"
						step={type === "Swim" ? "1" : "0.1"}
						value={distance}
						onChange={(e) => onDistanceChange(e.target.value)}
						className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
						placeholder={type === "Swim" ? "1500" : "8.5"}
					/>
					{errors.distance && (
						<p className="mt-2 text-sm text-red-600 font-medium">
							{errors.distance}
						</p>
					)}
				</div>

				<div>
					<label
						htmlFor="calories"
						className="flex items-center gap-2 text-sm font-semibold text-black mb-3"
					>
						<Flame className="w-4 h-4" />
						Calories
					</label>
					<input
						id="calories"
						type="number"
						value={calories}
						onChange={(e) => onCaloriesChange(e.target.value)}
						className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
						placeholder="650"
					/>
				</div>

				<div>
					<label
						htmlFor="avgHeartRate"
						className="flex items-center gap-2 text-sm font-semibold text-black mb-3"
					>
						<Heart className="w-4 h-4" />
						Avg Heart Rate (bpm)
					</label>
					<input
						id="avgHeartRate"
						type="number"
						value={avgHeartRate}
						onChange={(e) => onAvgHeartRateChange(e.target.value)}
						className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
						placeholder="155"
					/>
				</div>
			</div>

			{/* Bike-specific: Avg Speed */}
			{type === "Bike" && (
				<div>
					<label
						htmlFor="avgSpeed"
						className="flex items-center gap-2 text-sm font-semibold text-black mb-3"
					>
						<Gauge className="w-4 h-4" />
						Avg Speed (km/h)
					</label>
					<input
						id="avgSpeed"
						type="number"
						step="0.1"
						value={avgSpeed}
						onChange={(e) => onAvgSpeedChange(e.target.value)}
						className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
						placeholder="25.5"
					/>
				</div>
			)}

			{/* Swim-specific fields */}
			{type === "Swim" && (
				<div className="grid grid-cols-3 gap-4">
					<div>
						<label
							htmlFor="distancePer100m"
							className="flex items-center gap-2 text-sm font-semibold text-black mb-3"
						>
							<Waves className="w-4 h-4" />
							Pace (sec/100m)
						</label>
						<input
							id="distancePer100m"
							type="number"
							step="0.1"
							value={distancePer100m}
							onChange={(e) => onDistancePer100mChange(e.target.value)}
							className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
							placeholder="90"
						/>
					</div>

					<div>
						<label
							htmlFor="laps"
							className="block text-sm font-semibold text-black mb-3"
						>
							Laps
						</label>
						<input
							id="laps"
							type="number"
							value={laps}
							onChange={(e) => onLapsChange(e.target.value)}
							className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
							placeholder="30"
						/>
					</div>

					<div>
						<label
							htmlFor="poolLength"
							className="block text-sm font-semibold text-black mb-3"
						>
							Pool Length (m)
						</label>
						<input
							id="poolLength"
							type="number"
							value={poolLength}
							onChange={(e) => onPoolLengthChange(e.target.value)}
							className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
							placeholder="50"
						/>
					</div>
				</div>
			)}
		</>
	);
}
