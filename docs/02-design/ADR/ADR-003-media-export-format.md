---
project: AncestorTree
path: docs/02-design/ADR/ADR-003-media-export-format.md
type: architecture-decision-record
version: 1.0.0
updated: 2026-02-26
owner: architect
status: approved
---

# ADR-003: Media Export Format

## Status

Approved (CTO review v3, 2026-02-26)

## Context

AncestorTree cần export/import data giữa web ↔ desktop. Media files (ảnh đại diện, ảnh gia phả) có thể lớn: 50 photos x 2MB = 100MB. Embedding base64 trong JSON gây OOM.

## Decision

Dùng **ZIP archive** thay vì JSON with base64:

```text
ancestortree-export.zip
├── manifest.json          ← tables + metadata
└── media/                 ← only if include_media = "inline"
    ├── people/uuid1/photo.jpg
    └── ...
```

`include_media` enum:
- `"inline"` — media trong ZIP (default nếu total < 50MB)
- `"reference"` — paths only, user copy thủ mục media thủ công
- `"skip"` — data only, no media

Libraries: `archiver` (create) + `yauzl` (extract) — pure JS, zero native deps.

## Rationale

- ZIP streamable — không cần load toàn bộ vào memory
- Compressed — 100MB media → ~70MB ZIP
- Forward-compatible — thêm folders vào ZIP mà không đổi schema
- base64 tăng size 33% + OOM risk

## Consequences

- manifest.json chứa table data dạng JSON arrays
- `schema_version` field cho migration compatibility
- Import cần handle 3 modes: fresh (replace all), merge (upsert by ID), skip conflicts
- Threshold 50MB cho auto-prompt: < 50MB → default inline, >= 50MB → hỏi user
