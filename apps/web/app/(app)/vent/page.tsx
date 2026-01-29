'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
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

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

interface InteractiveElement {
  type: 'choice' | 'input';
  options?: string[];
  placeholder?: string;
}

function parseInteractiveElements(text: string): {
  cleanText: string;
  elements: InteractiveElement[];
} {
  const elements: InteractiveElement[] = [];
  let cleanText = text;

  // Parse [CHOICE: "opt1" | "opt2" | "opt3"]
  const choiceRegex = /\[CHOICE:\s*(.+?)\]/g;
  let match;
  while ((match = choiceRegex.exec(text)) !== null) {
    const optionsStr = match[1];
    const options = optionsStr
      .split('|')
      .map((opt) => opt.trim().replace(/^["""](.+?)["""]$/, '$1'));
    elements.push({ type: 'choice', options });
    cleanText = cleanText.replace(match[0], '');
  }

  // Parse [INPUT: "placeholder"]
  const inputRegex = /\[INPUT:\s*["""](.+?)["""]\]/g;
  while ((match = inputRegex.exec(text)) !== null) {
    elements.push({ type: 'input', placeholder: match[1] });
    cleanText = cleanText.replace(match[0], '');
  }

  return { cleanText: cleanText.trim(), elements };
}

export default function VentPage() {
  const router = useRouter();
  const [step, setStep] = useState<'emotion' | 'write' | 'chatting'>('emotion');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionTag | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<CounselingStyle>('nurturing');
  const [content, setContent] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [reflectionId, setReflectionId] = useState<string | null>(null);
  const [isCounselingComplete, setIsCounselingComplete] = useState(false);
  const [finalAiResponse, setFinalAiResponse] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const handleEmotionSelect = (emotion: EmotionTag) => {
    setSelectedEmotion(emotion);
    setStep('write');
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setChatLoading(true);
    setStep('chatting');
    setMessages([{ role: 'user', content: content.trim() }]);

    try {
      const result = await reflectionApi.create({
        content: content.trim(),
        emotionTag: selectedEmotion || undefined,
        counselingStyle: selectedStyle,
      });

      setReflectionId(result.reflection.id);
      const aiContent = result.aiResponse.content;
      const { elements } = parseInteractiveElements(aiContent);

      setMessages((prev) => [...prev, { role: 'assistant', content: aiContent }]);

      if (elements.length === 0) {
        setIsCounselingComplete(true);
        setFinalAiResponse(aiContent);
      }
    } catch (error: any) {
      alert(error.message || '상담 시작에 실패했습니다');
      setStep('write');
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatResponse = async (response: string) => {
    if (!response.trim() || !reflectionId || chatLoading) return;

    setChatLoading(true);
    setChatInput('');
    setMessages((prev) => [...prev, { role: 'user', content: response }]);

    try {
      const aiResponse = await reflectionApi.sendMessage({
        reflectionId,
        content: response,
        counselingStyle: selectedStyle,
      });

      const aiContent = aiResponse.content;
      const { elements } = parseInteractiveElements(aiContent);

      setMessages((prev) => [...prev, { role: 'assistant', content: aiContent }]);

      if (elements.length === 0) {
        setIsCounselingComplete(true);
        setFinalAiResponse(aiContent);
      }
    } catch (error: any) {
      alert(error.message || '메시지 전송에 실패했습니다');
    } finally {
      setChatLoading(false);
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
    setMessages([]);
    setReflectionId(null);
    setIsCounselingComplete(false);
    setFinalAiResponse('');
    setChatInput('');
  };

  // Get interactive elements from the latest AI message
  const latestInteractive = useMemo(() => {
    if (isCounselingComplete || chatLoading) return null;
    const lastAiMsg = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAiMsg) return null;
    const { elements } = parseInteractiveElements(lastAiMsg.content);
    return elements.length > 0 ? elements : null;
  }, [messages, isCounselingComplete, chatLoading]);

  // Collect all user content for the counseling cards
  const allUserContent = useMemo(() => {
    return messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('\n');
  }, [messages]);

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
                disabled={chatLoading}
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
              disabled={!content.trim() || chatLoading}
              className="flex-[2] bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3.5 sm:py-4 rounded-lg transition-colors text-sm sm:text-base"
            >
              상담 시작하기
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 대화형 상담 */}
      {step === 'chatting' && (
        <div className="space-y-4">
          {/* 헤더 */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-lg">
              <span className="text-xl sm:text-2xl">🌲</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
              숲의 상담사
            </h1>
            {!isCounselingComplete && (
              <p className="text-xs sm:text-sm text-gray-500">
                더 잘 도와드리기 위해 몇 가지 여쭤볼게요
              </p>
            )}
          </div>

          {/* 대화 메시지들 */}
          <div className="space-y-3 sm:space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx}>
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl rounded-tr-sm p-3 sm:p-4 shadow-sm">
                      <p className="text-sm sm:text-[15px] text-gray-800 whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <AiMessageBubble
                    content={parseInteractiveElements(msg.content).cleanText}
                    showAvatar={true}
                  />
                )}
              </div>
            ))}

            {/* 로딩 표시 */}
            {chatLoading && (
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
                      <span className="text-xs sm:text-sm text-green-600 font-medium">
                        {isCounselingComplete ? '상담을 준비하고 있어요...' : '당신의 이야기를 듣고 있어요...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 인터랙티브 응답 영역 */}
          {!chatLoading && latestInteractive && (
            <div className="space-y-3 bg-gradient-to-br from-green-50/80 to-emerald-50/80 rounded-xl p-3 sm:p-4 border border-green-200/60 shadow-sm">
              <p className="text-xs sm:text-sm text-green-700 font-medium">
                답변을 선택하거나 입력해주세요
              </p>
              {latestInteractive.map((el, idx) => (
                <div key={idx} className="space-y-2">
                  {el.type === 'choice' && el.options && (
                    <div className="flex flex-wrap gap-2">
                      {el.options.map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => handleChatResponse(opt)}
                          className="bg-white hover:bg-green-50 border-2 border-green-200 hover:border-green-400 text-gray-800 text-sm sm:text-base font-medium px-4 py-2.5 rounded-full transition-all active:scale-95 shadow-sm"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                  {el.type === 'input' && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleChatResponse(chatInput)}
                        placeholder={el.placeholder || '답변을 입력하세요...'}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm sm:text-base bg-white"
                        autoFocus
                      />
                      <button
                        onClick={() => handleChatResponse(chatInput)}
                        disabled={!chatInput.trim()}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2.5 rounded-full font-medium text-sm transition-colors"
                      >
                        전송
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 상담 완료 시 결과 표시 */}
          {isCounselingComplete && !chatLoading && (
            <>
              {/* 구분선 */}
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-200 to-transparent" />
                <span className="text-green-300 text-xs">🌿</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-200 to-transparent" />
              </div>

              {/* 상담 결과 카드 */}
              <CounselingResultCards
                emotion={selectedEmotion ? EMOTION_TAGS.find((e) => e.value === selectedEmotion)?.label : undefined}
                emotionEmoji={selectedEmotion ? EMOTION_TAGS.find((e) => e.value === selectedEmotion)?.emoji : undefined}
                userContent={allUserContent}
                aiContent={finalAiResponse}
              />

              {/* 액션 버튼 */}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
