'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function JoinPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      router.push(`/join/${inviteCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-lg card-modern animate-fade-in">
        <h1 className="heading-lg text-black mb-8 tracking-tight">Join a Training Group</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-semibold text-black mb-3">
              Invite Code
            </label>
            <input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors text-center font-semibold tracking-wider"
              placeholder="ABC123XY"
            />
          </div>
          <button type="submit" className="btn-primary w-full text-lg">
            Join Group →
          </button>
        </form>
      </div>
    </div>
  );
}
