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
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-bold text-black mb-2 text-lg">Invite More People</h3>
          <p className="text-gray-600 body-sm">Share this link with your training crew</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={inviteUrl}
            readOnly
            className="flex-1 min-w-0 px-4 sm:px-5 py-3 border-2 border-gray-200 rounded-full bg-gray-50 text-xs sm:text-sm font-medium focus:outline-none focus:border-primary transition-colors truncate"
          />
          <button
            onClick={handleCopy}
            type="button"
            className="btn-primary whitespace-nowrap text-sm sm:text-base w-full sm:w-auto flex-shrink-0"
          >
            Copy Link
          </button>
        </div>
      </div>
    </div>
  );
}
