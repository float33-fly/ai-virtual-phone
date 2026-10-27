// lib/checkphone-interaction.ts
// Interactive operations for CheckPhone: edit notes, send messages as character, post moments

import { pushChatMessage, loadChatSessions, createMessageId, type ChatMessage } from "./chat-storage";
import { createMomentPost, type MomentPost } from "./moments-storage";
import { loadCharacters } from "./character-storage";
import { resolveUserIdentity } from "./settings-storage";
import { savePhoneSnapshot, loadPhoneSnapshot, type CheckPhoneSnapshot } from "./checkphone-storage";
import type { CheckPhoneNotesPayload } from "./checkphone-config";

/**
 * Edit a note in CheckPhone notes app.
 * Updates the snapshot and returns the updated payload.
 */
export async function editCheckPhoneNote(
  characterId: string,
  noteId: string,
  updates: { title?: string; body?: string }
): Promise<CheckPhoneNotesPayload | null> {
  const snapshot = await loadPhoneSnapshot<CheckPhoneNotesPayload>(characterId, "notes");
  if (!snapshot?.payload) return null;

  const noteIndex = snapshot.payload.notes.findIndex((n) => n.id === noteId);
  if (noteIndex === -1) return null;

  const updatedNotes = [...snapshot.payload.notes];
  updatedNotes[noteIndex] = {
    ...updatedNotes[noteIndex],
    ...(updates.title !== undefined && { title: updates.title }),
    ...(updates.body !== undefined && { body: updates.body }),
    updatedLabel: new Date().toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  const updatedPayload: CheckPhoneNotesPayload = {
    ...snapshot.payload,
    notes: updatedNotes,
  };

  const updatedSnapshot: CheckPhoneSnapshot<CheckPhoneNotesPayload> = {
    ...snapshot,
    payload: updatedPayload,
    updatedAt: new Date().toISOString(),
  };

  await savePhoneSnapshot(updatedSnapshot);
  return updatedPayload;
}

/**
 * Create a new note in CheckPhone notes app.
 */
export async function createCheckPhoneNote(
  characterId: string,
  title: string,
  body: string
): Promise<CheckPhoneNotesPayload | null> {
  const snapshot = await loadPhoneSnapshot<CheckPhoneNotesPayload>(characterId, "notes");
  if (!snapshot?.payload) {
    // Create initial payload if none exists
    const initialPayload: CheckPhoneNotesPayload = {
      notes: [
        {
          id: `note_${Date.now()}`,
          title,
          body,
          updatedLabel: new Date().toLocaleString("zh-CN", {
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ],
    };

    const newSnapshot: CheckPhoneSnapshot<CheckPhoneNotesPayload> = {
      id: `${characterId}:notes`,
      characterId,
      appId: "notes",
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      summary: "",
      payload: initialPayload,
    };

    await savePhoneSnapshot(newSnapshot);
    return initialPayload;
  }

  const newNote = {
    id: `note_${Date.now()}`,
    title,
    body,
    updatedLabel: new Date().toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  const updatedPayload: CheckPhoneNotesPayload = {
    ...snapshot.payload,
    notes: [newNote, ...snapshot.payload.notes],
  };

  const updatedSnapshot: CheckPhoneSnapshot<CheckPhoneNotesPayload> = {
    ...snapshot,
    payload: updatedPayload,
    updatedAt: new Date().toISOString(),
  };

  await savePhoneSnapshot(updatedSnapshot);
  return updatedPayload;
}

/**
 * Delete a note from CheckPhone notes app.
 */
export async function deleteCheckPhoneNote(
  characterId: string,
  noteId: string
): Promise<CheckPhoneNotesPayload | null> {
  const snapshot = await loadPhoneSnapshot<CheckPhoneNotesPayload>(characterId, "notes");
  if (!snapshot?.payload) return null;

  const updatedPayload: CheckPhoneNotesPayload = {
    ...snapshot.payload,
    notes: snapshot.payload.notes.filter((n) => n.id !== noteId),
  };

  const updatedSnapshot: CheckPhoneSnapshot<CheckPhoneNotesPayload> = {
    ...snapshot,
    payload: updatedPayload,
    updatedAt: new Date().toISOString(),
  };

  await savePhoneSnapshot(updatedSnapshot);
  return updatedPayload;
}

/**
 * Send a message as the character to a chat session.
 * This writes to short-term memory (chat history).
 */
export function sendMessageAsCharacter(
  sessionId: string,
  characterId: string,
  content: string,
  options?: {
    mediaType?: ChatMessage["mediaType"];
    mediaData?: ChatMessage["mediaData"];
  }
): ChatMessage {
  const character = loadCharacters().find((c) => c.id === characterId);
  if (!character) {
    throw new Error(`Character ${characterId} not found`);
  }

  const session = loadChatSessions().find((s) => s.id === sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const message = pushChatMessage({
    sessionId,
    role: "assistant",
    content,
    mediaType: options?.mediaType,
    mediaData: options?.mediaData,
    senderCharacterId: characterId,
    senderName: character.name,
  });

  return message;
}

/**
 * Post a moment as the character.
 * This writes to short-term memory (moments timeline).
 */
export function postMomentAsCharacter(
  characterId: string,
  content: string,
  options?: {
    location?: string;
    photoUrl?: string;
    photoDescription?: string;
  }
): MomentPost {
  const character = loadCharacters().find((c) => c.id === characterId);
  if (!character) {
    throw new Error(`Character ${characterId} not found`);
  }

  const post = createMomentPost({
    authorId: characterId,
    authorName: character.name,
    authorAvatar: character.avatar,
    content,
    location: options?.location,
    photoUrl: options?.photoUrl,
    photoDescription: options?.photoDescription,
  });

  return post;
}

/**
 * Get all chat sessions for a character (private chats and group chats).
 */
export function getCharacterChatSessions(characterId: string) {
  const sessions = loadChatSessions();
  return sessions.filter((s) => {
    if (s.isGroup) {
      return s.participantIds?.includes(characterId);
    }
    return s.contactId === characterId;
  });
}

/**
 * Get user identity for display.
 */
export function getUserDisplayName(): string {
  const userIdentity = resolveUserIdentity();
  return userIdentity?.nickname || "你";
}
