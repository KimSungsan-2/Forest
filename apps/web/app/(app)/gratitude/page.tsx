'use client';

import { useState, useEffect } from 'react';
import { reflectionApi } from '@/lib/api/reflections';
import AiMessageBubble from '@/components/AiMessageBubble';
import CounselingLoader from '@/components/CounselingLoader';

const GRATITUDE_PROMPTS = [
  '오늘 아이와 함께해서 좋았던 순간은?',
  '오늘 나를 웃게 만든 것은?',
  '오늘 감사한 작은 것 하나는?',
  '오늘 뿌듯했던 순간이 있다면?',
  '오늘 마음이 따뜻해진 순간은?',
];

export default function GratitudePage() {
  const [gratitudes, setGratitudes] = useState<string[]>(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [todayPrompt, setTodayPrompt] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // 오늘 날짜 기반으로 프롬프트 선택 (매일 다른 질문)
    const dayIndex = new Date().getDate() % GRATITUDE_PROMPTS.length;
    setTodayPrompt(GRATITUDE_PROMPTS[dayIndex]);
  }, []);

  const handleGratitudeChange = (index: number, value: string) => {
    const newGratitudes = [...gratitudes];
    newGratitudes[index] = value;
    setGratitudes(newGratitudes);
  };

  const filledCount = gratitudes.filter((g) => g.trim()).length;

  const handleSubmit = async () => {
    const filled = gratitudes.filter((g) => g.trim());
    if (filled.length === 0) return;

    setLoading(true);
    try {
      // 감사 일기 형식으로 전송 (gratitude 감정 태그 사용)
      const content = `[오늘의 감사 일기]\n\n${filled.map((g, i) => `${i + 1}. ${g}`).join('\n')}`;

      const result = await reflectionApi.create({
        content,
        emotionTag: 'gratitude',
        counselingStyle: 'nurturing',
      });

      setAiResponse(result.aiResponse.content);
      setSubmitted(true);
    } catch (error: any) {
      alert(error.message || '저장에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setGratitudes(['', '', '']);
    setAiResponse(null);
    setSubmitted(false);
  };

  // 제출 완료 화면
  if (submitted && aiResponse) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-lg mb-4">
            <span className="text-3xl">🌻</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">감사 기록 완료!</h1>
          <p className="text-gray-600 mt-1">오늘도 감사한 마음을 기록했어요</p>
        </div>

        {/* 내가 기록한 감사 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">✨</span>
            <span className="text-sm font-medium text-amber-700">오늘의 감사</span>
          </div>
          {gratitudes.filter((g) => g.trim()).map((g, i) => (
            <p key={i} className="text-gray-800 text-sm pl-6">
              {i + 1}. {g}
            </p>
          ))}
        </div>

        {/* AI 응답 */}
        <AiMessageBubble
          content={aiResponse.replace(/\[CHOICE:.*?\]/g, '').replace(/\[INPUT:.*?\]/g, '').trim()}
          showAvatar={true}
        />

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 bg-white border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            새로운 감사 기록
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="flex-[2] bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium py-3 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md"
          >
            대시보드로 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-lg mb-4">
          <span className="text-3xl">🌻</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">오늘의 감사</h1>
        <p className="text-gray-600 mt-1">작은 것이라도 좋아요. 감사한 마음을 기록해보세요</p>
      </div>

      {/* 오늘의 질문 */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 text-center">
        <p className="text-sm text-amber-600 font-medium mb-1">오늘의 질문</p>
        <p className="text-gray-800 font-medium">{todayPrompt}</p>
      </div>

      {/* 감사 입력 카드 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">감사한 것 1~3가지</span>
          <span className="text-sm text-amber-600 font-medium">{filledCount}/3</span>
        </div>

        {[0, 1, 2].map((index) => (
          <div key={index} className="relative">
            <span className="absolute left-3 top-3 text-amber-400 font-medium">{index + 1}.</span>
            <input
              type="text"
              value={gratitudes[index]}
              onChange={(e) => handleGratitudeChange(index, e.target.value)}
              placeholder={
                index === 0
                  ? '예: 아이가 "사랑해" 라고 말해줬다'
                  : index === 1
                  ? '예: 따뜻한 커피 한 잔의 여유'
                  : '예: 건강하게 하루를 보낸 것'
              }
              className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-sm"
              maxLength={100}
            />
          </div>
        ))}

        {/* 제출 버튼 */}
        {loading ? (
          <CounselingLoader isFollowUp={true} />
        ) : (
          <button
            onClick={handleSubmit}
            disabled={filledCount === 0}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:shadow-none"
          >
            {filledCount === 0 ? '감사한 것을 하나 이상 적어주세요' : `감사 기록하기 (${filledCount}개)`}
          </button>
        )}
      </div>

      {/* 팁 */}
      <div className="text-center text-sm text-gray-500 space-y-1">
        <p>💡 매일 감사를 기록하면 행복감이 25% 증가한다는 연구가 있어요</p>
        <p className="text-xs text-gray-400">— Robert Emmons, UC Davis 심리학 교수</p>
      </div>
    </div>
  );
}
