'use client';

import { CheckCircle, RefreshCw, RotateCcw, Shield, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

// ============================================
// Types
// ============================================
export interface CaptchaProps {
  onVerify: (verified: boolean) => void;
  mode?: 'checkbox' | 'image' | 'auto';
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
  difficulty?: 'easy' | 'medium' | 'hard';
  onExpire?: () => void;
  expirationTime?: number; // in seconds
}

interface ImageChallenge {
  id: string;
  prompt: string;
  images: string[];
  correctIndices: number[];
  category: string;
}

// ============================================
// Image Challenge Data
// ============================================
const IMAGE_CHALLENGES: ImageChallenge[] = [
  {
    id: 'traffic-lights',
    prompt: 'Select all images with traffic lights',
    category: 'traffic_light',
    images: [
      'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=150&h=150&fit=crop', // traffic light
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=150&h=150&fit=crop', // city
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=150&h=150&fit=crop', // bike
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop', // traffic light
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop', // mountain
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=150&h=150&fit=crop', // car
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=150&h=150&fit=crop', // city
      'https://images.unsplash.com/photo-1597423244036-ef5020e83f3c?w=150&h=150&fit=crop', // traffic light
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=150&h=150&fit=crop', // abstract
    ],
    correctIndices: [0, 3, 7],
  },
  {
    id: 'crosswalks',
    prompt: 'Select all images with crosswalks',
    category: 'crosswalk',
    images: [
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=150&h=150&fit=crop', // crosswalk
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=150&h=150&fit=crop', // crosswalk
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=150&h=150&fit=crop', // crosswalk
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=150&h=150&fit=crop',
    ],
    correctIndices: [1, 3, 6],
  },
  {
    id: 'bicycles',
    prompt: 'Select all images with bicycles',
    category: 'bicycle',
    images: [
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=150&h=150&fit=crop', // bike
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=150&h=150&fit=crop', // bike
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=150&h=150&fit=crop', // bike
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop',
    ],
    correctIndices: [0, 2, 4],
  },
  {
    id: 'cars',
    prompt: 'Select all images with cars',
    category: 'car',
    images: [
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=150&h=150&fit=crop', // car
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=150&h=150&fit=crop', // car
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1542362567-b07e54358753?w=150&h=150&fit=crop', // car
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=150&h=150&fit=crop', // car
    ],
    correctIndices: [0, 2, 5, 8],
  },
];

// Simple math challenges as fallback
const MATH_CHALLENGES = [
  { question: 'What is 3 + 4?', answer: '7' },
  { question: 'What is 8 - 3?', answer: '5' },
  { question: 'What is 2 × 6?', answer: '12' },
  { question: 'What is 15 ÷ 3?', answer: '5' },
  { question: 'What is 9 + 2?', answer: '11' },
  { question: 'What is 7 × 2?', answer: '14' },
  { question: 'What is 20 - 8?', answer: '12' },
  { question: 'What is 6 + 7?', answer: '13' },
];

// ============================================
// Checkbox CAPTCHA Component
// ============================================
const CheckboxCaptcha: React.FC<{
  onVerify: (verified: boolean) => void;
  theme: 'light' | 'dark';
  size: 'normal' | 'compact';
}> = ({ onVerify, theme, size }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleCheck = async () => {
    if (isVerified) return;

    setIsChecked(true);
    setIsVerifying(true);

    // Simulate verification delay (would be server-side in production)
    await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800));

    setIsVerifying(false);
    setIsVerified(true);
    onVerify(true);
  };

  const isDark = theme === 'dark';
  const isCompact = size === 'compact';

  return (
    <div
      className={`
      ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'}
      border rounded-lg shadow-sm transition-all duration-300
      ${isCompact ? 'p-3' : 'p-4'}
      ${isVerified ? 'border-green-500' : ''}
    `}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={handleCheck}
          disabled={isVerified}
          aria-label="Verify you are human"
          className={`
            ${isCompact ? 'w-6 h-6' : 'w-7 h-7'}
            border-2 rounded flex items-center justify-center transition-all duration-300
            ${
              isVerified
                ? 'border-green-500 bg-green-500'
                : isVerifying
                  ? 'border-blue-500 animate-pulse'
                  : isDark
                    ? 'border-gray-500 hover:border-gray-400'
                    : 'border-gray-400 hover:border-gray-600'
            }
          `}
        >
          {isVerifying ? (
            <RefreshCw
              className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} text-blue-500 animate-spin`}
            />
          ) : isVerified ? (
            <CheckCircle className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
          ) : null}
        </button>

        <span
          className={`
          ${isCompact ? 'text-xs' : 'text-sm'}
          ${isDark ? 'text-gray-300' : 'text-gray-700'}
          font-medium
        `}
        >
          I&apos;m not a robot
        </span>

        <div className="ml-auto flex flex-col items-center">
          <Shield className={`${isCompact ? 'w-6 h-6' : 'w-8 h-8'} text-gray-400`} />
          <span className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} text-gray-400`}>
            reCAPTCHA
          </span>
        </div>
      </div>

      {isVerified && (
        <div
          className={`
          mt-2 text-xs flex items-center gap-1
          ${isDark ? 'text-green-400' : 'text-green-600'}
        `}
        >
          <CheckCircle className="w-3 h-3" />
          Verification successful
        </div>
      )}
    </div>
  );
};

// ============================================
// Image CAPTCHA Component
// ============================================
const ImageCaptcha: React.FC<{
  onVerify: (verified: boolean) => void;
  theme: 'light' | 'dark';
  difficulty: 'easy' | 'medium' | 'hard';
  onClose?: () => void;
}> = ({ onVerify, theme, difficulty, onClose }) => {
  const [challenge, setChallenge] = useState<ImageChallenge | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());

  // Get random challenge on mount
  useEffect(() => {
    loadNewChallenge();
  }, []);

  const loadNewChallenge = () => {
    const randomIndex = Math.floor(Math.random() * IMAGE_CHALLENGES.length);
    const selectedChallenge = IMAGE_CHALLENGES[randomIndex];
    if (selectedChallenge) {
      setChallenge(selectedChallenge);
    }
    setSelectedIndices([]);
    setError(null);
    setImageLoadErrors(new Set());
  };

  const handleImageClick = (index: number) => {
    if (isVerifying) return;

    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
    setError(null);
  };

  const handleVerify = async () => {
    if (!challenge || selectedIndices.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setIsVerifying(true);
    setError(null);

    // Simulate server verification
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if selected indices match correct ones
    const isCorrect =
      selectedIndices.length === challenge.correctIndices.length &&
      selectedIndices.every((idx) => challenge.correctIndices.includes(idx)) &&
      challenge.correctIndices.every((idx) => selectedIndices.includes(idx));

    setIsVerifying(false);

    if (isCorrect) {
      onVerify(true);
    } else {
      setAttempts((prev) => prev + 1);

      // Adjust based on difficulty
      const maxAttempts = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 3 : 2;

      if (attempts + 1 >= maxAttempts) {
        setError('Too many failed attempts. Please try again later.');
        setTimeout(() => onVerify(false), 2000);
      } else {
        setError(`Incorrect. Please try again. (${maxAttempts - attempts - 1} attempts remaining)`);
        loadNewChallenge();
      }
    }
  };

  const handleImageError = (index: number) => {
    setImageLoadErrors((prev) => new Set(prev).add(index));
  };

  const isDark = theme === 'dark';

  if (!challenge) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div
      className={`
      ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}
      border rounded-xl shadow-xl max-w-sm w-full overflow-hidden
    `}
    >
      {/* Header */}
      <div className={`${isDark ? 'bg-blue-600' : 'bg-blue-500'} text-white p-4`}>
        <div className="flex items-center justify-between">
          <p className="font-medium">{challenge.prompt}</p>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-xs text-blue-100 mt-1">Click verify when done</p>
      </div>

      {/* Image Grid */}
      <div className="p-3">
        <div className="grid grid-cols-3 gap-1">
          {challenge.images.map((imageUrl, index) => (
            <button
              key={index}
              onClick={() => handleImageClick(index)}
              disabled={isVerifying}
              className={`
                relative aspect-square overflow-hidden rounded transition-all duration-200
                ${selectedIndices.includes(index) ? 'ring-4 ring-blue-500 scale-95' : 'hover:opacity-80'}
                ${isVerifying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {imageLoadErrors.has(index) ? (
                <div
                  className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
                >
                  <span className="text-xs text-gray-500">Image {index + 1}</span>
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt={`Captcha option ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(index)}
                  loading="lazy"
                />
              )}
              {selectedIndices.includes(index) && (
                <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={loadNewChallenge}
            disabled={isVerifying}
            className={`
              p-2 rounded transition
              ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}
              ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title="Get new challenge"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={handleVerify}
            disabled={isVerifying || selectedIndices.length === 0}
            className={`
              px-6 py-2 rounded-lg font-medium transition
              ${
                isVerifying || selectedIndices.length === 0
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }
            `}
          >
            {isVerifying ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Verifying...
              </span>
            ) : (
              'Verify'
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div
        className={`
        px-4 py-2 border-t flex items-center justify-between
        ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}
      `}
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500">Protected by Advancia Security</span>
        </div>
        <span className="text-xs text-gray-400">Attempt {attempts + 1}</span>
      </div>
    </div>
  );
};

// ============================================
// Math CAPTCHA Component (Fallback)
// ============================================
const MathCaptcha: React.FC<{
  onVerify: (verified: boolean) => void;
  theme: 'light' | 'dark';
}> = ({ onVerify, theme }) => {
  const [challenge, setChallenge] = useState<{ question: string; answer: string } | null>(
    MATH_CHALLENGES[0] || null
  );
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    loadNewChallenge();
  }, []);

  const loadNewChallenge = () => {
    const randomIndex = Math.floor(Math.random() * MATH_CHALLENGES.length);
    const selectedChallenge = MATH_CHALLENGES[randomIndex];
    if (selectedChallenge) {
      setChallenge(selectedChallenge);
    }
    setAnswer('');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!challenge) {
      loadNewChallenge();
      return;
    }

    if (answer.trim() === challenge.answer) {
      onVerify(true);
    } else {
      setAttempts((prev) => prev + 1);
      if (attempts >= 2) {
        setError('Too many failed attempts');
        setTimeout(() => onVerify(false), 2000);
      } else {
        setError('Incorrect answer. Try again.');
        loadNewChallenge();
      }
    }
  };

  const isDark = theme === 'dark';

  if (!challenge) {
    return (
      <div
        className={`
        ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}
        border rounded-lg p-4 max-w-xs
      `}
      >
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
      ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}
      border rounded-lg p-4 max-w-xs
    `}
    >
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-5 h-5 text-blue-500" />
        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Security Check
        </span>
      </div>

      <p className={`text-lg mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        {challenge.question}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer"
          className={`
            w-full px-3 py-2 border rounded-lg
            ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
          `}
          autoComplete="off"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={loadNewChallenge}
            className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <RotateCcw className="w-4 h-4 inline mr-1" />
            New question
          </button>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Verify
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================
// Main RobotVerification Component
// ============================================
export const RobotVerification: React.FC<CaptchaProps> = ({
  onVerify,
  mode = 'checkbox',
  theme = 'light',
  size = 'normal',
  difficulty = 'medium',
  onExpire,
  expirationTime = 120,
}) => {
  const [showImageChallenge, setShowImageChallenge] = useState(false);
  const [verified, setVerified] = useState(false);
  const [expired, setExpired] = useState(false);

  // Handle expiration
  useEffect(() => {
    if (verified && expirationTime > 0) {
      const timer = setTimeout(() => {
        setVerified(false);
        setExpired(true);
        onExpire?.();
      }, expirationTime * 1000);

      return () => clearTimeout(timer);
    }
  }, [verified, expirationTime, onExpire]);

  const handleCheckboxVerify = (success: boolean) => {
    // Random chance to trigger image challenge (simulating risk analysis)
    const shouldShowImageChallenge = Math.random() > 0.7; // 30% chance

    if (success && shouldShowImageChallenge && mode === 'auto') {
      setShowImageChallenge(true);
    } else {
      setVerified(success);
      onVerify(success);
    }
  };

  const handleImageVerify = (success: boolean) => {
    setShowImageChallenge(false);
    setVerified(success);
    onVerify(success);
  };

  if (expired) {
    return (
      <div
        className={`
        ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'}
        border rounded-lg p-4 text-center
      `}
      >
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Verification expired.
        </p>
        <button
          onClick={() => {
            setExpired(false);
            setVerified(false);
          }}
          className="mt-2 text-blue-500 hover:text-blue-600 text-sm font-medium"
        >
          Verify again
        </button>
      </div>
    );
  }

  if (verified) {
    return (
      <div
        className={`
        ${theme === 'dark' ? 'bg-gray-800 border-green-600' : 'bg-green-50 border-green-300'}
        border rounded-lg p-4 flex items-center gap-3
      `}
      >
        <CheckCircle className="w-6 h-6 text-green-500" />
        <span className={`font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>
          Verified successfully
        </span>
      </div>
    );
  }

  if (showImageChallenge || mode === 'image') {
    return (
      <ImageCaptcha
        onVerify={handleImageVerify}
        theme={theme}
        difficulty={difficulty}
        onClose={mode === 'auto' ? () => setShowImageChallenge(false) : undefined}
      />
    );
  }

  return <CheckboxCaptcha onVerify={handleCheckboxVerify} theme={theme} size={size} />;
};

// Export additional components for flexibility
export { CheckboxCaptcha, ImageCaptcha, MathCaptcha };

export default RobotVerification;
