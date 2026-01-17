"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { quickTestLogin, isAuthenticated, getCurrentUser } from "@/lib/auth";
import { getGroupsByUserEmail } from "@/lib/db";

export default function Home() {
	const router = useRouter();
	const [inviteCode, setInviteCode] = useState("");
	const [currentUser, setCurrentUser] = useState<{ email: string } | null>(
		null,
	);

	useEffect(() => {
		if (isAuthenticated()) {
			setCurrentUser(getCurrentUser());
		}
	}, []);

	const handleCreateGroup = () => {
		router.push("/create-group");
	};

	const handleJoinGroup = () => {
		if (inviteCode.trim()) {
			router.push(`/join/${inviteCode.trim()}`);
		} else {
			router.push("/join");
		}
	};

	const handleQuickLogin = async (email: string) => {
		quickTestLogin(email);
		setCurrentUser({ email });

		// Check if user has any groups and redirect to dashboard
		try {
			const groups = await getGroupsByUserEmail(email);
			if (groups.length > 0) {
				// Redirect to the first group's dashboard
				router.push(`/dashboard/${groups[0].id}`);
			} else {
				// No groups, redirect to create group page
				router.push("/create-group");
			}
		} catch (error) {
			console.error("Error checking user groups:", error);
			// On error, still redirect to create group
			router.push("/create-group");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
			<div className="w-full max-w-lg animate-fade-in">
				<div className="text-center mb-12">
					<div className="flex justify-center mb-6">
						<div className="relative">
							<div className="absolute inset-0 bg-blue-100/50 blur-2xl rounded-full -z-10"></div>
							<Image
								src="/logo.png"
								alt="Let's Vamos"
								width={180}
								height={90}
								priority
								className="object-contain drop-shadow-sm"
							/>
						</div>
					</div>
					<h1 className="heading-md text-gray-900 mb-4">
						Train Together, Achieve Together
					</h1>
					<p className="body-lg text-gray-600 max-w-md mx-auto leading-relaxed">
						Stay accountable with your training crew. Track workouts, share
						progress, and achieve your goals together.
					</p>
				</div>

				<div className="card-modern space-y-6 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
					<button
						onClick={handleCreateGroup}
						type="button"
						className="btn-primary w-full text-lg py-4 shadow-md hover:shadow-lg"
					>
						Create Group
					</button>

					<div className="relative py-2">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-gray-200"></div>
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="px-4 bg-white text-gray-400 font-medium">
								or
							</span>
						</div>
					</div>

					<div className="space-y-4">
						<div className="relative">
							<input
								type="text"
								placeholder="Enter invite code"
								value={inviteCode}
								onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
								className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#1e3a8a] focus:ring-4 focus:ring-blue-100 transition-all text-center font-semibold tracking-wider bg-gray-50/50 hover:bg-white"
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleJoinGroup();
									}
								}}
							/>
						</div>
						<button
							onClick={handleJoinGroup}
							type="button"
							className="btn-secondary w-full text-lg py-4"
						>
							Join with Invite Code
						</button>
					</div>

					{/* Quick Test Login for Prototyping */}
					<div className="mt-8 pt-6 border-t border-gray-100">
						<p className="text-xs text-gray-400 mb-4 text-center font-medium uppercase tracking-wider">
							Quick Test Login
						</p>
						<div className="grid grid-cols-2 gap-3">
							<button
								onClick={() => handleQuickLogin("test1@example.com")}
								type="button"
								className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-all duration-200 text-sm font-medium border border-gray-200 hover:border-gray-300 hover:shadow-sm"
							>
								Test User 1
							</button>
							<button
								onClick={() => handleQuickLogin("test2@example.com")}
								className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-all duration-200 text-sm font-medium border border-gray-200 hover:border-gray-300 hover:shadow-sm"
								type="button"
							>
								Test User 2
							</button>
						</div>
						{currentUser && (
							<div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
								<p className="text-xs text-green-700 text-center font-medium">
									✓ Logged in as {currentUser.email}
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
