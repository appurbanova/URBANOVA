import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, Check, WalletCards } from 'lucide-react';

/**
 * URBANOVA Agentic Pass (UAP) — section mint NFT khusus Binance Agentic Wallet.
 * Kontrak ERC-721 v2 di BNB Smart Chain, pola mint sama seperti NOMIO:
 * mint() satu panggilan tanpa argumen, nilai dibaca dari currentPrice(),
 * dan kontrak memeriksa kepemilikan SPACE ID Agent ID sebelum apa pun.
 * Nilai mint tidak pernah ditampilkan di web: seluruh nilai hanya muncul
 * di layar konfirmasi wallet pengguna.
 */

const CONTRACT = '0x4a800D4775F1c0aCAF8124422127CB7Fe3D5b959';
const BSCSCAN = `https://bscscan.com/address/${CONTRACT}`;
const MAX_SUPPLY = 3333;
const FREE_SUPPLY = 333;

const RPC_ENDPOINTS = [
  'https://bsc-dataseed.bnbchain.org',
  'https://bsc-dataseed-public.bnbchain.org',
  'https://bsc-dataseed.nariox.org',
];

const AGENT_PROMPT = `Mint one URBANOVA Agentic Pass (UAP) on BNB Chain (chain id 56).

Contract: ${CONTRACT}

Call mint() with calldata 0x1249c58b.

Value: read currentPrice() on the contract and send exactly that.

First check mintOpen() — if it returns false, the mint has not opened yet.`;

const AGENT_CLI = `baw contract-call preview --binanceChainId 56 \\
  --from <your agentic wallet> \\
  --to ${CONTRACT} \\
  --value <currentPrice() in wei> --inputData 0x1249c58b --json

baw contract-call execute --requestId <requestId> --json`;

const SELECTORS = {
  totalMinted: '0xa2309ff8',
  mintOpen: '0x24bbd049',
  currentPrice: '0x9d1b464a',
  freeClaimed: '0x61c0b6a0',
  holdsAgentId: '0x11213086',
  mint: '0x1249c58b',
};

type ChainState = {
  totalMinted: number;
  mintOpen: boolean;
  priceWei: bigint;
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
  const [mintedHex, openHex, priceHex] = await Promise.all([
    ethCall(SELECTORS.totalMinted),
    ethCall(SELECTORS.mintOpen),
    ethCall(SELECTORS.currentPrice),
  ]);
  return {
    totalMinted: Number(BigInt(mintedHex)),
    mintOpen: BigInt(openHex) === 1n,
    priceWei: BigInt(priceHex),
  };
}

async function readAddressFlag(selector: string, address: string): Promise<boolean> {
  const result = await ethCall(selector + pad32(address.toLowerCase().replace(/^0x/, '')));
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
  const [hasAgentId, setHasAgentId] = useState<boolean | null>(null);
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
      setHasAgentId(null);
      return;
    }
    void readAddressFlag(SELECTORS.freeClaimed, account).then(setFreeClaimed).catch(() => setFreeClaimed(false));
    void readAddressFlag(SELECTORS.holdsAgentId, account).then(setHasAgentId).catch(() => setHasAgentId(null));
  }, [account, chain?.totalMinted]);

  const totalMinted = chain?.totalMinted ?? 0;
  const mintOpen = chain?.mintOpen ?? false;
  const inFreePhase = totalMinted < FREE_SUPPLY;
  const soldOut = totalMinted >= MAX_SUPPLY;
  const progress = Math.min(100, (totalMinted / MAX_SUPPLY) * 100);
  const providerAvailable = typeof window !== 'undefined' && getProvider() !== null;
  const agentGateBlocked = account !== null && hasAgentId === false;

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
      const latest = await readChainState();
      const hash = (await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: CONTRACT,
          data: SELECTORS.mint,
          value: `0x${latest.priceWei.toString(16)}`,
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
            A pass struck for the people building this city, minted <span className="text-foreground">only by Binance Agentic Wallets holding an Agent ID</span> —
            the contract checks the SPACE ID Agent ID on-chain before anything else, and turns every other caller away.
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
              <button type="button" onClick={() => void mint()} disabled={busy || agentGateBlocked || (inFreePhase && freeClaimed)} data-testid="button-uap-mint" className="flex items-center gap-2 bg-primary px-5 py-3.5 font-mono text-[10px] font-medium uppercase tracking-[.15em] text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60">
                {busy ? 'Confirm in your wallet…' : agentGateBlocked ? 'Agent ID required' : inFreePhase ? (freeClaimed ? 'Free pass claimed' : 'Claim free pass') : 'Mint one pass'}
              </button>
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
          {agentGateBlocked && (
            <p className="mt-4 max-w-lg border-l-2 border-[#e4786d] px-3 py-2 text-xs leading-5 text-muted-foreground" role="status">
              This wallet does not hold an Agent ID yet. Claim your free Agent ID in the Binance app — under your Agentic Wallet — then come back to mint.
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
      <div className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 md:pb-24">
        <div className="border border-border/70 bg-card/30 p-6 sm:p-8">
          <div className="mb-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.22em] text-primary"><span className="h-px w-8 bg-primary" />For agent wallets</div>
          <h3 className="font-display text-2xl font-semibold tracking-[-.03em]">Mint with your agent</h3>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              ['01', 'Hold an Agent ID', 'Claim it free in the Binance app, under your Agentic Wallet. The contract checks it before anything else.'],
              ['02', 'Call mint()', 'One call, no arguments. Read currentPrice() and send exactly that — your wallet shows the value before you sign.'],
              ['03', 'Your pass is struck', 'One transaction mints one pass. The first 333 are free — one per wallet — then minting continues until the city is full.'],
            ].map(([num, title, body]) => (
              <div key={num} className="border-t border-border/70 pt-4">
                <div className="font-mono text-[10px] tracking-[.18em] text-primary">{num}</div>
                <div className="mt-2 font-display text-base font-semibold">{title}</div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Prompt for your agent</div>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap border border-border/70 bg-[#0b1020] p-4 font-mono text-[11px] leading-5 text-foreground/90">{AGENT_PROMPT}</pre>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">baw CLI</div>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap border border-border/70 bg-[#0b1020] p-4 font-mono text-[11px] leading-5 text-foreground/90">{AGENT_CLI}</pre>
            </div>
          </div>
          <p className="mt-6 text-xs leading-5 text-muted-foreground">
            Agents can also fetch the machine-readable skill for this mint:{' '}
            <a href="/uap-skill.md" className="font-mono text-[11px] uppercase tracking-[.12em] text-primary hover:underline">urbanova.app/uap-skill.md</a>
          </p>
        </div>
      </div>
    </section>
  );
}
