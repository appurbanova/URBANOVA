import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, Check, WalletCards } from 'lucide-react';

/**
 * URBANOVA Agentic Pass (UAP) — section mint NFT khusus Binance Agentic Wallet.
 * Kontrak ERC-721 di BNB Smart Chain. Nilai mint tidak pernah ditampilkan di web:
 * seluruh nilai hanya muncul di layar konfirmasi wallet pengguna.
 */

const CONTRACT = '0x3a8F2fE59fd461D447e239c924713B040C7a45f7';
const BSCSCAN = `https://bscscan.com/address/${CONTRACT}`;
const MAX_SUPPLY = 3333;
const FREE_SUPPLY = 333;
const MAX_PAID_PER_WALLET = 10;

const RPC_ENDPOINTS = [
  'https://bsc-dataseed.bnbchain.org',
  'https://bsc-dataseed-public.bnbchain.org',
  'https://bsc-dataseed.nariox.org',
];

const SELECTORS = {
  totalMinted: '0xa2309ff8',
  mintOpen: '0x24bbd049',
  platformFee: '0x26232a2e',
  freeClaimed: '0x61c0b6a0',
  mint: '0xa0712d68',
};

type ChainState = {
  totalMinted: number;
  mintOpen: boolean;
  feeWei: bigint;
};

function pad32(hex: string): string {
  return hex.padStart(64, '0');
}

async function ethCall(data: string): Promise<string> {
  let lastError: unknown = null;
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{ to: CONTRACT, data }, 'latest'],
        }),
      });
      const json = (await response.json()) as { result?: string; error?: unknown };
      if (json.result) return json.result;
      lastError = json.error ?? new Error('empty result');
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('RPC unavailable');
}

async function readChainState(): Promise<ChainState> {
  const [mintedHex, openHex, feeHex] = await Promise.all([
    ethCall(SELECTORS.totalMinted),
    ethCall(SELECTORS.mintOpen),
    ethCall(SELECTORS.platformFee),
  ]);
  return {
    totalMinted: Number(BigInt(mintedHex)),
    mintOpen: BigInt(openHex) === 1n,
    feeWei: BigInt(feeHex),
  };
}

async function readFreeClaimed(address: string): Promise<boolean> {
  const result = await ethCall(SELECTORS.freeClaimed + pad32(address.toLowerCase().replace(/^0x/, '')));
  return BigInt(result) === 1n;
}

function getProvider(): { request: (args: { method: string; params?: unknown }) => Promise<unknown> } | null {
  const eth = (window as unknown as { ethereum?: unknown }).ethereum;
  if (eth && typeof eth === 'object' && 'request' in (eth as Record<string, unknown>)) {
    return eth as { request: (args: { method: string; params?: unknown }) => Promise<unknown> };
  }
  return null;
}

export function AgenticPassSection() {
  const [chain, setChain] = useState<ChainState | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [freeClaimed, setFreeClaimed] = useState(false);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setChain(await readChainState());
    } catch {
      /* jaga state terakhir; percobaan berikutnya di interval */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 20000);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (!account) {
      setFreeClaimed(false);
      return;
    }
    void readFreeClaimed(account).then(setFreeClaimed).catch(() => setFreeClaimed(false));
  }, [account, chain?.totalMinted]);

  const totalMinted = chain?.totalMinted ?? 0;
  const mintOpen = chain?.mintOpen ?? false;
  const inFreePhase = totalMinted < FREE_SUPPLY;
  const soldOut = totalMinted >= MAX_SUPPLY;
  const progress = Math.min(100, (totalMinted / MAX_SUPPLY) * 100);
  const providerAvailable = typeof window !== 'undefined' && getProvider() !== null;

  const connect = async () => {
    const provider = getProvider();
    if (!provider) {
      setStatus('No wallet detected. Open this page inside the Binance app — Wallet, Web3 — to continue.');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
      const chainId = (await provider.request({ method: 'eth_chainId' })) as string;
      if (chainId !== '0x38') {
        try {
          await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] });
        } catch {
          setStatus('Please switch your wallet network to BNB Smart Chain, then try again.');
          setBusy(false);
          return;
        }
      }
      if (accounts[0]) setAccount(accounts[0]);
    } catch {
      setStatus('Wallet connection was dismissed.');
    } finally {
      setBusy(false);
    }
  };

  const mint = async () => {
    const provider = getProvider();
    if (!provider || !account || !chain) return;
    setBusy(true);
    setStatus('');
    setTxHash(null);
    try {
      const mintQty = inFreePhase ? 1 : qty;
      const value = inFreePhase ? 0n : chain.feeWei * BigInt(mintQty);
      const data = SELECTORS.mint + pad32(mintQty.toString(16));
      const hash = (await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: CONTRACT,
          data,
          value: `0x${value.toString(16)}`,
        }],
      })) as string;
      setTxHash(hash);
      setStatus('Mint sent. Your pass lands in your wallet as soon as the chain confirms it.');
      void refresh();
    } catch {
      setStatus('The mint was not completed. Nothing was charged — check your wallet and try again.');
    } finally {
      setBusy(false);
    }
  };

  const chip = soldOut
    ? { label: 'Sold out', className: 'border-[#e4786d]/60 text-[#e4786d]' }
    : mintOpen
      ? { label: 'Mint live', className: 'border-secondary/60 text-secondary' }
      : { label: 'Coming soon', className: 'border-primary/50 text-primary' };

  return (
    <section id="agentic-pass" data-testid="section-agentic-pass" className="home-reveal border-t border-border/60 bg-[#0d1120]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-24">
        <div className="relative">
          <div className="overflow-hidden border border-border/70">
            <img src="/uap-city.webp" alt="URBANOVA Agentic Pass artwork — the golden gate district of the living city" className="block aspect-square w-full object-cover" loading="lazy" />
          </div>
          <div className="mt-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground">
            <span>Pass artwork · The Golden Gate district</span>
            <span className="text-primary">UAP · ERC-721</span>
          </div>
        </div>
        <div>
          <div className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.22em] text-primary"><span className="h-px w-8 bg-primary" />The city's first collectible</div>
          <h2 className="font-display text-4xl font-semibold leading-[.98] tracking-[-.05em] sm:text-5xl">URBANOVA <span className="text-muted-foreground">Agentic Pass</span></h2>
          <p className="mt-5 max-w-lg leading-7 text-muted-foreground">
            A pass struck for the people building this city, available <span className="text-foreground">exclusively through Binance Agentic Wallet</span> on BNB Smart Chain.
            When the gates open, the first {FREE_SUPPLY} passes are free — one per wallet. After that, minting continues until the city is full.
          </p>
          <div className="mt-7 grid max-w-lg grid-cols-3 gap-3">
            {[
              ['Supply', MAX_SUPPLY.toLocaleString('en-US')],
              ['Free mint', String(FREE_SUPPLY)],
              ['Chain', 'BNB Chain'],
            ].map(([label, value]) => (
              <div key={label} className="border border-border/70 bg-card/50 px-3 py-3">
                <div className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">{label}</div>
                <div className="mt-1 font-display text-lg font-semibold">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 max-w-lg">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">
              <span>{totalMinted.toLocaleString('en-US')} / {MAX_SUPPLY.toLocaleString('en-US')} minted</span>
              <span className={`border px-2 py-1 ${chip.className}`}>{chip.label}</span>
            </div>
            <div className="mt-2 h-1 bg-muted"><div className="h-full bg-primary transition-all duration-700" style={{ width: `${progress}%` }} /></div>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {!account ? (
              <button type="button" onClick={() => void connect()} disabled={busy} data-testid="button-uap-connect" className="flex items-center gap-2 bg-primary px-5 py-3.5 font-mono text-[10px] font-medium uppercase tracking-[.15em] text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60">
                <WalletCards size={15} /> {busy ? 'Connecting…' : 'Connect wallet'}
              </button>
            ) : !mintOpen || soldOut ? (
              <button type="button" disabled data-testid="button-uap-mint" className="flex items-center gap-2 border border-border px-5 py-3.5 font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">
                {soldOut ? 'Sold out' : 'Mint opens soon'}
              </button>
            ) : (
              <>
                {!inFreePhase && (
                  <div className="flex items-center border border-border" aria-label="Mint quantity">
                    <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-3 font-mono text-sm text-muted-foreground hover:text-primary">−</button>
                    <span className="min-w-8 text-center font-mono text-sm" data-testid="text-uap-qty">{qty}</span>
                    <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(MAX_PAID_PER_WALLET, q + 1))} className="px-3 py-3 font-mono text-sm text-muted-foreground hover:text-primary">+</button>
                  </div>
                )}
                <button type="button" onClick={() => void mint()} disabled={busy || (inFreePhase && freeClaimed)} data-testid="button-uap-mint" className="flex items-center gap-2 bg-primary px-5 py-3.5 font-mono text-[10px] font-medium uppercase tracking-[.15em] text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60">
                  {busy ? 'Confirm in your wallet…' : inFreePhase ? (freeClaimed ? 'Free pass claimed' : 'Claim free pass') : `Mint ${qty} pass${qty > 1 ? 'es' : ''}`}
                </button>
              </>
            )}
            <a href={BSCSCAN} target="_blank" rel="noreferrer" data-testid="link-uap-contract" className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.14em] text-primary hover:underline">
              View contract <ArrowUpRight size={14} />
            </a>
          </div>
          {account && (
            <p className="mt-4 flex items-center gap-2 font-mono text-[10px] tracking-[.08em] text-muted-foreground">
              <Check size={13} className="text-secondary" /> {account.slice(0, 6)}…{account.slice(-4)} · BNB Smart Chain
            </p>
          )}
          {status && <p className="mt-4 max-w-lg border-l-2 border-primary px-3 py-2 text-xs leading-5 text-muted-foreground" role="status">{status}</p>}
          {txHash && (
            <a href={`https://bscscan.com/tx/${txHash}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.14em] text-secondary hover:underline">
              Track your mint <ArrowUpRight size={13} />
            </a>
          )}
          {!providerAvailable && (
            <p className="mt-4 max-w-lg text-xs leading-5 text-muted-foreground">Tip: open this page inside the Binance app's Web3 wallet browser to connect and mint.</p>
          )}
          <p className="mt-5 max-w-lg text-xs leading-5 text-muted-foreground">Everything is confirmed inside your own wallet — the city never holds your keys.</p>
        </div>
      </div>
    </section>
  );
}
