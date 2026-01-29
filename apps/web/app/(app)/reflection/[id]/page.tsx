'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { reflectionApi } from '@/lib/api/reflections';
import type { Reflection, Conversation } from '../../../../../../shared/types/reflection';
import AiMessageBubble from '@/components/AiMessageBubble';

export default function ReflectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [recommendedAction, setRecommendedAction] = useState<string | null>(null);
  const [endingSession, setEndingSession] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReflection();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  const loadReflection = async () => {
    setLoading(true);
    try {
      const data = await reflectionApi.getById(id);
      setReflection(data.reflection);
      setConversations(data.conversations);
      if (data.reflection.recommendedAction) {
        setRecommendedAction(data.reflection.recommendedAction);
      }
    } catch (error) {
      console.error('Failed to load reflection:', error);
      alert('회고를 불러오는데 실패했습니다');
      router.push('/history');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const userMessage = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // 사용자 메시지를 즉시 UI에 추가
    const tempUserMessage: Conversation = {
      id: 'temp-' + Date.now(),
      reflectionId: id,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setConversations((prev) => [...prev, tempUserMessage]);

    try {
      const aiResponse = await reflectionApi.sendMessage({
        reflectionId: id,
        content: userMessage,
      });

      // AI 응답 추가
      setConversations((prev) => [...prev, aiResponse]);
    } catch (error: any) {
      alert(error.message || '메시지 전송에 실패했습니다');
      // 실패 시 임시 메시지 제거
      setConversations((prev) => prev.filter((c) => c.id !== tempUserMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleEndSession = async () => {
    setEndingSession(true);
    try {
      const result = await reflectionApi.endSession(id);
      setRecommendedAction(result.recommendedAction);
    } catch (error: any) {
      alert(error.message || '추천 액션 생성에 실패했습니다');
    } finally {
      setEndingSession(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 회고를 삭제하시겠습니까?')) return;

    try {
      await reflectionApi.delete(id);
      router.push('/history');
    } catch (error) {
      alert('삭제에 실패했습니다');
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!reflection) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/history')}
          className="text-gray-600 hover:text-gray-800 mb-4 flex items-center space-x-2"
        >
          <span>←</span>
          <span>히스토리로 돌아가기</span>
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {reflection.title}
              </h1>
              <p className="text-sm text-gray-500">{formatDate(reflection.createdAt)}</p>
            </div>
            <button
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              삭제
            </button>
          </div>

          {/* 메타데이터 */}
          <div className="flex flex-wrap gap-4 text-sm">
            {reflection.emotionalTone && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                감정: {reflection.emotionalTone}
              </span>
            )}
            {reflection.sentimentScore !== null && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                점수: {reflection.sentimentScore.toFixed(2)}
              </span>
            )}
            {reflection.stressLevel && (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                스트레스: {reflection.stressLevel}/10
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 대화 내역 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 max-h-[600px] overflow-y-auto">
        <div className="space-y-6">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`flex ${
                conversation.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {conversation.role === 'assistant' ? (
                <AiMessageBubble
                  content={conversation.content}
                  timestamp={formatTime(conversation.timestamp)}
                  className="max-w-[80%]"
                />
              ) : (
                <div className="max-w-[80%] bg-blue-50 border-blue-200 rounded-xl p-4 border">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {conversation.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatTime(conversation.timestamp)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      나
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 추천 액션 카드 */}
      {recommendedAction && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-200 p-6 mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center text-white text-xl">
              🌱
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-900 mb-2">
                내일을 위한 추천 액션
              </h3>
              <p className="text-amber-800 whitespace-pre-wrap leading-relaxed">
                {recommendedAction}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 메시지 입력 */}
      {!recommendedAction ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="계속 대화하기..."
              disabled={sending}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:bg-gray-100"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
            >
              {sending ? '전송 중...' : '전송'}
            </button>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              💡 더 깊이 탐구하고 싶은 부분이 있다면 자유롭게 물어보세요
            </p>
            <button
              onClick={handleEndSession}
              disabled={endingSession || conversations.length < 2}
              className="text-sm text-orange-600 hover:text-orange-700 disabled:text-gray-400 font-medium transition-colors"
            >
              {endingSession ? '생성 중...' : '상담 마무리하기'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <button
            onClick={() => router.push('/vent')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
          >
            새로운 상담 시작하기
          </button>
        </div>
      )}
    </div>
  );
}
