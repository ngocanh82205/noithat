export default function LoginLoading() {
  return (
    <div className="min-h-screen bg-beige flex items-center justify-center">
      <div className="text-center p-8">
        <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-espresso/60 tracking-widest2 uppercase">
          Đang tải trang đăng nhập...
        </p>
      </div>
    </div>
  );
}