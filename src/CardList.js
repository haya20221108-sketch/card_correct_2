import React from "react";

export default function CardList({ activeTab, cards, inventory, updateCount }) {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "15px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
      }}
    >
      <h2
        style={{
          fontSize: "18px",
          borderBottom: "2px solid #ffb6c1",
          paddingBottom: "10px",
        }}
      >
        {activeTab} の在庫
      </h2>
      {cards.map((card) => (
        <div
          key={card.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 0",
            borderBottom: "1px solid #f9f9f9",
          }}
        >
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: "bold" }}>
              {card.name}{" "}
              <span style={{ color: "#ff69b4", fontSize: "11px" }}>
                {card.rarity}
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "#999" }}>
              {card.group} | {card.pack}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => updateCount(card.id, -1)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              -
            </button>
            <span
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                minWidth: "25px",
                textAlign: "center",
              }}
            >
              {(inventory[card.id] && inventory[card.id][activeTab]) || 0}
            </span>
            <button
              onClick={() => updateCount(card.id, 1)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "none",
                background: "#ff69b4",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              +
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
