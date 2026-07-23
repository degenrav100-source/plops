import type { ChainKey } from "../wallet/chains";

const KEY = "plops-tokens";

export interface StoredToken {
  address: string;
  name: string;
  symbol: string;
  imageURI: string;
  chainKey: ChainKey;
  creator: string;
  createdAt: number;
}

function readAll(): StoredToken[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredToken[]) : [];
  } catch {
    return [];
  }
}

export function listTokens(chainKey: ChainKey): StoredToken[] {
  return readAll()
    .filter((t) => t.chainKey === chainKey)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function addToken(token: StoredToken): void {
  const all = readAll();
  const exists = all.some(
    (t) => t.address.toLowerCase() === token.address.toLowerCase() && t.chainKey === token.chainKey,
  );
  if (exists) return;
  all.push(token);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}
