import { formatEther, formatUnits } from "ethers";

export function fmtEth(wei: bigint, maxFrac = 6): string {
  return fmtUnits(wei, 18, maxFrac);
}

/** Same rendering as `fmtEth`, for quote assets that may not use 18 decimals. */
export function fmtUnits(value: bigint, decimals: number, maxFrac = 6): string {
  const n = Number(formatUnits(value, decimals));
  if (n === 0) return "0";
  if (n < 0.000001) return n.toExponential(2);
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

export function fmtTokens(wei: bigint): string {
  const n = Number(formatEther(wei));
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
  if (n >= 1_000) return `${(n / 1_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function shortAddr(address: string): string {
  if (address.length < 11) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function isAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

/**
 * Socials are typed without a scheme ("x.com/plops") and an anchor would resolve those relatively.
 * Token metadata is attacker-controlled, so anything that is not http(s) — `javascript:`, `data:` —
 * is dropped rather than linked.
 */
export function toExternalUrl(value: string): string {
  const url = value.trim();
  if (!url) return "";
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url)?.[1].toLowerCase();
  if (!scheme) return `https://${url}`;
  return scheme === "https" || scheme === "http" ? url : "";
}
