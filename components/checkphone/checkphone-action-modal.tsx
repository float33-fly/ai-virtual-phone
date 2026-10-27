"use client";

import { useState, useEffect } from "react";
import { X, Send, MessageCircle } from "lucide-react";
import type { Character } from "@/lib/character-types";
import { loadChatSessions, type ChatSession } from "@/lib/chat-storage";
import {
  sendMessageAsCharacter,
  postMomentAsCharacter,
  getCharacterChatSessions,
  getUserDisplayName,
} from "@/lib/checkphone-interaction";

type ActionModalProps = {
  character: Character;
  onClose: () => void;
  defaultAction?: "message" | "moment";
};

export function CheckPhoneActionModal({ character, onClose, defaultAction = "message", onAction }: ActionModalProps) {
  const [action, setAction] = useState<"message" | "moment">(defaultAction);
  const [content, setContent] = useState("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const charSessions = getCharacterChatSessions(character.id);
    setSessions(charSessions);
    if (charSessions.length > 0) {
      setSelectedSessionId(charSessions[0].id);
    }
  }, [character.id]);

  async function handleSend() {
    if (!content.trim()) return;
    setSending(true);
    try {
      if (action === "message") {
        if (!selectedSessionId) {
          alert("请选择一个会话");
          return;
        }
        sendMessageAsCharacter(selectedSessionId, character.id, content);
        const targetSession = sessions.find(s => s.id === selectedSessionId);
        const targetName = targetSession?.isGroup 
          ? (targetSession.groupName || "群聊")
          : (targetSession?.alias || getUserDisplayName());
        onAction?.("message", { content, target: targetName });
      } else {
        postMomentAsCharacter(character.id, content, {
          location: location.trim() || undefined,
        });
        onAction?.("moment", { content });
      }
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error) {
      alert(`发送失败: ${error}`);
    } finally {
      setSending(false);
    }
  }

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);
  const userDisplayName = getUserDisplayName();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "24px",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>以 {character.name} 的身份</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {success && (
          <div
            style={{
              background: "#ecfdf5",
              color: "#10b981",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "16px",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            ✓ 发送成功！已写入短期记忆
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button
            type="button"
            onClick={() => setAction("message")}
            style={{
              flex: 1,
              padding: "10px",
              border: action === "message" ? "2px solid #3b82f6" : "1px solid #ddd",
              background: action === "message" ? "#eff6ff" : "#fff",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <MessageCircle size={16} />
            发消息
          </button>
          <button
            type="button"
            onClick={() => setAction("moment")}
            style={{
              flex: 1,
              padding: "10px",
              border: action === "moment" ? "2px solid #10b981" : "1px solid #ddd",
              background: action === "moment" ? "#ecfdf5" : "#fff",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <Send size={16} />
            发朋友圈
          </button>
        </div>

        {action === "message" && (
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#666" }}>
              选择会话
            </label>
            {sessions.length === 0 ? (
              <div style={{ padding: "12px", background: "#f9fafb", borderRadius: "8px", color: "#999", fontSize: "14px" }}>
                该角色暂无聊天会话
              </div>
            ) : (
              <select
                value={selectedSessionId || ""}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                }}
              >
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.isGroup
                      ? `${session.groupName || "群聊"}`
                      : session.alias || character.name}
                  </option>
                ))}
              </select>
            )}
            {selectedSession && (
              <div style={{ marginTop: "8px", fontSize: "12px", color: "#999" }}>
                {selectedSession.isGroup
                  ? `群聊成员会看到这条消息`
                  : `${userDisplayName} 会看到这条消息`}
              </div>
            )}
          </div>
        )}

        {action === "moment" && (
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#666" }}>
              位置（可选）
            </label>
            <input
              type="text"
              placeholder="例如：北京·三里屯"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "inherit",
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#666" }}>
            内容
          </label>
          <textarea
            placeholder={action === "message" ? "输入消息内容..." : "这一刻的想法..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: "100%",
              minHeight: "120px",
              padding: "10px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() || sending || (action === "message" && !selectedSessionId)}
          style={{
            width: "100%",
            padding: "12px",
            background: action === "message" ? "#3b82f6" : "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: 600,
            cursor:
              !content.trim() || sending || (action === "message" && !selectedSessionId) ? "not-allowed" : "pointer",
            opacity:
              !content.trim() || sending || (action === "message" && !selectedSessionId) ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {sending ? (
            "发送中..."
          ) : (
            <>
              <Send size={18} />
              {action === "message" ? "发送消息" : "发布朋友圈"}
            </>
          )}
        </button>

        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            background: "#fffbeb",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#92400e",
            lineHeight: 1.5,
          }}
        >
          <strong>提示：</strong>
          {action === "message"
            ? "发送的消息会写入该会话的短期记忆，角色在聊天时可以回忆起来。"
            : "发布的朋友圈会写入短期记忆，所有能看到该角色朋友圈的人（包括角色本人）在聊天时都可能提及。"}
        </div>
      </div>
    </div>
  );
}
