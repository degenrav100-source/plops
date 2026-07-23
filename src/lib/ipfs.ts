// Optional IPFS image upload via Pinata. If the user has saved a Pinata JWT
// (Studio → "IPFS key"), uploaded files are pinned and a gateway URL is returned.
// Without a JWT the Studio falls back to a plain image-URL field.

const JWT_KEY = "plops-pinata-jwt";
const PINATA_ENDPOINT = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export function getPinataJwt(): string {
  return window.localStorage.getItem(JWT_KEY) ?? "";
}

export function setPinataJwt(jwt: string): void {
  if (jwt) window.localStorage.setItem(JWT_KEY, jwt.trim());
  else window.localStorage.removeItem(JWT_KEY);
}

export function hasPinataJwt(): boolean {
  return getPinataJwt().length > 0;
}

interface PinataResponse {
  IpfsHash?: string;
}

export async function uploadImageToIpfs(file: File): Promise<string> {
  const jwt = getPinataJwt();
  if (!jwt) throw new Error("No IPFS key configured");
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(PINATA_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`IPFS upload failed (${res.status})`);
  }
  const data = (await res.json()) as PinataResponse;
  if (!data.IpfsHash) throw new Error("IPFS upload returned no hash");
  return `${GATEWAY}${data.IpfsHash}`;
}
