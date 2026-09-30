import "./PageLayout.css";

import Header from "./Header";

type PageLayoutProps = {
  title: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  className?: string;
};

//ヘッダーとページ内容のセットを共通化
export default function PageLayout({
  title,
  children,
  showBackButton = false,
  className = "",
}: PageLayoutProps) {
  return (
    <div className={`page ${className}`}>

      <Header title={title} showBackButton={showBackButton}/>

      <main className="page-content">
        {children}
      </main>

    </div>
  );
}