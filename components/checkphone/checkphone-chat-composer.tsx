"use client";

import { useState } from "react";
import { Send, Eye, User } from "lucide-react";

type CheckPhoneChatComposerProps = {
  characterName: string;
  onSend: (content: string) => void;
  disabled?: boolean;
};

export function CheckPhoneChatComposer({
  characterName,
  onSend,
  disabled = false,
}: CheckPhoneChatComposerProps) {
  const [mode, setMode] = useState<"readonly" | "send">("readonly");
  const [content, setContent] = useState("");

  function handleSend() {
    if (!content.trim() || disabled) return;
    onSend(content);
    setContent("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      style={{
        borderTop: "1px solid rgba(154, 120, 255, 0.12)",
        background: "rgba(20, 24, 42, 0.92)",
        backdropFilter: "blur(20px)",
        padding: "12px 16px",
      }}
    >
      {/* 模式切换 */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <button
          type="button"
          onClick={() => setMode("readonly")}
          style={{
            flex: 1,
            padding: "8px",
            border: mode === "readonly" ? "1.5px solid #7b57e8" : "1px solid rgba(154, 120, 255, 0.2)",
            background: mode === "readonly" ? "rgba(123, 87, 232, 0.12)" : "rgba(20, 24, 42, 0.6)",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600,
            color: mode === "readonly" ? "#9a78ff" : "rgba(154, 120, 255, 0.5)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "all 0.2s",
          }}
        >
          <Eye size={14} strokeWidth={2.5} />
          只读模式
        </button>
        <button
          type="button"
          onClick={() => setMode("send")}
          style={{
            flex: 1,
            padding: "8px",
            border: mode === "send" ? "1.5px solid #7b57e8" : "1px solid rgba(154, 120, 255, 0.2)",
            background: mode === "send" ? "rgba(123, 87, 232, 0.12)" : "rgba(20, 24, 42, 0.6)",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600,
            color: mode === "send" ? "#9a78ff" : "rgba(154, 120, 255, 0.5)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "all 0.2s",
          }}
        >
          <User size={14} strokeWidth={2.5} />
          以 {characterName} 身份发送
        </button>
      </div>

      {/* 输入区域 */}
      {mode === "send" && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "flex-end",
          }}
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`以 ${characterName} 的身份发送消息...`}
            disabled={disabled}
            style={{
              flex: 1,
              minHeight: "40px",
              maxHeight: "120px",
              padding: "10px 12px",
              border: "1px solid rgba(154, 120, 255, 0.2)",
              borderRadius: "12px",
              background: "rgba(20, 24, 42, 0.8)",
              color: "#e2e8f0",
              fontSize: "14px",
              fontFamily: "inherit",
              resize: "none",
              outline: "none",
            }}
            rows={1}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!content.trim() || disabled}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              border: "none",
              background: content.trim() && !disabled
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "rgba(154, 120, 255, 0.2)",
              color: content.trim() && !disabled ? "#fff" : "rgba(154, 120, 255, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: content.trim() && !disabled ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            <Send size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {mode === "readonly" && (
        <div
          style={{
            padding: "12px",
            background: "rgba(123, 87, 232, 0.08)",
            borderRadius: "8px",
            fontSize: "12px",
            color: "rgba(154, 120, 255, 0.7)",
            textAlign: "center",
          }}
        >
          只读模式：查看聊天内容，不发送消息
        </div>
      )}
    </div>
  );
}
