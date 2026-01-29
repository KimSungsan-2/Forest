'use client';

import React from 'react';

interface AiMessageBubbleProps {
  content: string;
  timestamp?: string;
  showAvatar?: boolean;
  className?: string;
}

interface ContentPart {
  text: string;
  highlighted: boolean;
}

function parseHighlightedContent(text: string): ContentPart[] {
  const parts: ContentPart[] = [];
  const regex = /==(.*?)==/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), highlighted: false });
    }
    parts.push({ text: match[1], highlighted: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlighted: false });
  }

  if (parts.length === 0) {
    parts.push({ text, highlighted: false });
  }

  return parts;
}

export default function AiMessageBubble({
  content,
  timestamp,
  showAvatar = true,
  className = '',
}: AiMessageBubbleProps) {
  const parts = parseHighlightedContent(content);

  return (
    <div
      className={`relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50
        rounded-2xl p-6 border border-green-200/60 shadow-sm
        animate-fade-in-up ${className}`}
    >
      {/* 장식 아이콘 */}
      <div className="absolute top-3 right-3 text-green-200/50 text-2xl select-none">
        🍃
      </div>

      <div className="flex items-start space-x-3">
        {showAvatar && (
          <div
            className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600
              rounded-full flex items-center justify-center text-white text-xl shadow-md"
          >
            🌲
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-xs text-green-600 font-medium mb-2 tracking-wide">
            숲의 메시지
          </p>

          <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {parts.map((part, index) =>
              part.highlighted ? (
                <blockquote
                  key={index}
                  className="my-3 pl-4 py-3 pr-3 border-l-4 border-green-400
                    bg-gradient-to-r from-green-100/80 to-emerald-50/50 rounded-r-lg
                    text-green-900 font-semibold text-lg leading-relaxed
                    animate-highlight-glow not-italic"
                >
                  &ldquo;{part.text}&rdquo;
                </blockquote>
              ) : (
                <span key={index}>{part.text}</span>
              )
            )}
          </div>

          {timestamp && (
            <p className="text-xs text-green-400 mt-3">{timestamp}</p>
          )}
        </div>
      </div>
    </div>
  );
}
