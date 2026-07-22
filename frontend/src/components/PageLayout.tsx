import "./PageLayout.css";

import Header from "./Header";

type PageLayoutProps = {
  title: string;
  children: React.ReactNode;
  showBackButton?: boolean;
};

//ヘッダーとページ内容のセットを共通化
export default function PageLayout({
  title,
  children,
  showBackButton = false,
}: PageLayoutProps) {
  return (
    <div className="page">

      <Header title={title} showBackButton={showBackButton}/>

      <main className="page-content">
        {children}
      </main>

    </div>
  );
}