import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";

export default function AddCardView({
  onBack,
  userAccounts,
  onAddComplete,
  currentUser,
}) {
  const [masterData, setMasterData] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pack, setPack] = useState("");
  const [group, setGroup] = useState("");
  const [name, setName] = useState("");
  const [rarity, setRarity] = useState("");
  const [counts, setCounts] = useState({});
  const [selectedAccount, setSelectedAccount] = useState("");

  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberList, setShowMemberList] = useState(false);
  const memberRef = useRef(null);

  const SPREADSHEET_CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQqsgTk5J3FiGcUO-UvcTdtHv7FTXfkDqMN2AIhlKI3ipLSZ7XKmYtgdDZosEsVkzx1Z4QAH15sOqXd/pub?output=csv";
  const GAS_LOG_URL =
    "https://script.google.com/macros/s/AKfycbwAyH3rCfV-uEfvCqhLMyw1bATf0bGzuWfe6HGBjACQ3LJN9vO8RFsZq3OnpbNY7spx/exec";

  useEffect(() => {
    Papa.parse(SPREADSHEET_CSV_URL, {
      download: true,
      header: true,
      complete: (results) => {
        const data = results.data.filter((row) => row["メンバー名"]);
        setMasterData(data);
      },
    });
    if (userAccounts.length > 0 && !selectedAccount) {
      setSelectedAccount(userAccounts[0].name);
    }
  }, [userAccounts, selectedAccount]);

  // --- 動的なリスト抽出ロジック ---

  // 1. パック一覧の抽出
  // 【修正】メンバーが選ばれていたら、そのメンバーがいるパックだけに絞り込む。選ばれていなければ全表示。
  const packList = name
    ? [
        ...new Set(
          masterData
            .filter((item) => item["メンバー名"] === name)
            .map((item) => item["パック名"])
        ),
      ]
    : [...new Set(masterData.map((item) => item["パック名"]))].filter(Boolean);

  // 2. グループ一覧の抽出
  // パックが選ばれていればそのパック内、なければメンバーから推測、それもなければ全表示
  const groupList = pack
    ? [
        ...new Set(
          masterData
            .filter((item) => item["パック名"] === pack)
            .map((item) => item["グループ名"])
        ),
      ]
    : name
    ? [
        ...new Set(
          masterData
            .filter((item) => item["メンバー名"] === name)
            .map((item) => item["グループ名"])
        ),
      ]
    : [...new Set(masterData.map((item) => item["グループ名"]))];

  // --- 連動自動選択処理 ---

  // パックが1つしかなければ自動選択
  useEffect(() => {
    if (packList.length === 1 && !pack) {
      setPack(packList[0]);
    }
  }, [packList, pack]);

  // グループが1つしかなければ自動選択
  useEffect(() => {
    if (groupList.length === 1 && !group) {
      setGroup(groupList[0]);
    }
  }, [groupList, group]);

  // メンバー選択時の処理
  const handleSelectMember = (memberName) => {
    setName(memberName);
    setMemberSearch(memberName);
    setShowMemberList(false);

    // パックとグループをリセットして、新しいメンバーの選択肢に合わせる
    setPack("");
    setGroup("");
    setRarity("");
  };

  // メンバー検索フィルタ
  const filteredMembers = masterData.filter((item) => {
    const matchesPack = pack ? item["パック名"] === pack : true;
    const matchesGroup = group ? item["グループ名"] === group : true;
    const matchesSearch = item["メンバー名"].includes(memberSearch);
    return matchesPack && matchesGroup && matchesSearch;
  });
  const uniqueMemberNames = [
    ...new Set(filteredMembers.map((item) => item["メンバー名"])),
  ];

  const allRarityList = [
    "⭐︎⭐︎",
    "⭐︎⭐︎⭐︎",
    "⭐︎⭐︎⭐︎⭐︎",
    "⭐︎⭐︎⭐︎⭐︎⭐︎",
    "シークレット",
    "その他",
  ];

  const handleAdd = async () => {
    if (!pack || !group || !name || !rarity)
      return alert("全ての項目を選択してください");

    // 実在チェック
    const isExist = masterData.some((item) => {
      const sPack = (item["パック名"] || "").trim();
      const sGroup = (item["グループ名"] || "").trim();
      const sName = (item["メンバー名"] || "").trim();
      const sRarity = (item["ランク"] || "").trim(); // CSVの見出しに合わせる
      return (
        sPack === pack.trim() &&
        sGroup === group.trim() &&
        sName === name.trim() &&
        sRarity === rarity.trim()
      );
    });

    if (!isExist) {
      return alert(
        `エラー: このカードは名簿に存在しません。\n\nパック: ${pack}\nグループ: ${group}\n名前: ${name}\nランク: ${rarity}`
      );
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 現在のアカウントの枚数を取得（未入力なら1として扱う）
      const finalCounts = { ...counts };
      if (finalCounts[selectedAccount] === undefined) {
        finalCounts[selectedAccount] = 1; // ここを1に設定
      }

      await onAddComplete({ name, group, pack, rarity, counts: finalCounts });

      await fetch(GAS_LOG_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          userEmail: currentUser?.email || "User",
          name,
          group,
          pack,
          rarity,
          counts: finalCounts,
        }),
      });

      alert(`登録完了: ${name} (${rarity})`);

      // 【修正】全ての項目を完全にリセット
      setPack("");
      setGroup("");
      setName("");
      setRarity("");
      setMemberSearch(""); // 検索窓もクリア
      setCounts({}); // 枚数入力をリセット
    } catch (e) {
      alert("エラー: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`ac-container ${isSubmitting ? "is-loading" : ""}`}>
      <h2 className="ac-title">Card Entry</h2>

      <div className="ac-input-section" ref={memberRef}>
        <label className="ac-label">1. Member Search</label>
        <input
          className="ac-input"
          placeholder="名前から探す..."
          value={memberSearch || name}
          onFocus={() => setShowMemberList(true)}
          onChange={(e) => {
            setMemberSearch(e.target.value);
            setName("");
            setPack("");
            setGroup("");
          }}
        />
        {showMemberList && (
          <div className="ac-dropdown">
            {uniqueMemberNames.length > 0 ? (
              uniqueMemberNames.slice(0, 50).map((m) => (
                <div
                  key={m}
                  className="ac-dropdown-item"
                  onClick={() => handleSelectMember(m)}
                >
                  {m}
                </div>
              ))
            ) : (
              <div className="ac-dropdown-item">候補なし</div>
            )}
          </div>
        )}
      </div>

      <div className="ac-input-section">
        <label className="ac-label">2. Pack</label>
        <select
          className="ac-input"
          value={pack}
          onChange={(e) => setPack(e.target.value)}
        >
          <option value="">パックを選択</option>
          {packList.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {name && packList.length > 1 && (
          <small style={{ color: "#ff69b4" }}>
            ※{name}が収録されているパックのみ表示中
          </small>
        )}
      </div>

      <div className="ac-input-section">
        <label className="ac-label">3. Group</label>
        <div className="ac-acc-selector">
          <button
            className={`ac-acc-btn ${!group ? "active" : ""}`}
            onClick={() => setGroup("")}
          >
            All
          </button>
          {groupList.map((g) => (
            <button
              key={g}
              className={`ac-acc-btn ${group === g ? "active" : ""}`}
              onClick={() => setGroup(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="ac-input-section">
        <label className="ac-label">4. Rarity</label>
        <div className="ac-rarity-group">
          {allRarityList.map((r) => (
            <button
              key={r}
              className={`ac-rarity-btn ${rarity === r ? "active" : ""}`}
              onClick={() => setRarity(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="ac-input-section">
        <label className="ac-label">5. Quantity</label>
        <div className="ac-acc-selector">
          {userAccounts.map((acc) => (
            <button
              key={acc.name}
              className={`ac-acc-btn ${
                selectedAccount === acc.name ? "active" : ""
              }`}
              onClick={() => setSelectedAccount(acc.name)}
            >
              {acc.name}
            </button>
          ))}
        </div>
        <div className="ac-quantity-input-wrapper">
          <span className="ac-selected-name">{selectedAccount}</span>
          <input
            className="ac-acc-input-large"
            type="number"
            value={counts[selectedAccount] ?? 1}
            placeholder="0"
            onChange={(e) =>
              setCounts({
                ...counts,
                [selectedAccount]: parseInt(e.target.value, 10) || 0,
              })
            }
          />
        </div>
      </div>

      <button
        className="ac-submit-btn"
        onClick={handleAdd}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : "Submit"}
      </button>
      <button className="ac-back-btn" onClick={onBack}>
        Cancel
      </button>
    </div>
  );
}
