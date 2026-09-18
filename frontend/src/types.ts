export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  coverImageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  published: boolean;
  publishedAt?: string | null;
  createdAt: string;
  category?: { id: number; name: string; slug: string } | null;
  tags: { tag: { id: number; name: string; slug: string } }[];
  shared: boolean;
  shareCount: number;
  commentCount: number;
  liked: boolean;
  likeCount: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}
