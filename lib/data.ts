export interface BlogPost {
  id: string;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  videoUrl?: string;
  publishedAt: string;
  slug: string;
}
