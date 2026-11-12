/**
 * Usernames of automated accounts (bulk imports). They own large amounts of content, so they
 * are excluded from contributor leaderboards, the community page and "recently added".
 */
export const SYSTEM_USERNAMES = ['dglaiimport'] as const;

export function isSystemUsername(username: string | null | undefined): boolean {
  return Boolean(username && (SYSTEM_USERNAMES as readonly string[]).includes(username));
}
