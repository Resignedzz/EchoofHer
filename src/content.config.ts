import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const snippets = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/snippets' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    language: z.string().default(''),
    tags: z.array(z.string()).default([]),
    date: z.coerce.date(),
  }),
});

const books = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/books' }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    rating: z.number().min(1).max(5).default(4),
    tags: z.array(z.string()).default([]),
    status: z.enum(['reading', 'finished', 'wishlist']).default('finished'),
    date: z.coerce.date(),
  }),
});

export const collections = { blog, snippets, books };
