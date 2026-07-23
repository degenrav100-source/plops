import { useRef, useState, type ReactNode } from "react";
import { parseEther } from "ethers";
import { useWallet } from "../wallet/context";
import { useToast } from "../toast/context";
import { CHAINS, explorerToken, explorerTx, type ChainKey } from "../wallet/chains";
import { deployToken } from "../lib/token";
import { addToken } from "../lib/registry";
import { getPinataJwt, hasPinataJwt, setPinataJwt, uploadImageToIpfs } from "../lib/ipfs";

const BUY_PRESETS = ["0.1", "0.05", "0.035", "0.025"];

interface Props {
  chainKey: ChainKey;
  onTradeToken: (address: string) => void;
}

export default function CreatePanel({ chainKey, onTradeToken }: Props) {
  const { connection, activeProvider, switchChain, openModal } = useWallet();
  const { notify } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [initialBuy, setInitialBuy] = useState("");
  const [jwtInput, setJwtInput] = useState(getPinataJwt());
  const [showKey, setShowKey] = useState(false);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [deployed, setDeployed] = useState<{
    address: string;
    txHash: string;
    chainKey: ChainKey;
  } | null>(null);

  const chain = CHAINS[chainKey];

  const onPickFile = (file: File | null) => {
    setImageFile(file);
    setError("");
    if (!file) {
      setImagePreview("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  };

  const resolveImageUri = async (): Promise<string> => {
    if (imageUrl.trim()) return imageUrl.trim();
    if (imageFile && hasPinataJwt()) {
      setStatus("Uploading image to IPFS…");
      return uploadImageToIpfs(imageFile);
    }
    return "";
  };

  const deploy = async () => {
    setError("");
    if (!connection || !activeProvider) {
      openModal();
      return;
    }
    if (!name.trim() || !symbol.trim()) {
      setError("Name and symbol are required.");
      return;
    }
    let buyWei = 0n;
    if (initialBuy.trim()) {
      try {
        buyWei = parseEther(initialBuy.trim());
      } catch {
        setError("Invalid initial buy amount.");
        return;
      }
    }
    setBusy(true);
    try {
      setStatus(`Switching to ${chain.chainName}…`);
      await switchChain(chain);
      const imageURI = await resolveImageUri();
      setStatus("Confirm the deploy in your wallet…");
      const res = await deployToken(
        activeProvider,
        {
          name: name.trim(),
          symbol: symbol.trim().toUpperCase(),
          description: description.trim(),
          imageURI,
          twitter: twitter.trim(),
          telegram: telegram.trim(),
          website: website.trim(),
        },
        buyWei,
      );
      addToken({
        address: res.address,
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        imageURI,
        chainKey,
        creator: connection.address,
        createdAt: Date.now(),
      });
      setDeployed({ ...res, chainKey });
      setStatus("");
      notify(`🎉 ${symbol.trim().toUpperCase()} deployed on ${chain.short}!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Deploy failed";
      setError(msg);
      setStatus("");
    } finally {
      setBusy(false);
    }
  };

  if (deployed) {
    const deployedChain = CHAINS[deployed.chainKey];
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-dreamy text-3xl shadow-glow">
          🎉
        </div>
        <h3 className="text-xl font-bold text-plops-ink">Token deployed!</h3>
        <p className="mt-1 text-sm text-plops-ink/60">
          {name} (${symbol.toUpperCase()}) is live on {deployedChain.chainName}.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <a
            href={explorerToken(deployedChain, deployed.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-sm"
          >
            View token on explorer ↗
          </a>
          {deployed.txHash && (
            <a
              href={explorerTx(deployedChain, deployed.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-plops-ink/50 hover:text-plops-ink"
            >
              Deploy tx: {deployed.txHash.slice(0, 10)}…
            </a>
          )}
          <button
            type="button"
            className="btn-primary text-sm"
            onClick={() => onTradeToken(deployed.address)}
          >
            Trade ${symbol.toUpperCase()} on the curve →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Token name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bubble Finance"
            className="plops-input"
            maxLength={40}
          />
        </Field>
        <Field label="Symbol / ticker">
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="BUBL"
            className="plops-input uppercase"
            maxLength={11}
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A dreamy community token launching on the Robinhood Chain."
          className="plops-input min-h-[72px] resize-y"
          maxLength={280}
        />
      </Field>

      <Field label="Token image">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-plops-edge/60 bg-plops-surface/40 text-xl"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="preview" className="h-full w-full object-cover" />
            ) : (
              "＋"
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex-1">
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="…or paste an image URL (ipfs:// or https://)"
              className="plops-input"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="mt-1 text-xs text-plops-ink/50 hover:text-plops-ink"
            >
              {hasPinataJwt() ? "IPFS upload enabled ✓" : "Enable IPFS file upload (Pinata key)"}
            </button>
          </div>
        </div>
        {showKey && (
          <div className="mt-2 flex gap-2">
            <input
              value={jwtInput}
              onChange={(e) => setJwtInput(e.target.value)}
              placeholder="Pinata JWT (stored locally in your browser)"
              className="plops-input text-xs"
            />
            <button
              type="button"
              className="btn-ghost !px-4 !py-2 text-xs"
              onClick={() => {
                setPinataJwt(jwtInput);
                setShowKey(false);
                notify(jwtInput ? "IPFS key saved locally." : "IPFS key cleared.");
              }}
            >
              Save
            </button>
          </div>
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Twitter / X">
          <input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/…" className="plops-input" />
        </Field>
        <Field label="Telegram">
          <input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="https://t.me/…" className="plops-input" />
        </Field>
        <Field label="Website">
          <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className="plops-input" />
        </Field>
      </div>

      <Field label="Initial buy (optional) — ETH to swap for your token at launch">
        <div className="flex flex-wrap items-center gap-2">
          {BUY_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setInitialBuy(p)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                initialBuy === p
                  ? "bg-dreamy text-[#0c1330] shadow-glow"
                  : "border border-plops-edge/50 bg-plops-surface/40 text-plops-ink/70 hover:text-plops-ink"
              }`}
            >
              {p} ETH
            </button>
          ))}
          <input
            value={initialBuy}
            onChange={(e) => setInitialBuy(e.target.value)}
            placeholder="custom"
            inputMode="decimal"
            className="plops-input w-24"
          />
        </div>
      </Field>

      {error && <p className="rounded-xl bg-plops-pink/15 px-3 py-2 text-sm text-plops-pink">{error}</p>}
      {status && <p className="text-sm text-plops-ink/60">{status}</p>}

      <button type="button" onClick={deploy} disabled={busy} className="btn-primary w-full disabled:opacity-60">
        {busy ? "Working…" : connection ? `Deploy token on ${chain.short}` : "Connect wallet to deploy"}
      </button>
      <p className="text-center text-xs text-plops-ink/45">
        Non-custodial · OpenZeppelin ERC-20 + bonding curve · you pay only gas on {chain.chainName}
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-plops-ink/55">
        {label}
      </span>
      {children}
    </label>
  );
}
