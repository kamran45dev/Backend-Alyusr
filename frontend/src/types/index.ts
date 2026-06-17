export interface Slide {
  type: "text" | "code" | "tip" | "title" | "image";
  content: string;
  language?: string;
  highlight?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "ADMIN" | "STUDENT";
}

export interface Message {
  id: string;
  batchId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}
