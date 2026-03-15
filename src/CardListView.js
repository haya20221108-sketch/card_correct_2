import React, { useState, useEffect } from "react";
import Papa from "papaparse";

export default function CardListView({
  cards: _unused,
  inventory,
  userAccounts,
  activeTab,
  setActiveTab,
  updateCount,
  onGoToAdd,
  toggleSidebar,
}) {
  const [masterData, setMasterData] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const SPREADSHEET_CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQqsgTk5J3FiGcUO-UvcTdtHv7FTXfkDqMN2AIhlKI3ipLSZ7XKmYtgdDZosEsVkzx1Z4QAH15sOqXd/pub?output=csv";

  // 名簿を読み込む関数
  const refreshMasterData = () => {
    setIsRefreshing(true);
    Papa.parse(SPREADSHEET_CSV_URL, {
      download: true,
      header: true,
      complete: (results) => {
        const data = results.data.filter((row) => row["メンバー名"]);
        setMasterData(data);
        localStorage.setItem("cardMasterData", JSON.stringify(data)); // Web(ブラウザ)に保存
        setIsRefreshing(false);
      },
    });
  };

  // 初回読み込み時にブラウザの保存データを確認
  useEffect(() => {
    const saved = localStorage.getItem("cardMasterData");
    if (saved) {
      setMasterData(JSON.parse(saved));
    } else {
      refreshMasterData();
    }
  }, []);

  return (
    <div className="list-view-container">
      <div className="list-header">
        <h2>在庫一覧</h2>
        <button
          className={`refresh-btn ${isRefreshing ? "spinning" : ""}`}
          onClick={refreshMasterData}
          disabled={isRefreshing}
        >
          {isRefreshing ? "更新中..." : "名簿を最新にする"}
        </button>
      </div>

      {/* タブ切り替えなどはそのまま */}

      <div className="card-grid">
        {masterData.map((m, i) => {
          const cardId = `${m["グループ名"]}_${m["メンバー名"]}`.replace(
            /\s+/g,
            "_"
          );
          const count = inventory[cardId]?.[activeTab] || 0;

          return (
            <div key={i} className="card-item">
              <div className="card-info">
                <span className="group-tag">{m["グループ名"]}</span>
                <p className="member-name">{m["メンバー名"]}</p>
                <small>{m["パック名"]}</small>
              </div>
              <div className="count-control">
                <button onClick={() => updateCount(cardId, -1)}>-</button>
                <span className="count-num">{count}</span>
                <button onClick={() => updateCount(cardId, 1)}>+</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
