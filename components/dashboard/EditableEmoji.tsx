'use client';

import { Smile } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface EditableEmojiProps {
  emoji: string;
  onChange: (emoji: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

const EMOJI_OPTIONS = [
  '🏃',
  '🚴',
  '🏊',
  '💪',
  '🎯',
  '🔥',
  '⚡',
  '🏆',
  '🌟',
  '💎',
  '🚀',
  '⭐',
  '🎨',
  '🎭',
  '🎬',
  '🎮',
  '🏅',
  '🥇',
  '🥈',
  '🥉',
  '🎖️',
  '🏵️',
  '🎗️',
  '🎟️',
  '🎫',
  '🎪',
  '🎨',
  '🎭',
  '🏋️',
  '🧘',
  '🤸',
  '🏄',
];

export const getRandomEmoji = () => {
  return EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)];
};

const sizeClasses = {
  sm: 'w-6 h-6 text-lg',
  md: 'w-8 h-8 text-xl',
  lg: 'w-10 h-10 text-2xl',
};

export default function EditableEmoji({ emoji, onChange, size = 'md' }: EditableEmojiProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [randomEmoji] = useState(() => getRandomEmoji());
  const displayEmoji = emoji || randomEmoji;
  const [inputValue, setInputValue] = useState(displayEmoji);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(emoji || randomEmoji);
  }, [emoji, randomEmoji]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleEmojiClick = (selectedEmoji: string) => {
    onChange(selectedEmoji);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.length > 0) {
      onChange(value);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setInputValue(emoji || randomEmoji);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${sizeClasses[size]} flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all cursor-pointer group relative`}
        aria-label="Edit emoji"
      >
        <span className="leading-none">{displayEmoji}</span>
        <span className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-0.5 shadow-sm">
          <Smile className="w-3 h-3 text-gray-600" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg p-4 z-50 min-w-[280px]">
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">Quick Pick</p>
            <div className="grid grid-cols-8 gap-2">
              {EMOJI_OPTIONS.map((emojiOption) => (
                <button
                  key={emojiOption}
                  type="button"
                  onClick={() => handleEmojiClick(emojiOption)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-lg"
                >
                  {emojiOption}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-200 pt-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">Or type your own</p>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:border-primary"
              placeholder={randomEmoji}
              maxLength={2}
            />
          </div>
        </div>
      )}
    </div>
  );
}
