import { getCollection, type CollectionEntry } from 'astro:content';

export interface AdjacentPosts {
  // Newer than the current post (the one above it in the date-descending list).
  prev: CollectionEntry<'blog'> | null;
  // Older than the current post.
  next: CollectionEntry<'blog'> | null;
}

// Posts are ordered newest -> oldest. "上一篇" = the immediately newer post,
// "下一篇" = the immediately older one. Ties on date are broken by id so the
// ordering is deterministic across rebuilds.
// Note: this Astro version exposes the entry key on `.id` (`.slug` is undefined).
export async function getAdjacentPosts(currentSlug: string): Promise<AdjacentPosts> {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort((a, b) => {
    const t = b.data.date.valueOf() - a.data.date.valueOf();
    return t !== 0 ? t : a.id.localeCompare(b.id);
  });

  const index = posts.findIndex((p) => p.id === currentSlug);
  if (index === -1) return { prev: null, next: null };

  return {
    prev: index > 0 ? posts[index - 1] : null,
    next: index < posts.length - 1 ? posts[index + 1] : null,
  };
}
