'use client';

import { useVoiceInput } from '@/lib/hooks/useVoiceInput';
import { useEffect } from 'react';

interface VoiceInputProps {
  onTranscriptChange: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInput({ onTranscriptChange, disabled }: VoiceInputProps) {
  const {
    isListening,
    transcript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput();

  // transcript가 변경될 때마다 부모에 전달
  useEffect(() => {
    if (transcript) {
      onTranscriptChange(transcript);
    }
  }, [transcript, onTranscriptChange]);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          음성 입력은 Chrome, Edge, Safari 브라우저에서 지원됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full py-4 px-6 rounded-xl font-medium transition-all duration-200
          flex items-center justify-center gap-3
          ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 animate-pulse'
              : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isListening ? (
          <>
            <div className="w-3 h-3 bg-white rounded-full animate-ping" />
            <span>녹음 중... 탭하여 중지</span>
          </>
        ) : (
          <>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <span>음성으로 말하기</span>
          </>
        )}
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {isListening && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm font-medium text-blue-700">듣고 있어요...</span>
          </div>
          {transcript && (
            <p className="text-sm text-gray-700 mt-2">{transcript}</p>
          )}
        </div>
      )}
    </div>
  );
}
