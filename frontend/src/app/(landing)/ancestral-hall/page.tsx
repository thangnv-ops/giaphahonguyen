/**
 * @project AncestorTree
 * @file src/app/(landing)/ancestral-hall/page.tsx
 * @description Public ancestral hall page — gallery, schedule, location
 * @version 1.0.0
 * @updated 2026-03-09
 */

import type { Metadata } from 'next';
import { AncestralHallContent } from './ancestral-hall-content';

export const metadata: Metadata = {
  title: 'Nhà thờ họ — AncestorTree',
  description: 'Thông tin nhà thờ họ, hình ảnh, lịch tế lễ hàng năm',
  openGraph: {
    title: 'Nhà thờ họ — AncestorTree',
    description: 'Thông tin nhà thờ họ, hình ảnh, lịch tế lễ hàng năm',
    locale: 'vi_VN',
    type: 'website',
  },
};

export default function AncestralHallPage() {
  return <AncestralHallContent />;
}
