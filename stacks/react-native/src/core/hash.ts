// FNV-1a 32-bit. The ONLY source of variation allowed in core:
// derive all "random-looking" choices from the input via this hash.
export function hash32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
