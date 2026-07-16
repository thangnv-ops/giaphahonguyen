'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h2 className="text-xl font-bold mb-2">Đã xảy ra lỗi</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <button onClick={reset} className="underline">Thử lại</button>
    </div>
  );
}
