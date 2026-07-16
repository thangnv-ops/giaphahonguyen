/**
 * @project AncestorTree
 * @file src/app/(landing)/welcome/page.tsx
 * @description Public landing page — 10 sections, Vietnamese-first, SSR static
 * @version 2.4.0
 * @updated 2026-03-01
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  GitBranch, Calendar, Users, Shield, Bug, LogIn,
  Lightbulb, MessageCircle, Code2, Heart,
  ChevronRight, Award, BookOpen, Utensils, Clock, Rocket,
  Mail, Phone, UserCheck, MessageSquare, Route, BarChart3,
  Bell, Landmark, UserPlus, Search, FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const GITHUB_REPO = 'https://github.com/Minh-Tam-Solution/AncestorTree';
const GITHUB_RELEASES = `${GITHUB_REPO}/releases`;
const GITHUB_ISSUES = `${GITHUB_REPO}/issues`;
const GITHUB_DISCUSSIONS = `${GITHUB_REPO}/discussions`;

export const metadata: Metadata = {
  title: 'AncestorTree — Gia Phả Điện Tử',
  description:
    'Phần mềm mã nguồn mở quản lý gia phả điện tử. Cây gia phả tương tác, lịch âm dương, quản lý dòng họ. Miễn phí, tự host, có bản Desktop offline.',
  alternates: {
    canonical: 'https://ancestortree.info/welcome',
  },
  openGraph: {
    title: 'AncestorTree — Gia Phả Điện Tử',
    description: 'Gìn giữ tinh hoa — Tiếp bước cha ông',
    type: 'website',
    locale: 'vi_VN',
    url: 'https://ancestortree.info/welcome',
    images: [{ url: '/og-landing.png', width: 1200, height: 630, alt: 'AncestorTree' }],
  },
};

// -- Data --

const features = [
  {
    icon: GitBranch,
    title: 'Cây gia phả tương tác',
    desc: '10+ đời hiển thị, zoom, pan, lọc theo gốc. SVG rendering với layout engine tự phát triển.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: Calendar,
    title: 'Lịch âm dương & ngày giỗ',
    desc: 'Tự động chuyển đổi âm-dương, nhắc giỗ chạp hàng năm theo lịch truyền thống.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: Users,
    title: 'Quản lý chi / nhánh',
    desc: 'Phân chia chi-nhánh rõ ràng, tính đời tự động, ghi nhận quan hệ cha-mẹ-con-vợ chồng.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Award,
    title: 'Vinh danh & quỹ khuyến học',
    desc: 'Ghi nhận thành tích, quản lý quỹ khuyến học với tài khoản minh bạch.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    icon: BookOpen,
    title: 'Hương ước gia tộc',
    desc: 'Lưu trữ và hiển thị hương ước, quy định dòng họ dạng bài viết có phiên bản.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
  {
    icon: Utensils,
    title: 'Cầu đường — phân công lễ hội',
    desc: 'Thuật toán DFS tự động xoay vòng phân công cúng lễ công bằng giữa các gia đình.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    icon: Heart,
    title: 'Quan hệ gia đình đầy đủ',
    desc: 'Cha mẹ, anh chị em, vợ/chồng, con cái — thêm/xóa trực tiếp từ trang cá nhân.',
    color: 'text-pink-600',
    bg: 'bg-pink-50',
  },
  {
    icon: Shield,
    title: 'Bảo mật & phân quyền 4 cấp',
    desc: 'Row Level Security trên Supabase: admin, editor, viewer, guest — bảo vệ dữ liệu cá nhân.',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
  },
  {
    icon: MessageSquare,
    title: 'Góc giao lưu',
    desc: 'Feed bài viết, bình luận, thả tim, upload ảnh (tối đa 5/bài), lọc theo loại, moderation.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    icon: Route,
    title: 'Tìm quan hệ',
    desc: 'BFS pathfinding tìm đường quan hệ giữa 2 thành viên bất kỳ trong gia phả.',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
  },
  {
    icon: BarChart3,
    title: 'Thống kê nâng cao',
    desc: 'Dashboard biểu đồ phân bố đời, giới tính, còn sống/mất với Recharts.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: FileDown,
    title: 'Export & Import đa dạng',
    desc: 'GEDCOM 7.0, CSV, Markdown, PDF — xuất/nhập dữ liệu gia phả linh hoạt.',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  {
    icon: Bell,
    title: 'Thông báo thời gian thực',
    desc: 'Bell icon + 6 loại thông báo tự động qua DB triggers khi có bình luận, thích bài.',
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  {
    icon: Landmark,
    title: 'Nhà thờ họ & Hội đồng',
    desc: 'Trang công khai giới thiệu nhà thờ (gallery, bản đồ) và ban quản trị dòng họ.',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  {
    icon: UserPlus,
    title: 'Đăng ký thành viên online',
    desc: 'Con cháu sống xa ghi danh trực tuyến, admin duyệt đơn. Honeypot chống spam.',
    color: 'text-lime-600',
    bg: 'bg-lime-50',
  },
  {
    icon: Search,
    title: 'Tìm kiếm thông minh & SEO',
    desc: 'Fuzzy search (Fuse.js) hỗ trợ dấu tiếng Việt. Sitemap, Open Graph cho trang public.',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
  },
];

const techStack = [
  'Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS 4',
  'Supabase (PostgreSQL)', 'shadcn/ui', 'Electron', 'sql.js (SQLite WASM)',
];

// -- Page --

export default function WelcomePage() {
  return (
    <div className="flex flex-col">
      {/* ───── 1. Hero ───── */}
      <section className="relative bg-gradient-to-br from-emerald-800 to-emerald-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-emerald-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
          <Badge variant="secondary" className="mb-6 text-sm px-4 py-1">
            Open Source &middot; MIT License &middot; v2.5.0
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
            Gia Phả Điện Tử
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto mb-10">
            Gìn giữ tinh hoa — Tiếp bước cha ông
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <a href="#quickstart">
                <Rocket className="mr-2 h-5 w-5" />
                Bắt đầu ngay
              </a>
            </Button>
            <Button size="lg" className="bg-white/10 border border-white/30 text-white hover:bg-white/20" asChild>
              <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
                <Code2 className="mr-2 h-5 w-5" />
                Mã nguồn GitHub
              </a>
            </Button>
          </div>
          <div className="mt-6">
            <div className="flex items-center gap-3">
              <Button variant="link" className="text-emerald-200 hover:text-white" asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Đăng nhập
                </Link>
              </Button>
              <span className="text-emerald-400">|</span>
              <Button variant="link" className="text-emerald-200 hover:text-white" asChild>
                <Link href="/register">
                  Đăng ký
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ───── 2. Features ───── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Tính năng nổi bật</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Giải pháp toàn diện cho quản lý gia phả — từ cây phả hệ đến lễ nghi truyền thống.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-3`}>
                    <f.icon className={`h-5 w-5 ${f.color}`} />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 3. Screenshots ───── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Giao diện ứng dụng</h2>
            <p className="text-gray-500">Thiết kế hiện đại, hỗ trợ tiếng Việt, tương thích di động.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { src: '/screenshots/tree-view.png', alt: 'Cây gia phả tương tác', label: 'Cây gia phả' },
              { src: '/screenshots/people-list.png', alt: 'Quản lý thành viên', label: 'Danh sách thành viên' },
              { src: '/screenshots/admin-panel.png', alt: 'Trang quản trị', label: 'Trang quản trị' },
              { src: '/screenshots/mobile-view.png', alt: 'Giao diện di động', label: 'Di động' },
            ].map((img) => (
              <div key={img.src} className="group relative rounded-xl overflow-hidden border bg-gray-100 aspect-video flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="absolute bottom-3 left-4 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 4. Hướng dẫn sử dụng ───── */}
      <section id="guide" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Hướng dẫn sử dụng</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Tổng quan các chức năng chính và cách sử dụng ứng dụng.
            </p>
          </div>

          {/* Navigation overview */}
          <div className="mb-14">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Thanh điều hướng</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {[
                { name: 'Trang chủ', desc: 'Tổng quan, thống kê' },
                { name: 'Cây phả hệ', desc: 'Sơ đồ cây gia phả' },
                { name: 'Thành viên', desc: 'Quản lý thành viên' },
                { name: 'Thư mục', desc: 'Danh bạ liên lạc' },
                { name: 'Sự kiện', desc: 'Ngày giỗ, lễ tết' },
                { name: 'Góc giao lưu', desc: 'Feed, bình luận, ảnh' },
                { name: 'Tìm quan hệ', desc: 'Pathfinding 2 người' },
                { name: 'Thống kê', desc: 'Biểu đồ, phân tích' },
                { name: 'Thông báo', desc: 'Cập nhật realtime' },
                { name: 'Vinh danh', desc: 'Thành tích con cháu' },
                { name: 'Quỹ khuyến học', desc: 'Thu chi, học bổng' },
                { name: 'Hương ước', desc: 'Gia huấn, quy ước' },
                { name: 'Cầu đương', desc: 'Phân công cúng lễ' },
                { name: 'Kho tài liệu', desc: 'Ảnh, PDF, video' },
                { name: 'Xuất/Nhập', desc: 'GEDCOM, CSV, PDF' },
                { name: 'Quản trị', desc: 'Cài đặt hệ thống' },
              ].map((item) => (
                <div key={item.name} className="bg-white rounded-lg px-4 py-3 border shadow-sm">
                  <p className="font-medium text-sm text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key workflows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-14">
            {[
              {
                title: 'Thêm thành viên',
                steps: [
                  'Nhấn "Thêm thành viên" ở trang Thành viên',
                  'Điền họ tên, giới tính, đời, năm sinh',
                  'Chọn Cha/Mẹ để tự động tạo quan hệ',
                  'Nhấn Lưu — thành viên xuất hiện trên cây',
                ],
              },
              {
                title: 'Xem cây gia phả',
                steps: [
                  'Vào Cây phả hệ từ thanh điều hướng',
                  'Cuộn chuột để thu phóng, kéo để di chuyển',
                  'Click vào thành viên để xem chi tiết',
                  'Chọn "Xem cây từ đây" để lọc theo nhánh',
                ],
              },
              {
                title: 'Quản lý sự kiện & ngày giỗ',
                steps: [
                  'Ngày giỗ tự động tính từ ngày mất âm lịch',
                  'Thêm sự kiện: Giỗ, Lễ/Tết, hoặc Khác',
                  'Chọn ngày âm lịch và người liên quan',
                  'Bật "Lặp lại hàng năm" cho ngày giỗ',
                ],
              },
              {
                title: 'Sao lưu dữ liệu (Desktop)',
                steps: [
                  'Dữ liệu lưu tại ~/AncestorTree/',
                  'Copy thư mục ra USB hoặc Google Drive',
                  'Khôi phục: copy ngược về ~/AncestorTree/',
                  'Nên sao lưu ít nhất 1 lần/tháng',
                ],
              },
            ].map((workflow) => (
              <Card key={workflow.title}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{workflow.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {workflow.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-gray-600">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-medium">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Usage tips */}
          <div className="max-w-3xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Mẹo sử dụng</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Bắt đầu từ thủy tổ — nhập thông tin từ đời cao nhất trở xuống',
                'Chọn Cha/Mẹ ngay khi tạo thành viên để cây tự động cập nhật',
                'Ghi ngày mất âm lịch — giúp tính ngày giỗ chính xác',
                'Sao lưu thường xuyên — dữ liệu gia phả là tài sản vô giá',
                'Dùng tìm kiếm khi gia phả lớn (>50 người) — nhanh hơn cuộn trang',
              ].map((tip, i) => (
                <div key={i} className="flex gap-3 bg-white rounded-lg px-4 py-3 border shadow-sm">
                  <span className="flex-shrink-0 text-emerald-600 font-semibold text-sm">#{i + 1}</span>
                  <p className="text-sm text-gray-600">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── 5. Quickstart ───── */}
      <section id="quickstart" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Bắt đầu nhanh</h2>
            <p className="text-gray-500">
              Chạy ngay trên máy tính — chỉ cần Docker Desktop và 10 phút.
            </p>
          </div>

          {/* Local Dev quickstart */}
          <div className="max-w-2xl mx-auto mb-10">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-center">Local Development</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm leading-relaxed">
                  <p className="text-gray-400"># Clone &amp; chạy (cần Docker Desktop + pnpm)</p>
                  <p>git clone {GITHUB_REPO}.git</p>
                  <p>cd AncestorTree/frontend</p>
                  <p>pnpm install &amp;&amp; pnpm local:setup &amp;&amp; pnpm dev</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm text-gray-600">
                    Mở <span className="font-mono text-emerald-700">http://localhost:4000</span> — Đăng nhập: <span className="font-mono">admin@giapha.local</span> / <span className="font-mono">admin123</span>
                  </p>
                  <p className="text-xs text-gray-400">Chi phí: $0 &middot; Thời gian: ~10 phút &middot; Đầy đủ 100% tính năng</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desktop notice */}
          <div className="max-w-2xl mx-auto">
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="mx-auto w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Desktop App — Code Signing Pending</h3>
                <p className="text-sm text-gray-600">
                  Bản Desktop (offline, không cần Docker) đang chờ Apple Developer Certificate.
                  Khi code signing sẵn sàng, bản cài đặt sẽ được phát hành tại{' '}
                  <a href={GITHUB_RELEASES} target="_blank" rel="noopener noreferrer" className="underline text-emerald-700 hover:text-emerald-800">
                    GitHub Releases
                  </a>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ───── 6. Câu hỏi thường gặp ───── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Câu hỏi thường gặp</h2>
            <p className="text-gray-500">Giải đáp các thắc mắc phổ biến.</p>
          </div>

          {/* Desktop vs Web comparison */}
          <div className="max-w-3xl mx-auto mb-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Desktop vs Web</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-emerald-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900" />
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Desktop</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Web</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    { label: 'Dữ liệu', desktop: 'Lưu trên máy (SQLite)', web: 'Cloud (Supabase)' },
                    { label: 'Internet', desktop: 'Không cần', web: 'Cần kết nối' },
                    { label: 'Người dùng', desktop: '1 người (admin)', web: 'Nhiều người, phân quyền' },
                    { label: 'Cài đặt', desktop: 'Tải file, click cài', web: 'Cần Node.js, Docker' },
                    { label: 'Chức năng', desktop: 'Giống nhau 100%', web: 'Giống nhau 100%' },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.label}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.desktop}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.web}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ items */}
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'Dữ liệu có mất khi cập nhật ứng dụng không?',
                a: 'Không. Dữ liệu được lưu riêng trong thư mục ~/AncestorTree/, không bị ảnh hưởng khi cập nhật.',
              },
              {
                q: 'Có thể chuyển dữ liệu từ Desktop sang Web không?',
                a: 'Có. Sử dụng tính năng Export/Import (sẽ có trong phiên bản tương lai).',
              },
              {
                q: 'Ứng dụng hỗ trợ bao nhiêu thành viên?',
                a: 'Không giới hạn cứng. Đã test tốt với 500+ thành viên, 10+ đời.',
              },
              {
                q: 'Ai có quyền chỉnh sửa dữ liệu?',
                a: 'Bản Web: Admin toàn quyền, Editor thêm/sửa/xóa, Viewer chỉ xem, Guest xem công khai. Bản Desktop: bạn tự động là Admin.',
              },
            ].map((item) => (
              <Card key={item.q}>
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-gray-900 mb-2">{item.q}</h4>
                  <p className="text-sm text-gray-600">{item.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 7. Community ───── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Cộng đồng</h2>
            <p className="text-gray-500">Góp ý, báo lỗi, hoặc đề xuất tính năng mới.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="mx-auto w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <Bug className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="font-semibold">Báo lỗi</h3>
                <p className="text-sm text-gray-500">Phát hiện lỗi? Tạo issue trên GitHub.</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={`${GITHUB_ISSUES}/new?template=bug_report.md`} target="_blank" rel="noopener noreferrer">
                    Báo lỗi <ChevronRight className="ml-1 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="mx-auto w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="font-semibold">Đề xuất tính năng</h3>
                <p className="text-sm text-gray-500">Ý tưởng mới? Hãy chia sẻ với chúng tôi.</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={`${GITHUB_ISSUES}/new?template=feature_request.md`} target="_blank" rel="noopener noreferrer">
                    Đề xuất <ChevronRight className="ml-1 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="mx-auto w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="font-semibold">Thảo luận & hỗ trợ</h3>
                <p className="text-sm text-gray-500">Đặt câu hỏi, thảo luận với cộng đồng.</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={GITHUB_DISCUSSIONS} target="_blank" rel="noopener noreferrer">
                    Thảo luận <ChevronRight className="ml-1 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ───── 8. Liên hệ ───── */}
      <section id="contact" className="py-20 bg-emerald-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Liên hệ</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Phần mềm được phát triển phục vụ chi tộc Đặng Đình, Thạch Lâm, Hà Tĩnh.
              Con cháu họ Đặng vui lòng liên hệ để được hỗ trợ.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Author card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tác giả</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base font-semibold text-gray-900">Đặng Thế Tài</p>
                <div className="space-y-2">
                  <a href="mailto:dangtt1971@gmail.com" className="flex items-center gap-3 text-sm text-gray-600 hover:text-emerald-700">
                    <Mail className="h-4 w-4 text-emerald-600" />
                    dangtt1971@gmail.com
                  </a>
                  <a href="tel:0939116006" className="flex items-center gap-3 text-sm text-gray-600 hover:text-emerald-700">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    0939 116 006
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Verification guide card */}
            <Card className="border-emerald-200">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-2">
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-lg">Hướng dẫn xác nhận tài khoản</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {[
                    'Đăng ký tài khoản tại trang Đăng ký',
                    'Liên hệ Admin qua email hoặc điện thoại ở trên',
                    'Cung cấp họ tên, quan hệ trong dòng họ',
                    'Admin xác nhận — bạn có thể truy cập đầy đủ',
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-600">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-medium">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <div className="mt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/register">
                      Đăng ký tài khoản <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ───── 9. Dành cho lập trình viên ───── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Dành cho lập trình viên</h2>
            <p className="text-gray-500 mb-8">
              Mã nguồn mở MIT — fork, tùy chỉnh và deploy cho dòng họ của bạn trong 30 phút.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {techStack.map((t) => (
                <Badge key={t} variant="secondary" className="text-sm">
                  {t}
                </Badge>
              ))}
            </div>
            <Button asChild>
              <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
                <Code2 className="mr-2 h-5 w-5" />
                Xem mã nguồn trên GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ───── 10. Footer ───── */}
      <footer className="border-t bg-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌳</span>
              <span className="font-semibold text-gray-700">AncestorTree</span>
              <span className="text-gray-400">v2.5.0</span>
            </div>
            <div className="flex items-center gap-4">
              <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700">
                GitHub
              </a>
              <a href="https://github.com/Minh-Tam-Solution" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700">
                Minh Tam Solution
              </a>
              <a href="https://github.com/Minh-Tam-Solution/tinysdlc" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700">
                TinySDLC
              </a>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            &copy; 2026 AncestorTree &middot; Tác giả: Đặng Thế Tài &middot; Built with TinySDLC &middot; MIT License
          </p>
        </div>
      </footer>
    </div>
  );
}
