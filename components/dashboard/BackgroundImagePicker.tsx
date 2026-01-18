'use client';

import { Check, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface BackgroundImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  currentImage?: string;
}

// Curated Unsplash images for fitness/training backgrounds
const BACKGROUND_IMAGES = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80',
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&q=80',
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80',
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&q=80',
  },
  {
    id: '5',
    url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&q=80',
  },
  {
    id: '6',
    url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=300&q=80',
  },
  {
    id: '7',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&q=80',
  },
  {
    id: '8',
    url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&q=80',
  },
  {
    id: '9',
    url: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=300&q=80',
  },
  {
    id: '10',
    url: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=300&q=80',
  },
  {
    id: '11',
    url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=300&q=80',
  },
  {
    id: '12',
    url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&q=80',
  },
];

export default function BackgroundImagePicker({
  isOpen,
  onClose,
  onSelect,
  currentImage,
}: BackgroundImagePickerProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (imageUrl: string) => {
    onSelect(imageUrl);
    onClose();
  };

  const handleRemove = () => {
    onSelect('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-black">Choose Background</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          {currentImage && (
            <div className="mb-6">
              <button
                type="button"
                onClick={handleRemove}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Remove Background
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {BACKGROUND_IMAGES.map((image) => {
              const isSelected = currentImage === image.url;
              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => handleSelect(image.url)}
                  className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary ring-offset-2'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image.thumbnail}
                    alt={`Fitness background option ${image.id}`}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary text-white rounded-full p-2">
                        <Check className="w-5 h-5" aria-hidden="true" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
