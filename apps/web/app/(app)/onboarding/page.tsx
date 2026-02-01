'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import type { ChildProfile } from '../../../../../shared/types/auth';

const PARENTING_TYPES = [
  { value: 'dual_income', label: '맞벌이', emoji: '👫', description: '부부 모두 직장 생활' },
  { value: 'single_income', label: '외벌이', emoji: '🏠', description: '한 분이 육아 전담' },
  { value: 'single_parent', label: '한부모', emoji: '💪', description: '혼자서 육아' },
  { value: 'other', label: '기타', emoji: '🌈', description: '조부모, 공동양육 등' },
];

function calculateAge(birthDate: string): string {
  const [year, month] = birthDate.split('-').map(Number);
  const now = new Date();
  const years = now.getFullYear() - year;
  const months = now.getMonth() + 1 - month;
  const totalMonths = years * 12 + months;

  if (totalMonths < 12) return `${totalMonths}개월`;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  return m > 0 ? `${y}세 ${m}개월` : `${y}세`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<'name' | 'parenting' | 'children' | 'done'>('name');
  const [displayName, setDisplayName] = useState('');
  const [parentingType, setParentingType] = useState('');
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [saving, setSaving] = useState(false);
  const [existingProfile, setExistingProfile] = useState(false);

  // 기존 프로필 로드
  useEffect(() => {
    const load = async () => {
      try {
        if (!authApi.isAuthenticated()) {
          router.push('/login');
          return;
        }
        const { user } = await authApi.getMe();
        if (user.displayName) setDisplayName(user.displayName);
        if (user.parentingType) setParentingType(user.parentingType);
        if (user.childProfiles && Array.isArray(user.childProfiles)) {
          setChildren(user.childProfiles as ChildProfile[]);
          setExistingProfile(true);
        }
      } catch {
        // ignore
      }
    };
    load();
  }, [router]);

  const addChild = () => {
    setChildren((prev) => [...prev, { birthDate: '', gender: undefined, name: undefined }]);
  };

  const updateChild = (index: number, field: keyof ChildProfile, value: string) => {
    setChildren((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, [field]: value || undefined } : c
      )
    );
  };

  const removeChild = (index: number) => {
    setChildren((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const validChildren = children.filter((c) => c.birthDate);
      await authApi.updateProfile({
        displayName: displayName.trim() || undefined,
        parentingType: parentingType || undefined,
        childProfiles: validChildren.length > 0 ? validChildren : undefined,
      });
      setStep('done');
    } catch (error: any) {
      alert(error.message || '저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
      {/* 진행 표시 */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {['name', 'parenting', 'children'].map((s, i) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all ${
              ['name', 'parenting', 'children'].indexOf(step === 'done' ? 'children' : step) >= i
                ? 'bg-green-500 w-12'
                : 'bg-gray-200 w-8'
            }`}
          />
        ))}
      </div>

      {/* Step 1: 이름 */}
      {step === 'name' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-4">🌲</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              반가워요!
            </h1>
            <p className="text-gray-600">
              어떻게 불러드리면 좋을까요?
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="예: 지우맘, 서준아빠"
              className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-base"
              autoFocus
            />
            <p className="text-xs text-gray-400 text-center">
              상담 시 이 이름으로 불러드려요
            </p>
          </div>

          <button
            onClick={() => setStep('parenting')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
          >
            다음
          </button>
        </div>
      )}

      {/* Step 2: 양육 환경 */}
      {step === 'parenting' && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              양육 환경이 어떻게 되세요?
            </h1>
            <p className="text-gray-600 text-sm">
              상황에 맞는 공감을 드리기 위해 여쭤봐요
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {PARENTING_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setParentingType(type.value)}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  parentingType === type.value
                    ? 'border-green-500 bg-green-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{type.emoji}</div>
                <div className="font-semibold text-gray-900 text-sm">{type.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{type.description}</div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('name')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl transition-colors"
            >
              뒤로
            </button>
            <button
              onClick={() => setStep('children')}
              className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 아이 정보 */}
      {step === 'children' && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              아이 정보를 알려주세요
            </h1>
            <p className="text-gray-600 text-sm">
              연령에 맞는 맞춤 상담을 위해 필요해요
            </p>
          </div>

          <div className="space-y-4">
            {children.map((child, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {index + 1}번째 아이
                  </span>
                  <button
                    onClick={() => removeChild(index)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    삭제
                  </button>
                </div>

                <input
                  type="text"
                  value={child.name || ''}
                  onChange={(e) => updateChild(index, 'name', e.target.value)}
                  placeholder="이름 또는 별명 (선택)"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">생년월</label>
                    <input
                      type="month"
                      value={child.birthDate || ''}
                      onChange={(e) => updateChild(index, 'birthDate', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">성별 (선택)</label>
                    <select
                      value={child.gender || ''}
                      onChange={(e) => updateChild(index, 'gender', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
                    >
                      <option value="">선택 안함</option>
                      <option value="boy">남아</option>
                      <option value="girl">여아</option>
                      <option value="other">기타</option>
                    </select>
                  </div>
                </div>

                {child.birthDate && (
                  <p className="text-xs text-green-600">
                    현재 {calculateAge(child.birthDate)}
                  </p>
                )}
              </div>
            ))}

            {children.length < 5 && (
              <button
                onClick={addChild}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors text-sm font-medium"
              >
                + 아이 추가
              </button>
            )}

            {children.length === 0 && (
              <p className="text-center text-sm text-gray-400">
                아이 정보를 추가하면 더 맞춤형 상담을 받을 수 있어요
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('parenting')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl transition-colors"
            >
              뒤로
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-[2] bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              {saving ? '저장 중...' : '완료'}
            </button>
          </div>
        </div>
      )}

      {/* 완료 */}
      {step === 'done' && (
        <div className="text-center space-y-6 py-8">
          <div className="text-6xl">🌿</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              준비가 되었어요!
            </h1>
            <p className="text-gray-600">
              {displayName ? `${displayName}님, ` : ''}이제 더 맞춤화된 상담을 받을 수 있어요
            </p>
          </div>

          {children.filter((c) => c.birthDate).length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left">
              <p className="text-sm font-medium text-green-800 mb-2">등록된 아이 정보:</p>
              {children
                .filter((c) => c.birthDate)
                .map((child, i) => (
                  <p key={i} className="text-sm text-green-700">
                    {child.name || `${i + 1}번째 아이`} — {calculateAge(child.birthDate)}
                    {child.gender === 'boy' ? ' 남아' : child.gender === 'girl' ? ' 여아' : ''}
                  </p>
                ))}
            </div>
          )}

          <button
            onClick={() => router.push('/vent')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
          >
            상담 시작하기
          </button>
        </div>
      )}

      {/* 건너뛰기 */}
      {step !== 'done' && (
        <div className="text-center mt-4">
          <button
            onClick={() => router.push('/vent')}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            나중에 할게요
          </button>
        </div>
      )}
    </div>
  );
}
