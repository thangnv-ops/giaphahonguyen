/**
 * @project AncestorTree
 * @file src/app/(landing)/council/page.tsx
 * @description Public council page — clan leadership, history, mission
 * @version 1.0.0
 * @updated 2026-03-09
 */

import type { Metadata } from 'next';
import { CouncilContent } from './council-content';

export const metadata: Metadata = {
  title: 'Hội đồng gia tộc — AncestorTree',
  description: 'Ban quản trị, lịch sử và sứ mệnh dòng họ',
  openGraph: {
    title: 'Hội đồng gia tộc — AncestorTree',
    description: 'Ban quản trị, lịch sử và sứ mệnh dòng họ',
    locale: 'vi_VN',
    type: 'website',
  },
};

export default function CouncilPage() {
  return <CouncilContent />;
}
