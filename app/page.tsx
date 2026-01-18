'use client';

import { Activity, ArrowRight, Calendar, Target, TrendingUp, Users } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import AuthModal from '@/components/AuthModal';
import JoinGroupModal from '@/components/JoinGroupModal';

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Train Together',
      description: 'Create groups with your training crew and stay accountable together',
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Weekly Plans',
      description: 'Set up custom training plans for each day of the week',
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: 'Log Workouts',
      description: 'Track your workouts with duration, distance, and detailed notes',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Track Progress',
      description: "Visual charts and progress tracking to see how you're doing",
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Set Goals',
      description: 'Work towards your goal together - marathon, triathlon, or anything',
    },
  ];

  return (
    <div className="min-h-screen bg-[#02182c] text-[#fcfcfa]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, #fcfcfa 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-16 sm:py-24 lg:py-32">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-[#2888fb]/20 blur-3xl rounded-full -z-10"></div>
                <Image
                  src="/logo.png"
                  alt="Let's Vamos"
                  width={200}
                  height={100}
                  priority
                  className="object-contain drop-shadow-2xl"
                />
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight">
              Train Together,
              <br />
              <span className="text-[#2888fb]">Achieve Together</span>
            </h1>

            <p className="text-xl sm:text-2xl text-[#fcfcfa]/80 max-w-2xl mx-auto mb-12 leading-relaxed">
              Stay accountable with your training crew. Track workouts, share progress, and crush
              your goals together.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 justify-center items-center mb-16">
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('sign-up');
                    setAuthModalOpen(true);
                  }}
                  className="group bg-[#fcfcfa] text-[#02182c] px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-[#2888fb]/20 hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Join with Invite Code Button */}
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(true)}
                  className="bg-[#fcfcfa]/10 backdrop-blur-sm border-2 border-[#fcfcfa]/30 text-[#fcfcfa] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#fcfcfa]/20 hover:border-[#fcfcfa]/50 hover:scale-105 transition-all duration-200 w-full sm:w-auto"
                >
                  Join with Code
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-[#fcfcfa] text-[#02182c] py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 text-[#02182c]">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              All the tools to keep your training group motivated and on track
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-8 rounded-2xl bg-gradient-to-br from-[#f8f8f6] to-[#fcfcfa] border-2 border-gray-200 hover:border-[#2888fb] hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-[#02182c] text-[#fcfcfa] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#2888fb] transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-[#02182c]">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-[#02182c] to-[#033a5e] py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">
            Ready to Start Training Together?
          </h2>
          <p className="text-xl text-[#fcfcfa]/80 mb-10 max-w-2xl mx-auto">
            Join thousands of athletes who are achieving their goals with their training crew
          </p>
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('sign-up');
              setAuthModalOpen(true);
            }}
            className="bg-[#fcfcfa] text-[#02182c] px-10 py-5 rounded-full font-bold text-lg shadow-2xl hover:shadow-[#2888fb]/20 hover:scale-105 transition-all duration-200 inline-flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#02182c] border-t border-[#fcfcfa]/10 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[#fcfcfa]/70 text-sm">
            © {new Date().getFullYear()} Let's Vamos. Train together, achieve together.
          </p>
        </div>
      </footer>

      {/* Custom Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />

      {/* Join Group Modal */}
      <JoinGroupModal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
    </div>
  );
}
