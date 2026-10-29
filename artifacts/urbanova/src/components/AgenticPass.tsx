import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Copy, Search } from 'lucide-react';

/**
 * URBANOVA Agentic Pass (UAP) — section NFT khusus Binance Agentic Wallet.
 * Mengikuti model NOMIO: TIDAK ada koneksi wallet di web. Mint sepenuhnya
 * terjadi lewat agen pengguna (prompt + baw CLI di panel bawah); halaman ini
 * hanya menampilkan state kontrak (read-only) dan pemeriksa wallet.
 * Kontrak v2 di BNB Smart Chain memeriksa kepemilikan SPACE ID Agent ID
 * secara on-chain sebelum apa pun. Nilai mint tidak pernah ditampilkan:
 * nilai hanya muncul di layar konfirmasi wallet pengguna.
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
  balanceOf: '0x70a08231',
  freeClaimed: '0x61c0b6a0',
  holdsAgentId: '0x11213086',
  ownerOf: '0x6352211e',
};

type ChainState = {
  totalMinted: number;
  mintOpen: boolean;
};

type WalletCheck = {
  holdsAgentId: boolean;
  freeClaimed: boolean;
  passes: number;
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
  const [mintedHex, openHex] = await Promise.all([
    ethCall(SELECTORS.totalMinted),
    ethCall(SELECTORS.mintOpen),
  ]);
  return {
    totalMinted: Number(BigInt(mintedHex)),
    mintOpen: BigInt(openHex) === 1n,
  };
}

async function readWalletCheck(address: string): Promise<WalletCheck> {
  const arg = pad32(address.toLowerCase().replace(/^0x/, ''));
  const [agentHex, freeHex, balHex] = await Promise.all([
    ethCall(SELECTORS.holdsAgentId + arg),
    ethCall(SELECTORS.freeClaimed + arg),
    ethCall(SELECTORS.balanceOf + arg),
  ]);
  return {
    holdsAgentId: BigInt(agentHex) === 1n,
    freeClaimed: BigInt(freeHex) === 1n,
    passes: Number(BigInt(balHex)),
  };
}

type LatestPass = {
  tokenId: number;
  to: string;
};

/**
 * Pass terakhir yang ter-mint: token ID berurutan dari totalMinted,
 * pemiliknya dibaca via ownerOf (eth_call biasa — selalu tersedia di RPC publik,
 * tidak seperti eth_getLogs yang dibatasi node BSC publik).
 */
async function fetchLatestPasses(totalMinted: number, limit = 8): Promise<LatestPass[]> {
  const count = Math.min(limit, totalMinted);
  const ids = Array.from({ length: count }, (_, i) => totalMinted - i);
  return Promise.all(ids.map(async (tokenId) => {
    const ownerHex = await ethCall(SELECTORS.ownerOf + pad32(tokenId.toString(16)));
    return { tokenId, to: `0x${ownerHex.slice(26)}` };
  }));
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Angka yang bergerak halus menuju nilai baru (untuk counter live). */
function useAnimatedNumber(value: number, duration = 900): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const from = fromRef.current;
    if (from === value) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      fromRef.current = value;
    };
  }, [value, duration]);
  return display;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard tidak tersedia; teks tetap bisa dipilih manual */
    }
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={label}
      className="absolute right-2 top-2 z-10 flex items-center gap-1.5 border border-border/70 bg-[#0d1120]/90 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export function AgenticMarketSection() {
  return (
    <section id="agentic-market" data-testid="section-agentic-market" className="border-t border-border/60 bg-[#0d1120]">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-20">
        <div className="grid items-start gap-10 md:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.22em] text-primary"><span className="h-px w-8 bg-primary" />Next · The city's exchange</div>
            <h2 className="font-display text-4xl font-semibold leading-[.98] tracking-[-.05em] sm:text-5xl">The UAP <span className="text-muted-foreground">Market</span></h2>
            <p className="mt-5 max-w-lg leading-7 text-muted-foreground">
              A home for trading the pass, with every minted pass and its owner in one place.
              Buying, selling, and offers open soon through <span className="text-foreground">Element on BNB Chain</span> —
              until then, passes change hands only by minting.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button type="button" disabled data-testid="button-uap-market" className="flex items-center gap-2 border border-border px-5 py-3.5 font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">
                Market opens soon
              </button>
              <a href={BSCSCAN} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.14em] text-primary hover:underline">
                View the collection <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Passes', MAX_SUPPLY.toLocaleString('en-US')],
              ['Trading', 'Soon'],
              ['Venue', 'Element'],
            ].map(([label, value]) => (
              <div key={label} className="border border-border/70 bg-card/50 px-3 py-3">
                <div className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">{label}</div>
                <div className="mt-1 font-display text-lg font-semibold">{value}</div>
              </div>
            ))}
            <p className="col-span-3 border-l-2 border-primary px-3 py-2 text-xs leading-5 text-muted-foreground">
              Holders who minted through their agent will be able to list, bid, and trade the moment the market opens — no migration, the same pass.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AgenticPassSection() {
  const [chain, setChain] = useState<ChainState | null>(null);
  const [recentMints, setRecentMints] = useState<LatestPass[]>([]);
  const [justMinted, setJustMinted] = useState(0);
  const [walletInput, setWalletInput] = useState('');
  const [check, setCheck] = useState<WalletCheck | null>(null);
  const [checkBusy, setCheckBusy] = useState(false);
  const [checkError, setCheckError] = useState('');
  const prevMintedRef = useRef<number | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      setChain(await readChainState());
    } catch {
      /* jaga state terakhir; percobaan berikutnya di interval */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const stateTimer = setInterval(() => void refresh(), 15000);
    return () => clearInterval(stateTimer);
  }, [refresh]);

  useEffect(() => {
    if (!chain) return;
    const prev = prevMintedRef.current;
    prevMintedRef.current = chain.totalMinted;
    if (prev !== null && chain.totalMinted > prev) {
      setJustMinted(chain.totalMinted - prev);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setJustMinted(0), 6000);
    }
  }, [chain]);

  const mintedNow = chain?.totalMinted ?? 0;
  useEffect(() => {
    if (mintedNow === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const passes = await fetchLatestPasses(mintedNow);
        if (!cancelled) setRecentMints(passes);
      } catch {
        /* feed pass terbaru bersifat pelengkap; abaikan kegagalan RPC */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mintedNow]);

  const totalMinted = chain?.totalMinted ?? 0;
  const mintOpen = chain?.mintOpen ?? false;
  const soldOut = totalMinted >= MAX_SUPPLY;
  const progress = Math.min(100, (totalMinted / MAX_SUPPLY) * 100);
  const animatedMinted = useAnimatedNumber(totalMinted);
  const freeMinted = Math.min(totalMinted, FREE_SUPPLY);
  const freeProgress = (freeMinted / FREE_SUPPLY) * 100;
  const freeRemaining = FREE_SUPPLY - freeMinted;
  const paidMinted = Math.max(0, totalMinted - FREE_SUPPLY);
  const phaseText = soldOut
    ? 'The city is full — every pass has been struck.'
    : !mintOpen
      ? `When the gates open, the first ${FREE_SUPPLY} passes are free — one per wallet. After that, minting continues until the city is full.`
      : freeRemaining > 0
        ? `The gates are open and the free phase is live: ${freeRemaining} of the first ${FREE_SUPPLY} free passes remain — one per wallet. After that, minting continues until the city is full.`
        : 'The free phase is complete — all 333 OG passes were claimed. Minting is now in the Agentic phase, and the pass itself is still free: the few cents charged are only an anti-bot filter, shown exactly in your wallet before you sign. Minting continues until the city is full.';

  const runCheck = async () => {
    const address = walletInput.trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      setCheck(null);
      setCheckError('Enter a valid BNB Chain wallet address (0x…).');
      return;
    }
    setCheckBusy(true);
    setCheckError('');
    try {
      setCheck(await readWalletCheck(address));
    } catch {
      setCheck(null);
      setCheckError('The check could not be completed. Try again in a moment.');
    } finally {
      setCheckBusy(false);
    }
  };

  const chip = soldOut
    ? { label: 'Sold out', className: 'border-[#e4786d]/60 text-[#e4786d]' }
    : mintOpen
      ? { label: 'Mint live', className: 'border-secondary/60 text-secondary' }
      : { label: 'Coming soon', className: 'border-primary/50 text-primary' };

  return (
    <section id="agentic-pass" data-testid="section-agentic-pass" className="home-reveal scroll-mt-24 border-t border-border/60 bg-[#0d1120]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-24">
        <div className="group relative">
          <div className="animate-glow-pulse overflow-hidden border border-border/70">
            <img src="/uap-city.webp" alt="URBANOVA Agentic Pass artwork — a minimal gold line drawing of the city's gate district" className="block aspect-square w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.03]" loading="lazy" />
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
            {phaseText}
          </p>
          <p className="mt-4 max-w-lg leading-7 text-muted-foreground">
            There is no wallet to connect here. Minting happens through your own agent — give it the prompt below and it does the rest.
          </p>
          <div className="mt-7 grid max-w-lg grid-cols-3 gap-3">
            <div className="border border-border/70 bg-card/50 px-3 py-3">
              <div className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">Supply</div>
              <div className="mt-1 font-display text-lg font-semibold">{MAX_SUPPLY.toLocaleString('en-US')}</div>
            </div>
            <div className="border border-border/70 bg-card/50 px-3 py-3">
              <div className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">Free mint</div>
              <div className="mt-1 font-display text-lg font-semibold">{FREE_SUPPLY}</div>
            </div>
            <div className="border border-border/70 bg-card/50 px-3 py-3">
              <div className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">Minted</div>
              <div className="mt-1 font-display text-lg font-semibold text-primary">{animatedMinted.toLocaleString('en-US')}</div>
            </div>
          </div>
          <div className={`mt-6 max-w-lg ${justMinted > 0 ? 'animate-mint-flash' : ''}`}>
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">
              <span>{animatedMinted.toLocaleString('en-US')} / {MAX_SUPPLY.toLocaleString('en-US')} minted · {progress.toFixed(1)}%</span>
              <span className="flex items-center gap-2">
                {justMinted > 0 && <span className="animate-count-pop border border-secondary/60 px-2 py-1 text-secondary">+{justMinted} new</span>}
                <span className={`flex items-center gap-2 border px-2 py-1 ${chip.className}`}>
                  {mintOpen && !soldOut && (
                    <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-current">
                      <span className="pulse-ring" />
                    </span>
                  )}
                  {chip.label}
                </span>
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden bg-muted"><div className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} /></div>
            <div className="mt-4">
              <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">
                <span>Genesis free phase · the OG 333</span>
                <span className={freeRemaining === 0 ? 'text-secondary' : ''}>{freeRemaining === 0 ? `Complete · ${FREE_SUPPLY} / ${FREE_SUPPLY}` : `${freeMinted} / ${FREE_SUPPLY} · ${freeRemaining} left`}</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden bg-muted"><div className="h-full bg-secondary transition-all duration-1000 ease-out" style={{ width: `${freeProgress}%` }} /></div>
            </div>
            {paidMinted > 0 && (
              <p className="mt-3 font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">Agentic phase · {paidMinted.toLocaleString('en-US')} minted · mint is free — few-cents anti-bot filter only</p>
            )}
          </div>
          {recentMints.length > 0 && (
            <div className="mt-6 max-w-lg">
              <div className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Recent mints</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {recentMints.map((mint) => (
                  <span key={mint.tokenId} className="animate-rise border border-border/70 bg-card/50 px-2.5 py-1.5 font-mono text-[10px] tracking-[.08em] text-foreground/85">
                    Pass #{mint.tokenId} <span className="text-muted-foreground">→ {shortAddress(mint.to)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-7 max-w-lg">
            <div className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Check a wallet</div>
            <div className="mt-2 flex">
              <input
                type="text"
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void runCheck(); }}
                placeholder="0x… wallet address"
                spellCheck={false}
                data-testid="input-uap-wallet-check"
                className="min-w-0 flex-1 border border-border bg-[#0b1020] px-3 py-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              />
              <button type="button" onClick={() => void runCheck()} disabled={checkBusy} data-testid="button-uap-check" className="flex items-center gap-2 border border-l-0 border-border px-4 font-mono text-[10px] uppercase tracking-[.15em] text-primary transition-colors hover:bg-primary/10 disabled:opacity-60">
                <Search size={13} /> {checkBusy ? 'Checking…' : 'Check'}
              </button>
            </div>
            {checkError && <p className="mt-3 text-xs leading-5 text-[#e4786d]" role="status">{checkError}</p>}
            {check && (
              <div className="mt-3 grid grid-cols-3 gap-3" data-testid="result-uap-check">
                {[
                  ['Agent ID', check.holdsAgentId ? 'Held' : 'Not held'],
                  ['Free mint', check.freeClaimed ? 'Claimed' : 'Available'],
                  ['Passes owned', String(check.passes)],
                ].map(([label, value]) => (
                  <div key={label} className="border border-border/70 bg-card/50 px-3 py-3">
                    <div className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">{label}</div>
                    <div className="mt-1 font-display text-base font-semibold">{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-7">
            <a href={BSCSCAN} target="_blank" rel="noreferrer" data-testid="link-uap-contract" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.14em] text-primary hover:underline">
              View contract <ArrowUpRight size={14} />
            </a>
          </div>
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
              ['03', 'Your pass is struck', 'One transaction mints one pass. The first 333 — the OG passes — are free, one per wallet. After that the pass stays free too; the few cents are only an anti-bot filter.'],
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
              <div className="relative mt-2">
                <CopyButton text={AGENT_PROMPT} label="Copy prompt for your agent" />
                <pre className="overflow-x-auto whitespace-pre-wrap border border-border/70 bg-[#0b1020] p-4 pt-10 font-mono text-[11px] leading-5 text-foreground/90">{AGENT_PROMPT}</pre>
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">baw CLI</div>
              <div className="relative mt-2">
                <CopyButton text={AGENT_CLI} label="Copy baw CLI commands" />
                <pre className="overflow-x-auto whitespace-pre-wrap border border-border/70 bg-[#0b1020] p-4 pt-10 font-mono text-[11px] leading-5 text-foreground/90">{AGENT_CLI}</pre>
              </div>
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
