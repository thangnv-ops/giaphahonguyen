/**
 * @project AncestorTree
 * @file src/app/(landing)/ancestral-hall/ancestral-hall-content.tsx
 * @description Client component for ancestral hall — gallery, ceremony schedule, map
 * @version 1.1.0
 * @updated 2026-03-09
 */

'use client';

import { useState } from 'react';
import { useClanSettings } from '@/hooks/use-clan-settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Landmark, ImageIcon, Calendar, MapPin, BookOpen } from 'lucide-react';
import Link from 'next/link';
import type { CeremonyScheduleItem } from '@/types';

export function AncestralHallContent() {
  const { data: cs, isLoading } = useClanSettings();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const images = (cs?.ancestral_hall_images ?? []) as string[];
  const coords = cs?.ancestral_hall_coordinates as { lat: number; lng: number } | null;
  const ceremonies = (cs?.ceremony_schedule ?? []) as CeremonyScheduleItem[];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <Skeleton className="h-10 w-48 mx-auto" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
          <Landmark className="h-8 w-8" />
          Nhà thờ họ
        </h1>
        <p className="text-lg text-gray-600">
          {cs?.clan_full_name ?? 'Gia Phả Điện Tử'}
        </p>
      </div>

      {/* Image gallery */}
      {images.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Hình ảnh
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((url, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(url)}
                className="aspect-[4/3] rounded-lg overflow-hidden border hover:opacity-90 transition-opacity"
              >
                <img src={url} alt={`Nhà thờ họ ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Nhà thờ họ"
            className="max-w-full max-h-[85vh] rounded-lg"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Ancestral hall history */}
      {cs?.ancestral_hall_history && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Lịch sử nhà thờ
          </h2>
          <Card>
            <CardContent className="py-6">
              <p className="whitespace-pre-line text-gray-700">{cs.ancestral_hall_history}</p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Annual ceremony schedule — from clan_settings (no RLS issue) */}
      {ceremonies.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Lịch tế lễ hàng năm
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ceremonies.map((c, i) => (
              <Card key={i}>
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-sm font-semibold">{c.title}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-xs text-gray-500">
                    {c.lunar_date && <span>AL: {c.lunar_date} · </span>}
                    {c.solar_date}
                  </p>
                  {c.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{c.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Location — OpenStreetMap (no API key needed) */}
      {cs?.ancestral_hall_address && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Vị trí
          </h2>
          <Card>
            <CardContent className="py-4">
              <p className="text-gray-700">{cs.ancestral_hall_address}</p>
              {coords && (
                <div className="mt-3 rounded-lg overflow-hidden border h-64">
                  <iframe
                    title="Bản đồ nhà thờ họ"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.01},${coords.lat - 0.01},${coords.lng + 0.01},${coords.lat + 0.01}&layer=mapnik&marker=${coords.lat},${coords.lng}`}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* No data fallback */}
      {images.length === 0 && !cs?.ancestral_hall_history && !cs?.ancestral_hall_address && ceremonies.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Landmark className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Thông tin nhà thờ họ chưa được cập nhật.</p>
            <p className="text-sm mt-1">Vui lòng liên hệ ban quản trị.</p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex flex-wrap gap-3 justify-center pt-4">
        <Link href="/welcome" className="text-sm text-primary hover:underline">
          Trang chủ
        </Link>
        <span className="text-gray-300">|</span>
        <Link href="/council" className="text-sm text-primary hover:underline">
          Hội đồng gia tộc
        </Link>
        <span className="text-gray-300">|</span>
        <Link href="/register-member" className="text-sm text-primary hover:underline">
          Đăng ký thành viên
        </Link>
      </div>
    </div>
  );
}
