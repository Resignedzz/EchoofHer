import { getCollection } from 'astro:content';

// 根据 tags 交集找相关文章，最多返回 limit 篇
export async function getRelatedPosts(
  currentSlug: string,
  currentTags: string[],
  limit = 3,
) {
  if (!currentTags || currentTags.length === 0) return [];

  const allPosts = await getCollection('blog', ({ data }) => !data.draft);
  const scored = allPosts
    // `.slug` is undefined in this Astro version; match on `.id` instead.
    .filter((post) => post.id !== currentSlug)
    .map((post) => {
      const postTags = post.data.tags ?? [];
      const overlap = postTags.filter((t) => currentTags.includes(t)).length;
      return { post, overlap };
    })
    .filter((item) => item.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap);

  return scored.slice(0, limit).map((item) => item.post);
}
