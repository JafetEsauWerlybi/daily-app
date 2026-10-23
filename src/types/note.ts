// Nota independiente de las tareas. Vive en users/{userId}/notes/{noteId}.
export interface Note {
  id: string;
  title: string;
  body: string;
  color: NoteColorKey; // "none" = sin color
  pinned: boolean;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

export type NoteColorKey =
  | "none"
  | "yellow"
  | "orange"
  | "red"
  | "green"
  | "blue"
  | "purple"
  | "pink";
