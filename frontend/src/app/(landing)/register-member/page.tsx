/**
 * @project AncestorTree
 * @file src/app/(landing)/register-member/page.tsx
 * @description Public member registration form — no auth required
 * @version 1.0.0
 * @updated 2026-03-09
 */

import type { Metadata } from 'next';
import { RegisterMemberForm } from './register-member-form';

export const metadata: Metadata = {
  title: 'Đăng ký thành viên — AncestorTree',
  description: 'Ghi danh vào gia phả dòng họ — dành cho con cháu sống xa',
  openGraph: {
    title: 'Đăng ký thành viên — AncestorTree',
    description: 'Ghi danh vào gia phả dòng họ — dành cho con cháu sống xa',
    locale: 'vi_VN',
    type: 'website',
  },
};

export default function RegisterMemberPage() {
  return <RegisterMemberForm />;
}
