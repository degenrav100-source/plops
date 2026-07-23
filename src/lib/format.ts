import { formatEther } from "ethers";

export function fmtEth(wei: bigint, maxFrac = 6): string {
  const s = formatEther(wei);
  const n = Number(s);
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
