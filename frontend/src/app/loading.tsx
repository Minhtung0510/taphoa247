export default function Loading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4 text-sm text-slate-300 shadow-xl">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#00e5a0] border-t-transparent" />
        <span>Đang tải nội dung...</span>
      </div>
    </div>
  );
}
