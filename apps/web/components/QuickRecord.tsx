'use client';

import { useState } from 'react';
import { reflectionApi } from '@/lib/api/reflections';
import type { EmotionTag } from '../../../shared/types/reflection';
import AiMessageBubble from './AiMessageBubble';

const QUICK_EMOTIONS: { value: EmotionTag; emoji: string; label: string }[] = [
  { value: 'guilt', emoji: '😔', label: '죄책감' },
  { value: 'anger', emoji: '😤', label: '분노' },
  { value: 'exhaustion', emoji: '😫', label: '피로' },
  { value: 'anxiety', emoji: '😰', label: '불안' },
  { value: 'sadness', emoji: '😢', label: '슬픔' },
  { value: 'pride', emoji: '😊', label: '뿌듯' },
  { value: 'joy', emoji: '😁', label: '기쁨' },
  { value: 'gratitude', emoji: '🥰', label: '감사' },
];

interface QuickRecordProps {
  onSwitchToFull: () => void;
}

export default function QuickRecord({ onSwitchToFull }: QuickRecordProps) {
  const [emotion, setEmotion] = useState<EmotionTag | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const result = await reflectionApi.create({
        content: text.trim(),
        emotionTag: emotion || undefined,
        counselingStyle: 'nurturing',
      });
      setAiResponse(result.aiResponse.content);
    } catch (error: any) {
      alert(error.message || '기록에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmotion(null);
    setText('');
    setAiResponse(null);
  };

  // 결과 표시
  if (aiResponse) {
    return (
      <div className="space-y-4">
        {/* 내 기록 */}
        <div className="bg-blue-50 border border-blue-200/60 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            {emotion && (
              <span className="text-lg">
                {QUICK_EMOTIONS.find((e) => e.value === emotion)?.emoji}
              </span>
            )}
            <span className="text-xs text-blue-500 font-medium">내 기록</span>
          </div>
          <p className="text-sm text-gray-800">{text}</p>
        </div>

        {/* AI 응답 */}
        <AiMessageBubble
          content={aiResponse.replace(/\[CHOICE:.*?\]/g, '').replace(/\[INPUT:.*?\]/g, '').trim()}
          showAvatar={true}
        />

        {/* 액션 */}
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex-1 bg-white border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg text-sm hover:bg-gray-50"
          >
            새 기록
          </button>
          <button
            onClick={onSwitchToFull}
            className="flex-[2] bg-green-600 text-white font-medium py-2.5 rounded-lg text-sm hover:bg-green-700"
          >
            더 이야기하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 감정 빠른 선택 */}
      <div className="flex flex-wrap gap-2 justify-center">
        {QUICK_EMOTIONS.map((e) => (
          <button
            key={e.value}
            onClick={() => setEmotion(emotion === e.value ? null : e.value)}
            className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
              emotion === e.value
                ? 'border-green-500 bg-green-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {e.emoji} {e.label}
          </button>
        ))}
      </div>

      {/* 한 줄 입력 */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="오늘 하루를 한 줄로 남겨보세요..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm resize-none h-20"
          maxLength={500}
          autoFocus
        />
        <span className="absolute bottom-2 right-3 text-xs text-gray-400">
          {text.length}/500
        </span>
      </div>

      {/* 제출 */}
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            기록 중...
          </span>
        ) : (
          '기록하기'
        )}
      </button>

      {/* 전체 상담으로 전환 */}
      <button
        onClick={onSwitchToFull}
        className="w-full text-sm text-gray-400 hover:text-gray-600"
      >
        더 자세히 이야기하고 싶어요 →
      </button>
    </div>
  );
}
