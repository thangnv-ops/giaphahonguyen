/**
 * @project AncestorTree
 * @file src/app/(landing)/council/council-content.tsx
 * @description Client component for council page — fetches clan settings
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { useClanSettings } from '@/hooks/use-clan-settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, BookOpen, Target } from 'lucide-react';
import Link from 'next/link';
import type { CouncilMember } from '@/types';

export function CouncilContent() {
  const { data: cs, isLoading } = useClanSettings();

  const councilMembers = (cs?.council_members ?? []) as CouncilMember[];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <Skeleton className="h-10 w-64 mx-auto" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Hội đồng gia tộc
        </h1>
        <p className="text-lg text-gray-600">
          {cs?.clan_full_name ?? 'Gia Phả Điện Tử'}
        </p>
      </div>

      {/* Council members */}
      {councilMembers.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ban quản trị
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {councilMembers.map((m, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg shrink-0">
                    {m.name?.charAt(m.name.lastIndexOf(' ') + 1) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-sm text-gray-500">{m.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* History */}
      {cs?.clan_history && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Lịch sử dòng họ
          </h2>
          <Card>
            <CardContent className="py-6 prose prose-gray max-w-none">
              <p className="whitespace-pre-line">{cs.clan_history}</p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Mission */}
      {cs?.clan_mission && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Sứ mệnh & Tầm nhìn
          </h2>
          <Card>
            <CardContent className="py-6 prose prose-gray max-w-none">
              <p className="whitespace-pre-line">{cs.clan_mission}</p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Clan info */}
      {(cs?.clan_patriarch || cs?.clan_origin || cs?.clan_founding_year) && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cs.clan_patriarch && (
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-sm text-gray-500">Thủy tổ</span>
                  <span className="text-sm font-medium">{cs.clan_patriarch}</span>
                </div>
              )}
              {cs.clan_founding_year && (
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-sm text-gray-500">Năm thành lập</span>
                  <span className="text-sm font-medium">{cs.clan_founding_year}</span>
                </div>
              )}
              {cs.clan_origin && (
                <div className="flex justify-between py-1.5">
                  <span className="text-sm text-gray-500">Quê gốc</span>
                  <span className="text-sm font-medium">{cs.clan_origin}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* No data fallback */}
      {councilMembers.length === 0 && !cs?.clan_history && !cs?.clan_mission && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>Thông tin hội đồng gia tộc chưa được cập nhật.</p>
            <p className="text-sm mt-1">Vui lòng liên hệ ban quản trị.</p>
          </CardContent>
        </Card>
      )}

      {/* Navigation links */}
      <div className="flex flex-wrap gap-3 justify-center pt-4">
        <Link href="/welcome" className="text-sm text-primary hover:underline">
          Trang chủ
        </Link>
        <span className="text-gray-300">|</span>
        <Link href="/ancestral-hall" className="text-sm text-primary hover:underline">
          Nhà thờ họ
        </Link>
        <span className="text-gray-300">|</span>
        <Link href="/register-member" className="text-sm text-primary hover:underline">
          Đăng ký thành viên
        </Link>
      </div>
    </div>
  );
}
