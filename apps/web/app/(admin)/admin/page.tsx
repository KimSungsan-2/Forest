'use client';

import { useEffect, useState } from 'react';
import {
  getAdminSummary,
  getSubscriptions,
  getActiveUsers,
  getUsers,
  getTokenUsage,
  type AdminSummary,
  type SubscriptionBreakdown,
  type ActiveUsersData,
  type UserListResponse,
  type TokenUsageData,
} from '@/lib/api/admin';

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  premium: 'Premium',
  family: 'Family',
};

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [subs, setSubs] = useState<SubscriptionBreakdown[]>([]);
  const [active7, setActive7] = useState<ActiveUsersData | null>(null);
  const [active30, setActive30] = useState<ActiveUsersData | null>(null);
  const [userList, setUserList] = useState<UserListResponse | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadUsers(page);
  }, [page]);

  async function loadData() {
    try {
      const [s, sub, a7, a30, u, t] = await Promise.all([
        getAdminSummary(),
        getSubscriptions(),
        getActiveUsers(7),
        getActiveUsers(30),
        getUsers(1, 20),
        getTokenUsage(30),
      ]);
      setSummary(s);
      setSubs(sub);
      setActive7(a7);
      setActive30(a30);
      setUserList(u);
      setTokenUsage(t);
    } catch (err: any) {
      setError(err.message || '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers(p: number) {
    try {
      const u = await getUsers(p, 20);
      setUserList(u);
    } catch {
      // ignore pagination errors
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <p className="text-red-400 text-sm mt-1">관리자 권한이 있는지 확인해주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">전체 요약</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="총 유저" value={summary?.totalUsers ?? 0} />
          <StatCard label="총 회고" value={summary?.totalReflections ?? 0} />
          <StatCard label="총 대화" value={summary?.totalConversations ?? 0} />
          <StatCard label="오늘 신규 유저" value={summary?.newUsersToday ?? 0} />
          <StatCard label="오늘 회고" value={summary?.reflectionsToday ?? 0} />
        </div>
      </section>

      {/* Active Users & Token Usage */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">7일 활성 유저</p>
          <p className="text-2xl font-bold text-emerald-600">
            {active7?.activeUsers ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">30일 활성 유저</p>
          <p className="text-2xl font-bold text-emerald-600">
            {active30?.activeUsers ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">30일 토큰 사용</p>
          <p className="text-2xl font-bold text-blue-600">
            {(tokenUsage?.totalTokens ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            AI 응답 {tokenUsage?.totalResponses ?? 0}회
          </p>
        </div>
      </section>

      {/* Subscription Breakdown */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">구독 분포</h2>
        <div className="grid grid-cols-3 gap-4">
          {subs.map((s) => (
            <div
              key={s.tier}
              className="bg-white rounded-xl border border-gray-200 p-5 text-center"
            >
              <p className="text-sm text-gray-500">{TIER_LABELS[s.tier] || s.tier}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* User List */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          유저 목록{' '}
          <span className="text-sm font-normal text-gray-400">
            ({userList?.total ?? 0}명)
          </span>
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    이메일
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    이름
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">
                    구독
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">
                    회고 수
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    가입일
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    마지막 로그인
                  </th>
                </tr>
              </thead>
              <tbody>
                {userList?.users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-gray-900">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {u.displayName || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          u.subscriptionTier === 'premium'
                            ? 'bg-amber-100 text-amber-700'
                            : u.subscriptionTier === 'family'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {TIER_LABELS[u.subscriptionTier] || u.subscriptionTier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {u.reflectionCount}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleDateString('ko-KR')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {userList && userList.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                {userList.page} / {userList.totalPages} 페이지
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >
                  이전
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(userList.totalPages, p + 1))
                  }
                  disabled={page === userList.totalPages}
                  className="px-3 py-1 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
