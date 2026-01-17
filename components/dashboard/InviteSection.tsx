import { getInviteUrl } from '@/lib/dashboard-utils';
import type { Group } from '@/lib/db';

interface InviteSectionProps {
	group: Group;
}

export default function InviteSection({ group }: InviteSectionProps) {
	const inviteUrl = getInviteUrl(group);

	const handleCopy = () => {
		navigator.clipboard.writeText(inviteUrl);
		// You could add a toast notification here
	};

	return (
		<div className="card-modern">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h3 className="font-bold text-black mb-2 text-lg">
						Invite More People
					</h3>
					<p className="text-gray-600 body-sm">
						Share this link with your training crew
					</p>
				</div>
				<div className="flex gap-3">
					<input
						type="text"
						value={inviteUrl}
						readOnly
						className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-full bg-gray-50 text-sm font-medium focus:outline-none focus:border-primary transition-colors"
					/>
					<button
						onClick={handleCopy}
						type="button"
						className="btn-primary whitespace-nowrap text-base"
					>
						Copy Link
					</button>
				</div>
			</div>
		</div>
	);
}
