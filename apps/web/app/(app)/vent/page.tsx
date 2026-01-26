'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { reflectionApi } from '@/lib/api/reflections';
import type { EmotionTag } from '../../../../../shared/types/reflection';
import VoiceInput from './components/VoiceInput';

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

export default function VentPage() {
  const router = useRouter();
  const [step, setStep] = useState<'emotion' | 'write' | 'processing'>('emotion');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionTag | null>(null);
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
    setContent('');
    setAiResponse('');
    setReflectionId(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Step 1: 감정 선택 */}
      {step === 'emotion' && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              오늘 어떤 감정을 느끼셨나요?
            </h1>
            <p className="text-gray-600">
              감정 태그를 선택하면 더 맞춤형 응답을 받을 수 있어요 (선택사항)
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {EMOTION_TAGS.map((emotion) => (
              <button
                key={emotion.value}
                onClick={() => handleEmotionSelect(emotion.value)}
                className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all text-center"
              >
                <div className="text-4xl mb-2">{emotion.emoji}</div>
                <div className="font-semibold text-gray-900">{emotion.label}</div>
              </button>
            ))}
          </div>

          <div className="text-center pt-4">
            <button
              onClick={() => setStep('write')}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              건너뛰기 →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 감정 작성 */}
      {step === 'write' && (
        <div className="space-y-6">
          <div className="text-center">
            {selectedEmotion && (
              <div className="inline-block mb-4">
                <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                  {EMOTION_TAGS.find((e) => e.value === selectedEmotion)?.emoji}{' '}
                  {EMOTION_TAGS.find((e) => e.value === selectedEmotion)?.label}
                </span>
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              오늘 하루 어떠셨나요?
            </h1>
            <p className="text-gray-600">
              힘들었던 일, 자책했던 순간을 자유롭게 털어놓으세요
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="예: 오늘 아이에게 소리를 질렀어요. 너무 피곤했고 여러 번 말해도 듣지 않아서 결국 화를 냈습니다. 나는 형편없는 부모인 것 같아요..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
              autoFocus
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {content.length} / 5000
              </span>
              <span className="text-xs text-gray-400">
                💡 솔직하게 털어놓을수록 더 도움이 됩니다
              </span>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="mb-2 text-sm font-medium text-gray-700">
                또는 음성으로 표현하기
              </div>
              <VoiceInput
                onTranscriptChange={(text) => setContent((prev) => prev + ' ' + text)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setStep('emotion')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 rounded-lg transition-colors"
            >
              ← 뒤로
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-lg transition-colors"
            >
              AI에게 전달하기 →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: AI 응답 */}
      {step === 'processing' && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI가 응답하고 있습니다
            </h1>
          </div>

          {/* 사용자 메시지 */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  나
                </div>
              </div>
              <div className="flex-1">
                <p className="text-gray-800 whitespace-pre-wrap">{content}</p>
              </div>
            </div>
          </div>

          {/* AI 응답 */}
          <div className="bg-green-50 rounded-xl p-6 border border-green-200 min-h-[200px]">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
                  🌲
                </div>
              </div>
              <div className="flex-1">
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                ) : (
                  <p className="text-gray-800 whitespace-pre-wrap">{aiResponse}</p>
                )}
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          {!loading && aiResponse && (
            <div className="flex space-x-4">
              <button
                onClick={handleNewReflection}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 rounded-lg transition-colors"
              >
                새로운 회고 작성
              </button>
              <button
                onClick={handleContinueConversation}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-lg transition-colors"
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
