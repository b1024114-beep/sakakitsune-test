import "./Header.css";
import { useNavigate } from "react-router-dom";
import { Icons } from "@/components/materials";

type HeaderProps = {
  title: string;
  showBackButton?: boolean;
};

//ヘッダーのみ定義=>PageLayout.tsxで呼び出し
export default function Header({
  title,
  showBackButton = false,
}: HeaderProps) {

  const navigate = useNavigate();

  return (
    <header className="header">

      {/* 戻るボタンの表示有無と、直前に表示していた画面へ戻る遷移 */}
      {showBackButton && (
        <button
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <Icons.Undo2 size={30} />
        </button>
      )}

      <h1>{title}</h1>

    </header>
  );
}