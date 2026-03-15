import React, { useState, useEffect } from "react";
import "./App.css";
import { db, auth } from "./firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

import Sidebar from "./Sidebar";
import AuthView from "./AuthView";
import CardListView from "./CardListView";
import AddCardView from "./AddCardView";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("add");
  const [cards, setCards] = useState([]);
  const [inventory, setInventory] = useState({});
  const [userAccounts, setUserAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [newAccountName, setNewAccountName] = useState("");
  const [newAccEmail, setNewAccEmail] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubSettings = onSnapshot(
      doc(db, "userSettings", user.uid),
      (snap) => {
        if (snap.exists()) {
          const accs = snap.data().accounts || [];
          setUserAccounts(accs);
          if (accs.length > 0 && !activeTab) setActiveTab(accs[0].name);
        }
      }
    );

    const unsubCards = onSnapshot(
      query(collection(db, "cards"), orderBy("name")),
      (s) => {
        setCards(s.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubInv = onSnapshot(
      collection(db, "users", user.uid, "privateInventory"),
      (s) => {
        const data = {};
        s.docs.forEach((d) => {
          data[d.id] = d.data();
        });
        setInventory(data);
      }
    );

    return () => {
      unsubSettings();
      unsubCards();
      unsubInv();
    };
  }, [user, activeTab]);

  // App.js の handleAddComplete を以下に差し替え
  // App.js の handleAddComplete
  // App.js の handleAddComplete を修正
  const handleAddComplete = async ({ name, group, counts }) => {
    if (!user) return;
    try {
      // メンバー特定用のID（スプレッドシートの名簿と一致させる）
      const cardId = `${group}_${name}`.replace(/\s+/g, "_");

      // 1. 現在の在庫を取得して加算
      const currentCounts = inventory[cardId] || {};
      const updatedCounts = { ...currentCounts };

      Object.keys(counts).forEach((accName) => {
        const inputVal = parseInt(counts[accName], 10) || 0;
        const existingVal = parseInt(currentCounts[accName], 10) || 0;
        updatedCounts[accName] = existingVal + inputVal;
      });

      // 2. Firebaseには「在庫数」だけを保存（cardsへのsetDocを削除）
      await setDoc(
        doc(db, "users", user.uid, "privateInventory", cardId),
        updatedCounts,
        { merge: true }
      );

      return true;
    } catch (e) {
      console.error("Firebase Error:", e);
      throw new Error("保存に失敗しました");
    }
  };
  const addAccount = async () => {
    if (!newAccountName || !newAccEmail) return alert("入力してください"); //空白チェック
    //重複チェック
    const isDuplicate = userAccounts.some(
      (acc) => acc.name.trim() === newAccountName.trim()
    );
    if (isDuplicate) {
      alert("違うアカウント名を登録してください");
      return;
    }
    //保存データの作成
    const updated = [
      ...userAccounts,
      { name: newAccountName.trim(), email: newAccEmail.trim() },
    ];
    //firebaseへの登録
    try {
      await setDoc(
        doc(db, "userSettings", user.uid),
        { accounts: updated },
        { merge: true }
      );
      setNewAccountName("");
      setNewAccEmail("");
    } catch (e) {
      console.error(e);
      alert("追加に失敗");
    }
  };

  // アカウント削除（読み取り専用エラーを避けるため、スプレッド演算子を使用）
  const deleteAccount = async (accountName) => {
    if (!user) return;
    try {
      const updated = [...userAccounts].filter(
        (acc) => acc.name !== accountName
      );
      await setDoc(
        doc(db, "userSettings", user.uid),
        { accounts: updated },
        { merge: true }
      );
    } catch (e) {
      console.error(e);
      alert("削除に失敗しました");
    }
  };

  // ログアウト（1つにまとめ、確認メッセージを追加）
  const handleLogout = () => {
    if (window.confirm("ログアウトしますか？")) {
      signOut(auth)
        .then(() => {
          setActiveView("list");
          setIsSidebarOpen(false);
        })
        .catch((err) => alert(err.message));
    }
  };

  const updateCount = async (cardId, delta) => {
    if (!activeTab) return;
    const current = inventory[cardId] || {};
    const count = Math.max(0, (current[activeTab] || 0) + delta);
    await setDoc(
      doc(db, "users", user.uid, "privateInventory", cardId),
      { ...current, [activeTab]: count },
      { merge: true }
    );
  };

  if (loading) return <div className="loading-screen">読み込み中...</div>;
  if (!user) return <AuthView />;

  return (
    <div className="main-container">
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        user={user}
        userAccounts={userAccounts}
        newAccountName={newAccountName}
        setNewAccountName={setNewAccountName}
        newAccEmail={newAccEmail}
        setNewAccEmail={setNewAccEmail}
        addAccount={addAccount}
        deleteAccount={deleteAccount}
        handleLogout={handleLogout}
        setActiveView={setActiveView}
      />
      <div className="content-area">
        {activeView === "add" ? (
          <AddCardView
            userAccounts={userAccounts}
            onAddComplete={handleAddComplete}
          />
        ) : (
          <CardListView
            cards={cards}
            inventory={inventory}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userAccounts={userAccounts}
            updateCount={updateCount}
            onGoToAdd={() => setActiveView("add")}
            toggleSidebar={() => setIsSidebarOpen(true)}
          />
        )}
      </div>
      <footer className="footer-button-container">
        <button
          className={`action-btn ${activeView === `list` ? `active` : ``}`}
          onClick={() => setActiveView(`list`)}
        >
          カードリスト
        </button>
        <button
          className={`action-btn ${activeView === `add` ? `active` : ``}`}
          onClick={() => setActiveView(`add`)}
        >
          新規登録
        </button>
      </footer>
    </div>
  );
}
