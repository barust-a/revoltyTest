import { z } from 'zod';

import { hash32 } from './hash';

// Example core unit: pure, deterministic, schema-first.
// Replace with your real domain logic; keep the shape (schema + z.infer + hash-derived variation).

export const GreetingSchema = z.object({
  text: z.string().min(1),
  flair: z.enum(['spark', 'wave', 'star']),
});
export type Greeting = z.infer<typeof GreetingSchema>;

const FLAIRS = GreetingSchema.shape.flair.options;

export function buildGreeting(name: string): Greeting {
  const trimmed = name.trim();
  const safe = trimmed.length > 0 ? trimmed : 'stranger';
  const flair = FLAIRS[hash32(safe) % FLAIRS.length] ?? 'spark';
  return { text: `Hello, ${safe}!`, flair };
}
