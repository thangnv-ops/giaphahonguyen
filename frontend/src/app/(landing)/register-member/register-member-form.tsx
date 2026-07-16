/**
 * @project AncestorTree
 * @file src/app/(landing)/register-member/register-member-form.tsx
 * @description Client component — public registration form with honeypot
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, CheckCircle, Loader2 } from 'lucide-react';
import { useSubmitRegistration } from '@/hooks/use-registrations';
import { useClanSettings } from '@/hooks/use-clan-settings';
import Link from 'next/link';

export function RegisterMemberForm() {
  const { data: cs } = useClanSettings();
  const submitMutation = useSubmitRegistration();
  const [submitted, setSubmitted] = useState(false);

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<string>('');
  const [birthYear, setBirthYear] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [parentName, setParentName] = useState('');
  const [generation, setGeneration] = useState('');
  const [chi, setChi] = useState('');
  const [relationship, setRelationship] = useState('');
  const [notes, setNotes] = useState('');
  // Honeypot — hidden from real users, bots fill it
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !gender) return;

    try {
      await submitMutation.mutateAsync({
        full_name: fullName.trim(),
        gender: parseInt(gender) as 1 | 2,
        birth_year: birthYear ? parseInt(birthYear) : undefined,
        birth_place: birthPlace.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        parent_name: parentName.trim() || undefined,
        generation: generation ? parseInt(generation) : undefined,
        chi: chi ? parseInt(chi) : undefined,
        relationship: relationship.trim() || undefined,
        notes: notes.trim() || undefined,
        honeypot,
      });
      setSubmitted(true);
    } catch {
      // Error handled by mutation state
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-6">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-900">Ghi danh thành công!</h1>
        <p className="text-gray-600">
          Thông tin của bạn đã được gửi đến ban quản trị {cs?.clan_name ?? 'dòng họ'}.
          Sau khi được xét duyệt, bạn sẽ được thêm vào gia phả.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/welcome" className="text-sm text-primary hover:underline">
            Về trang chủ
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/council" className="text-sm text-primary hover:underline">
            Xem hội đồng gia tộc
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <UserPlus className="h-7 w-7" />
          Đăng ký thành viên
        </h1>
        <p className="text-gray-600">
          Dành cho con cháu {cs?.clan_name ?? 'dòng họ'} sống xa muốn ghi danh vào gia phả
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin ghi danh</CardTitle>
          <CardDescription>
            Điền thông tin bên dưới. Ban quản trị sẽ xét duyệt và liên hệ lại.
            Trường có dấu (*) là bắt buộc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Honeypot — hidden from real users */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Họ và tên *</Label>
                <Input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Giới tính *</Label>
                <Select value={gender} onValueChange={setGender} required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Nam</SelectItem>
                    <SelectItem value="2">Nữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Năm sinh</Label>
                <Input
                  type="number"
                  value={birthYear}
                  onChange={e => setBirthYear(e.target.value)}
                  placeholder="1990"
                  min={1900}
                  max={2030}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Nơi sinh / Quê quán</Label>
                <Input
                  value={birthPlace}
                  onChange={e => setBirthPlace(e.target.value)}
                  placeholder="Hà Nội"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Điện thoại</Label>
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Tên cha/mẹ (để đối chiếu)</Label>
              <Input
                value={parentName}
                onChange={e => setParentName(e.target.value)}
                placeholder="Con ông Đặng Văn B"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Đời (tự khai)</Label>
                <Input
                  type="number"
                  value={generation}
                  onChange={e => setGeneration(e.target.value)}
                  placeholder="5"
                  min={1}
                  max={30}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Chi (tự khai)</Label>
                <Input
                  type="number"
                  value={chi}
                  onChange={e => setChi(e.target.value)}
                  placeholder="1"
                  min={1}
                  max={20}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Quan hệ</Label>
                <Input
                  value={relationship}
                  onChange={e => setRelationship(e.target.value)}
                  placeholder="Cháu ông X"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Ghi chú</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Thông tin bổ sung..."
                className="mt-1"
              />
            </div>

            {submitMutation.isError && (
              <p className="text-sm text-red-500">
                Lỗi khi gửi đơn. Vui lòng thử lại.
              </p>
            )}

            <Button type="submit" className="w-full" disabled={submitMutation.isPending || !fullName.trim() || !gender}>
              {submitMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang gửi...</>
              ) : (
                <><UserPlus className="h-4 w-4 mr-2" />Gửi đơn ghi danh</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/welcome" className="text-sm text-primary hover:underline">
          Trang chủ
        </Link>
        <span className="text-gray-300">|</span>
        <Link href="/council" className="text-sm text-primary hover:underline">
          Hội đồng gia tộc
        </Link>
      </div>
    </div>
  );
}
