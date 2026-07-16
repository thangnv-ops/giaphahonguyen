/**
 * @project AncestorTree
 * @file src/lib/supabase-desktop-storage.ts
 * @description Mock storage for desktop mode — routes to /api/media/ local file server.
 *              Mimics Supabase Storage API: upload, remove, getPublicUrl.
 * @version 1.0.0
 * @updated 2026-02-26
 */

export function createDesktopStorage() {
  return {
    from(bucket: string) {
      return {
        async upload(filePath: string, file: File, _options?: Record<string, unknown>) {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(`/api/media/${bucket}/${filePath}`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Upload failed' }));
            return { data: null, error: { message: err.error || 'Upload failed' } };
          }

          return { data: { path: filePath }, error: null };
        },

        async remove(paths: string[]) {
          const errors: string[] = [];
          for (const p of paths) {
            const response = await fetch(`/api/media/${bucket}/${p}`, {
              method: 'DELETE',
            });
            if (!response.ok) {
              errors.push(p);
            }
          }
          if (errors.length > 0) {
            return { data: null, error: { message: `Failed to delete: ${errors.join(', ')}` } };
          }
          return { data: paths.map(p => ({ name: p })), error: null };
        },

        getPublicUrl(filePath: string) {
          return {
            data: { publicUrl: `/api/media/${bucket}/${filePath}` },
          };
        },
      };
    },
  };
}
