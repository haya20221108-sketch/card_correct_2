import React from "react";

export default function Sidebar({
  isOpen,
  setIsOpen,
  user,
  userAccounts,
  newAccountName,
  setNewAccountName,
  newAccEmail,
  setNewAccEmail,
  addAccount,
  deleteAccount,
  handleLogout,
  setActiveView,
}) {
  return (
    <>
      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)}></div>
      )}

      <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
        <div className="sidebar-inner">
          <div className="sidebar-header">
            <h3>User Settings</h3>
            <p className="user-email">{user?.email}</p>
            {/* サブタイトルに登録済みアカウントを表示 */}
            <p className="user-accounts-summary">
              Accounts: {userAccounts.map((a) => a.name).join(", ") || "None"}
            </p>
          </div>

          <nav className="sidebar-nav">
            <button
              className="btn-sidebar"
              onClick={() => {
                setActiveView("list");
                setIsOpen(false);
              }}
            >
              在庫一覧
            </button>
            <button
              className="btn-sidebar"
              onClick={() => {
                setActiveView("add");
                setIsOpen(false);
              }}
            >
              カード登録
            </button>
          </nav>

          <hr className="sidebar-divider" />

          {/* アカウント一覧 */}
          <div className="account-section">
            <label className="section-label">登録済みアカウント</label>
            <div className="account-list">
              {userAccounts.map((acc) => (
                <div key={acc.name} className="account-item">
                  <div className="acc-info">
                    <span className="acc-name">{acc.name}</span>
                    <span className="acc-email">{acc.email}</span>
                  </div>
                  <button
                    className="btn-delete"
                    onClick={() => {
                      if (window.confirm(`${acc.name}を削除しますか？`))
                        deleteAccount(acc.name);
                    }}
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </div>

          <hr className="sidebar-divider" />

          {/* アカウント追加フォーム */}
          <div className="account-form">
            <label className="section-label">アカウントを追加</label>
            <input
              className="sidebar-input"
              placeholder="アカウント名"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
            />
            <input
              className="sidebar-input"
              placeholder="メールアドレス"
              value={newAccEmail}
              onChange={(e) => setNewAccEmail(e.target.value)}
            />
            <button className="btn-primary-small" onClick={addAccount}>
              追加
            </button>
          </div>

          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
