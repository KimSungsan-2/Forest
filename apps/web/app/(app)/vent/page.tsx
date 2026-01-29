'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { reflectionApi } from '@/lib/api/reflections';
import type { EmotionTag, CounselingStyle } from '../../../../../shared/types/reflection';
import VoiceInput from './components/VoiceInput';
import AiMessageBubble from '@/components/AiMessageBubble';
import CounselingResultCards from '@/components/CounselingResultCards';

const EMOTION_TAGS: { value: EmotionTag; label: string; emoji: string }[] = [
  { value: 'guilt', label: '죄책감', emoji: '😔' },
  { value: 'anger', label: '분노', emoji: '😤' },
  { value: 'exhaustion', label: '피로', emoji: '😫' },
  { value: 'anxiety', label: '불안', emoji: '😰' },
  { value: 'sadness', label: '슬픔', emoji: '😢' },
  { value: 'frustration', label: '좌절', emoji: '😣' },
  { value: 'overwhelm', label: '압도됨', emoji: '😵' },
  { value: 'loneliness', label: '외로움', emoji: '😞' },
];

const COUNSELING_STYLES: { value: CounselingStyle; label: string; emoji: string; description: string }[] = [
  { value: 'nurturing', label: '다독이는', emoji: '🤗', description: '따뜻하고 부드러운 위로' },
  { value: 'humorous', label: '유머러스', emoji: '😄', description: '가볍고 유쾌한 상담' },
  { value: 'direct', label: '명확한 T', emoji: '🧠', description: '논리적이고 팩트 중심' },
];

export default function VentPage() {
  const router = useRouter();
  const [step, setStep] = useState<'emotion' | 'write' | 'processing'>('emotion');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionTag | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<CounselingStyle>('nurturing');
  const [content, setContent] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [reflectionId, setReflectionId] = useState<string | null>(null);

  const handleEmotionSelect = (emotion: EmotionTag) => {
    setSelectedEmotion(emotion);
    setStep('write');
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setLoading(true);
    setStep('processing');
    setAiResponse('');

    try {
      const result = await reflectionApi.create({
        content: content.trim(),
        emotionTag: selectedEmotion || undefined,
        counselingStyle: selectedStyle,
      });

      setReflectionId(result.reflection.id);
      setAiResponse(result.aiResponse.content);
    } catch (error: any) {
      alert(error.message || '회고 생성에 실패했습니다');
      setStep('write');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueConversation = () => {
    if (reflectionId) {
      router.push(`/reflection/${reflectionId}`);
    }
  };

  const handleNewReflection = () => {
    setStep('emotion');
    setSelectedEmotion(null);
    setSelectedStyle('nurturing');
    setContent('');
    setAiResponse('');
    setReflectionId(null);
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Step 1: 감정 선택 */}
      {step === 'emotion' && (
        <div className="space-y-5">
          <div className="text-center px-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5">
              오늘 어떤 감정을 느끼셨나요?
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              감정을 선택하면 맞춤 상담을 받을 수 있어요
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {EMOTION_TAGS.map((emotion) => (
              <button
                key={emotion.value}
                onClick={() => handleEmotionSelect(emotion.value)}
                className="bg-white p-3 sm:p-5 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 active:scale-95 transition-all text-center"
              >
                <div className="text-2xl sm:text-4xl mb-1">{emotion.emoji}</div>
                <div className="text-xs sm:text-sm font-semibold text-gray-900">{emotion.label}</div>
              </button>
            ))}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setStep('write')}
              className="text-green-600 hover:text-green-700 font-medium text-sm sm:text-base"
            >
              건너뛰기 →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 감정 작성 */}
      {step === 'write' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center px-2">
            {selectedEmotion && (
              <div className="inline-block mb-3">
                <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium">
                  {EMOTION_TAGS.find((e) => e.value === selectedEmotion)?.emoji}{' '}
                  {EMOTION_TAGS.find((e) => e.value === selectedEmotion)?.label}
                </span>
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5">
              오늘 하루 어떠셨나요?
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              힘들었던 일, 자책했던 순간을 자유롭게 털어놓으세요
            </p>
          </div>

          {/* 상담 스타일 선택 */}
          <div className="flex justify-center gap-2 sm:gap-3 px-1">
            {COUNSELING_STYLES.map((style) => (
              <button
                key={style.value}
                onClick={() => setSelectedStyle(style.value)}
                className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all border-2 ${
                  selectedStyle === style.value
                    ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="mr-1">{style.emoji}</span>
                {style.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="예: 오늘 아이에게 소리를 질렀어요. 너무 피곤했고 여러 번 말해도 듣지 않아서 결국 화를 냈습니다..."
              className="w-full h-48 sm:h-64 p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none text-sm sm:text-base"
              autoFocus
            />
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-500">
                {content.length} / 5000
              </span>
              <span className="text-xs text-gray-400 hidden sm:inline">
                솔직하게 털어놓을수록 더 도움이 됩니다
              </span>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="mb-2 text-xs sm:text-sm font-medium text-gray-700">
                또는 음성으로 표현하기
              </div>
              <VoiceInput
                onTranscriptChange={(text) => setContent((prev) => prev + ' ' + text)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('emotion')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 sm:py-4 rounded-lg transition-colors text-sm sm:text-base"
            >
              ← 뒤로
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || loading}
              className="flex-[2] bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3.5 sm:py-4 rounded-lg transition-colors text-sm sm:text-base"
            >
              상담 시작하기
            </button>
          </div>
        </div>
      )}

      {/* Step 3: AI 응답 */}
      {step === 'processing' && (
        <div className="space-y-5 sm:space-y-8">
          {/* 헤더 영역 */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-lg mb-1">
              <span className="text-2xl sm:text-3xl">🌲</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
              {loading ? '숲이 당신의 이야기를 듣고 있어요' : '숲이 전하는 이야기'}
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm">
              {loading ? '따뜻한 마음으로 읽고 있어요...' : '당신을 위한 따뜻한 메시지입니다'}
            </p>
          </div>

          {/* 구분선 */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-200 to-transparent" />
            <span className="text-green-300 text-xs">🌿</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-200 to-transparent" />
          </div>

          {/* 사용자 메시지 */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200/60 shadow-sm">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100/30 rounded-full translate-x-4 -translate-y-4" />
            <div className="relative flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-md">
                  나
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] sm:text-xs font-semibold text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-full">
                  나의 이야기
                </span>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed sm:leading-7 mt-2 text-sm sm:text-[15px] break-words">{content}</p>
              </div>
            </div>
          </div>

          {/* AI 응답 */}
          <div className="min-h-[150px] sm:min-h-[200px]">
            {loading ? (
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50" />
                <div className="relative h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400" />
                <div className="relative p-4 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl shadow-lg">
                      🌲
                    </div>
                    <div className="flex flex-col space-y-2 pt-1">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                      </div>
                      <span className="text-xs sm:text-sm text-green-600 font-medium">당신의 이야기를 듣고 있어요...</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <AiMessageBubble content={aiResponse} />
            )}
          </div>

          {/* 상담 전/후 애니메이션 카드 */}
          {!loading && aiResponse && (
            <CounselingResultCards
              emotion={selectedEmotion ? EMOTION_TAGS.find((e) => e.value === selectedEmotion)?.label : undefined}
              emotionEmoji={selectedEmotion ? EMOTION_TAGS.find((e) => e.value === selectedEmotion)?.emoji : undefined}
              userContent={content}
              aiContent={aiResponse}
            />
          )}

          {/* 액션 버튼 */}
          {!loading && aiResponse && (
            <div className="flex gap-3">
              <button
                onClick={handleNewReflection}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3.5 sm:py-4 rounded-xl transition-all border border-gray-200 shadow-sm hover:shadow text-sm sm:text-base"
              >
                새로운 상담
              </button>
              <button
                onClick={handleContinueConversation}
                className="flex-[2] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3.5 sm:py-4 rounded-xl transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
              >
                대화 계속하기 →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
