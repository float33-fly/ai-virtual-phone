// lib/checkphone-interaction.ts
// 查手机里的“动手”操作：改备忘录、以角色身份发消息等。
// 所有操作先在查手机页面内生效；退出该角色的手机时，由 flushCheckPhoneInteractions
// 统一写进短期记忆（查手机记录通道），角色会记得“{{user}}动了自己的手机”。

import { loadCharacters } from "./character-storage";
import type { CheckPhoneAppId, CheckPhoneNoteCard, CheckPhoneNotesPayload, CheckPhoneSnapshot } from "./checkphone-config";
import { appendCheckPhoneProjectionEntry, loadPhoneSnapshot, savePhoneSnapshot } from "./checkphone-storage";
import { formatPromptTimestamp } from "./prompt-time";

export type CheckPhoneInteraction = {
  characterId: string;      // 被查手机的角色
  appId: CheckPhoneAppId;
  summary: string;          // 写给该角色的描述，例：在备忘录里新建了「xxx」
  recipient?: {             // 消息接收方（若能匹配到已有角色，会同步写进对方的短期记忆）
    name: string;
    content: string;        // 对方视角看到的内容
  };
};

export function clipInteractionText(value: string, max = 40): string {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** 退出查手机时调用：按角色汇总操作，写入双方短期记忆。 */
export function flushCheckPhoneInteractions(items: CheckPhoneInteraction[]): void {
  if (items.length === 0) return;
  const timestamp = new Date().toISOString();
  const formattedTime = formatPromptTimestamp(timestamp);
  const prefix = formattedTime ? `[查手机 ${formattedTime}]` : "[查手机]";
  const characters = loadCharacters();

  const byCharacter = new Map<string, CheckPhoneInteraction[]>();
  for (const item of items) {
    const list = byCharacter.get(item.characterId) ?? [];
    list.push(item);
    byCharacter.set(item.characterId, list);
  }

  for (const [characterId, list] of byCharacter) {
    const owner = characters.find((c) => c.id === characterId);
    const ownerName = owner?.name?.trim() || "角色";
    const steps = list.map((item, index) => `${index + 1}. ${item.summary}`).join("；");
    appendCheckPhoneProjectionEntry(
      characterId,
      list[list.length - 1].appId,
      `${prefix} {{user}}拿着{{char}}的手机动了手脚：${steps}。这些都是{{user}}做的，不是{{char}}本人。`,
      timestamp,
    );

    for (const item of list) {
      if (!item.recipient) continue;
      const target = characters.find(
        (c) => c.id !== characterId && c.name?.trim() && c.name.trim() === item.recipient!.name.trim(),
      );
      if (!target) continue;
      appendCheckPhoneProjectionEntry(
        target.id,
        item.appId,
        `${prefix} ${ownerName}给{{char}}发来消息：“${item.recipient.content}”`,
        timestamp,
      );
    }
  }
}

function nowNoteLabel(): string {
  return new Date().toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function saveNotesPayload(
  characterId: string,
  snapshot: CheckPhoneSnapshot<CheckPhoneNotesPayload> | null,
  payload: CheckPhoneNotesPayload,
): Promise<CheckPhoneSnapshot<CheckPhoneNotesPayload>> {
  const now = new Date().toISOString();
  const next: CheckPhoneSnapshot<CheckPhoneNotesPayload> = {
    id: `${characterId}:notes`,
    characterId,
    appId: "notes",
    generatedAt: snapshot?.generatedAt ?? now,
    updatedAt: now,
    summary: snapshot?.summary,
    payload,
  };
  await savePhoneSnapshot(next, { silent: true });
  return next;
}

export async function editCheckPhoneNote(
  characterId: string,
  noteId: string,
  updates: { title: string; body: string },
): Promise<CheckPhoneSnapshot<CheckPhoneNotesPayload> | null> {
  const snapshot = await loadPhoneSnapshot<CheckPhoneNotesPayload>(characterId, "notes");
  if (!snapshot?.payload) return null;
  const notes = snapshot.payload.notes.map((note): CheckPhoneNoteCard =>
    note.id === noteId
      ? {
          ...note,
          title: updates.title,
          body: updates.body,
          preview: clipInteractionText(updates.body, 60),
          updatedLabel: nowNoteLabel(),
        }
      : note,
  );
  return saveNotesPayload(characterId, snapshot, { ...snapshot.payload, notes });
}

export async function createCheckPhoneNote(
  characterId: string,
  title: string,
  body: string,
): Promise<CheckPhoneSnapshot<CheckPhoneNotesPayload>> {
  const snapshot = await loadPhoneSnapshot<CheckPhoneNotesPayload>(characterId, "notes");
  const newNote: CheckPhoneNoteCard = {
    id: `note_user_${Date.now()}`,
    title,
    preview: clipInteractionText(body, 60),
    body,
    updatedLabel: nowNoteLabel(),
  };
  const base: CheckPhoneNotesPayload = snapshot?.payload ?? {
    headerTitle: "Memos",
    headerSubtitle: "PRIVATE FRAGMENTS",
    notes: [],
  };
  return saveNotesPayload(characterId, snapshot, { ...base, notes: [newNote, ...base.notes] });
}

export async function deleteCheckPhoneNote(
  characterId: string,
  noteId: string,
): Promise<CheckPhoneSnapshot<CheckPhoneNotesPayload> | null> {
  const snapshot = await loadPhoneSnapshot<CheckPhoneNotesPayload>(characterId, "notes");
  if (!snapshot?.payload) return null;
  return saveNotesPayload(characterId, snapshot, {
    ...snapshot.payload,
    notes: snapshot.payload.notes.filter((note) => note.id !== noteId),
  });
}
