/**
 * 公開頁面 Layout
 * 用於不需要登入的公開頁面（如潛在客戶表單）
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

