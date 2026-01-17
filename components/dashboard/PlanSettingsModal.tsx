"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import type { GroupPlanSettings } from "@/lib/db";

interface PlanSettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (settings: GroupPlanSettings) => void;
	currentSettings: GroupPlanSettings;
}

const DEFAULT_SETTINGS: GroupPlanSettings = {
	displayStyle: "expanded",
	showIcons: true,
	showDetails: true,
	colorTheme: "default",
	highlightToday: true,
};

export default function PlanSettingsModal({
	isOpen,
	onClose,
	onSave,
	currentSettings,
}: PlanSettingsModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const [settings, setSettings] = useState<GroupPlanSettings>(
		currentSettings || DEFAULT_SETTINGS,
	);

	useEffect(() => {
		setSettings(currentSettings || DEFAULT_SETTINGS);
	}, [currentSettings]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				modalRef.current &&
				!modalRef.current.contains(event.target as Node)
			) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			document.body.style.overflow = "hidden";
			return () => {
				document.removeEventListener("mousedown", handleClickOutside);
				document.body.style.overflow = "unset";
			};
		}
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const handleSave = () => {
		onSave(settings);
		onClose();
	};

	const handleToggle = (key: keyof GroupPlanSettings) => {
		if (typeof settings[key] === "boolean") {
			setSettings((prev) => ({
				...prev,
				[key]: !prev[key],
			}));
		}
	};

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div
				ref={modalRef}
				className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
			>
				<div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
					<h2 className="text-xl font-bold text-black">Plan Settings</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded-full transition-colors"
						aria-label="Close"
					>
						<X className="w-5 h-5 text-gray-600" />
					</button>
				</div>

				<div className="p-6 space-y-6">
					{/* Display Style */}
					<div>
						<label
							htmlFor="display-style"
							className="block text-sm font-semibold text-gray-700 mb-2"
						>
							Display Style
						</label>
						<select
							id="display-style"
							value={settings.displayStyle}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									displayStyle: e.target.value as
										| "compact"
										| "expanded"
										| "detailed",
								}))
							}
							className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors"
						>
							<option value="compact">Compact</option>
							<option value="expanded">Expanded</option>
							<option value="detailed">Detailed</option>
						</select>
						<p className="mt-1 text-xs text-gray-500">
							{settings.displayStyle === "compact" &&
								"Minimal info, icons only"}
							{settings.displayStyle === "expanded" &&
								"Icons + type name"}
							{settings.displayStyle === "detailed" &&
								"Icons + type + duration/distance"}
						</p>
					</div>

					{/* Color Theme */}
					<div>
						<label
							htmlFor="color-theme"
							className="block text-sm font-semibold text-gray-700 mb-2"
						>
							Color Theme
						</label>
						<select
							id="color-theme"
							value={settings.colorTheme}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									colorTheme: e.target.value as
										| "default"
										| "minimal"
										| "vibrant",
								}))
							}
							className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors"
						>
							<option value="default">Default</option>
							<option value="minimal">Minimal</option>
							<option value="vibrant">Vibrant</option>
						</select>
					</div>

					{/* Toggle Options */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<span className="text-sm font-semibold text-gray-700">
									Show Icons
								</span>
								<p className="text-xs text-gray-500">
									Display workout type icons
								</p>
							</div>
							<button
								type="button"
								onClick={() => handleToggle("showIcons")}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
									settings.showIcons ? "bg-primary" : "bg-gray-300"
								}`}
								aria-label="Toggle show icons"
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
										settings.showIcons ? "translate-x-6" : "translate-x-1"
									}`}
								/>
							</button>
						</div>

						<div className="flex items-center justify-between">
							<div>
								<span className="text-sm font-semibold text-gray-700">
									Show Details
								</span>
								<p className="text-xs text-gray-500">
									Display duration and distance
								</p>
							</div>
							<button
								type="button"
								onClick={() => handleToggle("showDetails")}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
									settings.showDetails ? "bg-primary" : "bg-gray-300"
								}`}
								aria-label="Toggle show details"
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
										settings.showDetails ? "translate-x-6" : "translate-x-1"
									}`}
								/>
							</button>
						</div>

						<div className="flex items-center justify-between">
							<div>
								<span className="text-sm font-semibold text-gray-700">
									Highlight Today
								</span>
								<p className="text-xs text-gray-500">
									Emphasize today's workouts
								</p>
							</div>
							<button
								type="button"
								onClick={() => handleToggle("highlightToday")}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
									settings.highlightToday ? "bg-primary" : "bg-gray-300"
								}`}
								aria-label="Toggle highlight today"
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
										settings.highlightToday ? "translate-x-6" : "translate-x-1"
									}`}
								/>
							</button>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3 pt-4 border-t border-gray-200">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleSave}
							className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
						>
							Save Settings
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
