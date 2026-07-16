/**
 * @project AncestorTree
 * @file src/app/api/__tests__/word-export.test.ts
 * @description E2E test for Word (.docx) export — verifies doc generation without DOM
 * @version 1.0.0
 * @updated 2026-07-11
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Person, Family, ClanSettings } from '@/types';

// Mock file-saver — no browser to actually save the blob
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

import { saveAs } from 'file-saver';
import {
  exportFullGiaPhaWord,
  DEFAULT_FULL_WORD_OPTIONS,
} from '@/lib/word-export';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const clanSettings: ClanSettings = {
  id: 'cs-1',
  clan_name: 'Đặng Đình',
  clan_full_name: 'Chi Tộc Đặng Đình - Thạch Lâm, Hà Tĩnh',
  clan_founding_year: 1650,
  clan_origin: 'Thạch Lâm, Hà Tĩnh',
  clan_patriarch: 'Đặng Đình Thủy',
  clan_description: 'Chi tộc Đặng Đình có lịch sử hơn 400 năm.',
  clan_history: 'Dòng họ khởi nguồn từ thời Lê Trung Hưng...',
  clan_mission: 'Giữ gìn văn hoá dòng họ, kết nối con cháu bốn phương.',
  ancestral_hall_address: 'Xã Thạch Lâm, huyện Thạch Hà, Hà Tĩnh',
  ancestral_hall_history: 'Nhà thờ họ được xây dựng năm 1780.',
  contact_email: 'lienhe@dangdinh.example',
  contact_phone: '0123-456-789',
  updated_at: '2026-01-01T00:00:00Z',
};

function mkPerson(over: Partial<Person>): Person {
  return {
    id: 'p-' + Math.random().toString(36).slice(2, 8),
    handle: 'p',
    display_name: 'Nguyễn Văn A',
    gender: 1,
    generation: 1,
    is_living: true,
    is_patrilineal: true,
    privacy_level: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...over,
  };
}

const people: Person[] = [
  mkPerson({
    display_name: 'Đặng Đình Thủy',
    generation: 1,
    is_living: false,
    death_year: 1710,
    birth_year: 1650,
    taboo_name: 'Thuỷ',
    biography: 'Thủy tổ dòng họ.',
  }),
  mkPerson({
    display_name: 'Đặng Thị Hoa',
    gender: 2,
    generation: 1,
    is_living: false,
    death_year: 1712,
    birth_year: 1652,
  }),
  mkPerson({
    display_name: 'Đặng Đình Long',
    generation: 2,
    birth_year: 1975,
    occupation: 'Giáo viên',
  }),
];

const families: Family[] = [
  {
    id: 'f-1',
    handle: 'f',
    father_id: people[0].id,
    mother_id: people[1].id,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const treeData = {
  people,
  families,
  children: [
    { family_id: 'f-1', person_id: people[2].id, sort_order: 0 },
  ],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('word-export — exportFullGiaPhaWord', () => {
  beforeEach(() => {
    vi.mocked(saveAs).mockClear();
  });

  it('generates a .docx blob with all sections (tree skipped when no container)', async () => {
    await exportFullGiaPhaWord(
      null, // no DOM — tree section skipped gracefully
      0, 0, 0,
      treeData,
      clanSettings,
      DEFAULT_FULL_WORD_OPTIONS,
    );

    expect(saveAs).toHaveBeenCalledTimes(1);
    const [blob, filename] = vi.mocked(saveAs).mock.calls[0];

    // Filename follows gia-pha-day-du-YYYY-MM-DD.docx pattern
    expect(filename).toMatch(/^gia-pha-day-du-\d{4}-\d{2}-\d{2}\.docx$/);

    // Blob is a real docx (ZIP starts with PK\x03\x04)
    const buf = new Uint8Array(await (blob as Blob).arrayBuffer());
    expect(buf[0]).toBe(0x50); // 'P'
    expect(buf[1]).toBe(0x4b); // 'K'
    expect(buf[2]).toBe(0x03);
    expect(buf[3]).toBe(0x04);

    // Non-trivial size — at least a few KB for the multi-section document
    expect(buf.length).toBeGreaterThan(2000);
  });

  it('renders cover-only when only includeCover is true', async () => {
    await exportFullGiaPhaWord(null, 0, 0, 0, treeData, clanSettings, {
      includeCover: true,
      includeHistory: false,
      includeTree: false,
      includeBiographies: false,
    });

    expect(saveAs).toHaveBeenCalledTimes(1);
    const [blob] = vi.mocked(saveAs).mock.calls[0];
    const size = (blob as Blob).size;
    expect(size).toBeGreaterThan(1000);
  });

  it('renders biographies section for a large member set', async () => {
    // Cluster of 20 people across 5 generations
    const many: Person[] = Array.from({ length: 20 }).map((_, i) =>
      mkPerson({
        display_name: `Thành viên ${i + 1}`,
        generation: (i % 5) + 1,
        gender: i % 2 === 0 ? 1 : 2,
        is_living: i % 3 !== 0,
        birth_year: 1900 + i * 3,
        death_year: i % 3 === 0 ? 1980 + i : undefined,
        biography: i % 4 === 0 ? 'Tiểu sử ngắn gọn.' : undefined,
      }),
    );

    await exportFullGiaPhaWord(
      null,
      0, 0, 0,
      { people: many, families: [], children: [] },
      clanSettings,
      { includeCover: false, includeHistory: false, includeTree: false, includeBiographies: true },
    );

    expect(saveAs).toHaveBeenCalledTimes(1);
    const [blob] = vi.mocked(saveAs).mock.calls[0];
    // 20 members → substantially larger than a single-section cover
    expect((blob as Blob).size).toBeGreaterThan(4000);
  });

  it('throws when no section is selected', async () => {
    await expect(
      exportFullGiaPhaWord(null, 0, 0, 0, treeData, clanSettings, {
        includeCover: false,
        includeHistory: false,
        includeTree: false,
        includeBiographies: false,
      }),
    ).rejects.toThrow(/Không có phần nào được chọn/);

    expect(saveAs).not.toHaveBeenCalled();
  });

  it('handles null clanSettings by falling back to defaults', async () => {
    await exportFullGiaPhaWord(null, 0, 0, 0, treeData, null, {
      includeCover: true,
      includeHistory: true, // no content → auto-skipped
      includeTree: false,
      includeBiographies: true,
    });

    expect(saveAs).toHaveBeenCalledTimes(1);
    const [blob] = vi.mocked(saveAs).mock.calls[0];
    expect((blob as Blob).size).toBeGreaterThan(1000);
  });
});
