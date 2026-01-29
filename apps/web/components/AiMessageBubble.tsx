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
  const hasHighlights = parts.some((p) => p.highlighted);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-md
        animate-fade-in-up ${className}`}
    >
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50" />
      <div className="absolute top-0 left-0 w-32 h-32 bg-green-200/20 rounded-full -translate-x-10 -translate-y-10" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-emerald-200/20 rounded-full translate-x-8 translate-y-8" />

      {/* 상단 장식 라인 */}
      <div className="relative h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400" />

      <div className="relative p-6">
        {/* 장식 아이콘들 */}
        <div className="absolute top-3 right-3 text-green-200/40 text-2xl select-none">
          🍃
        </div>
        <div className="absolute bottom-4 right-12 text-green-100/30 text-lg select-none">
          🌿
        </div>

        <div className="flex items-start space-x-4">
          {showAvatar && (
            <div className="flex-shrink-0">
              <div
                className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600
                  rounded-full flex items-center justify-center text-white text-2xl
                  shadow-lg ring-2 ring-green-200/50"
              >
                🌲
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-xs font-semibold text-green-700 bg-green-100/80 px-2.5 py-1 rounded-full">
                숲의 메시지
              </span>
              {hasHighlights && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  ✨ 핵심 메시지 포함
                </span>
              )}
            </div>

            <div className="text-gray-700 whitespace-pre-wrap leading-7 text-[15px]">
              {parts.map((part, index) =>
                part.highlighted ? (
                  <blockquote
                    key={index}
                    className="my-4 pl-4 py-4 pr-4 border-l-4 border-green-400
                      bg-gradient-to-r from-green-100/90 to-emerald-50/70 rounded-r-xl
                      text-green-900 font-bold text-[17px] leading-7
                      shadow-sm animate-highlight-glow"
                  >
                    <span className="text-green-500 mr-1">&ldquo;</span>
                    {part.text}
                    <span className="text-green-500 ml-1">&rdquo;</span>
                  </blockquote>
                ) : (
                  <span key={index}>{part.text}</span>
                )
              )}
            </div>

            {timestamp && (
              <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-green-100/60">
                <span className="text-xs text-green-400">{timestamp}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
