/**
 * Shared class-name composer.
 *
 * Connection / 연결:
 * - Used by layout and navigation components when a class is conditional.
 * - It has no storage, theme, Web/Mobile/Tauri branching, or DOM side effect.
 * - Keep this helper dependency-free so it can be used from any UI layer.
 */
export function cn(
  ...classes: (string | undefined | null | false)[]
) {
  return classes.filter(Boolean).join(" ");
}
