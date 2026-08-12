import {
  ArrowUpRight, Building2, ChevronRight, Compass, Gamepad2,
  Layers3, LockKeyhole, Orbit, Radio, Trophy, Zap, CircleHelp, Terminal,
  Signal, Map, Coins, Sparkles, Users, Calendar,
} from 'lucide-react';
import { Link } from 'wouter';
import { Footer, SectionLabel, SiteHeader } from '@/App';

type GameStatus = 'live' | 'soon' | 'planned';
type GameTier = 'signal' | 'workshop' | 'commons' | 'archive';

type MiniGame = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: GameStatus;
  tier: GameTier;
  icon: typeof Gamepad2;
  color: string;
  roadmapMonth: string;
  players: string;
  bestFor: string;
};

const games: MiniGame[] = [
  {
    slug: 'signal-rush',
    name: 'Signal Rush',
    tagline: 'Catch the signals lighting up the city.',
    description: 'A reflex game where public signals stream across the Signal Quarter. Tap the lit windows before they dim. Builds a feel for which signals matter and how fast the city moves.',
    status: 'live',
    tier: 'signal',
    icon: Radio,
    color: '#f4b94e',
    roadmapMonth: 'SEP 2026',
    players: '1 player',
    bestFor: 'Warming up before a build session',
  },
  {
    slug: 'district-builder',
    name: 'District Builder',
    tagline: 'Stack blocks into a recognizable district.',
    description: 'A spatial puzzle that mirrors Workshop Row. Arrange falling blocks into districts that match real repository shapes. The closer your layout matches a real project, the higher your score.',
    status: 'live',
    tier: 'workshop',
    icon: Building2,
    color: '#4bb5a9',
    roadmapMonth: 'SEP 2026',
    players: '1 player',
    bestFor: 'Thinking about how work fits together',
  },
  {
    slug: 'wayfinder',
    name: 'Wayfinder',
    tagline: 'Trace the shortest path between two signals.',
    description: 'A route puzzle set on the city grid. Given two lit signals, find the cleanest path through the streets. Ties into the October wayfinding work: stronger links between a signal and its source.',
    status: 'soon',
    tier: 'commons',
    icon: Compass,
    color: '#4bb5a9',
    roadmapMonth: 'OCT 2026',
    players: '1 player',
    bestFor: 'Practicing how to connect related work',
  },
  {
    slug: 'civic-signal',
    name: 'Civic Signal',
    tagline: 'Match notes to the right district.',
    description: 'A matching game for the civic layer. Builders leave context notes; you route each note to the district it belongs to. Preview of the November civic layer where builders leave context and invitations.',
    status: 'planned',
    tier: 'commons',
    icon: Users,
    color: '#4bb5a9',
    roadmapMonth: 'NOV 2026',
    players: '1 to 4 players',
    bestFor: 'Understanding shared context',
  },
  {
    slug: 'night-reader',
    name: 'Night Reader',
    tagline: 'Read the year in low light.',
    description: 'A slow observation game tied to December night mode. The city dims and you identify what stayed lit across the year. A calmer pace, built for reflection rather than reflex.',
    status: 'planned',
    tier: 'archive',
    icon: Sparkles,
    color: '#f4b94e',
    roadmapMonth: 'DEC 2026',
    players: '1 player',
    bestFor: 'A quieter end-of-year read',
  },
];

const tierData: Record<GameTier, { name: string; color: string; label: string }> = {
  signal: { name: 'Signal Quarter', color: '#f4b94e', label: 'communication' },
  workshop: { name: 'Workshop Row', color: '#4bb5a9', label: 'building' },
  commons: { name: 'Commons', color: '#4bb5a9', label: 'shared spaces' },
  archive: { name: 'Archive', color: '#f4b94e', label: 'memory' },
};

const statusStyles: Record<GameStatus, { label: string; className: string; dot: string }> = {
  live: { label: 'playable now', className: 'text-secondary border-secondary/50 bg-secondary/10', dot: 'bg-secondary' },
  soon: { label: 'coming soon', className: 'text-primary border-primary/50 bg-primary/10', dot: 'bg-primary' },
  planned: { label: 'planned', className: 'text-muted-foreground border-border bg-muted/40', dot: 'bg-muted-foreground/60' },
};

function GameCard({ game }: { game: MiniGame }) {
  const Icon = game.icon;
  const status = statusStyles[game.status];
  const tier = tierData[game.tier];
  return (
    <article className={`group relative flex flex-col border border-border bg-card/60 p-5 transition-all duration-400 hover:border-primary/60 hover:bg-card/80 ${game.status === 'live' ? '' : 'opacity-95'}`}>
      <div className="flex items-start justify-between">
        <div className="grid size-11 place-items-center border transition-transform duration-300 group-hover:rotate-6" style={{ borderColor: `${game.color}80`, backgroundColor: `${game.color}1a`, color: game.color }}>
          <Icon size={20} />
        </div>
        <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.14em] ${status.className}`}>
          <span className={`size-1.5 ${status.dot} ${game.status === 'live' ? 'animate-pulse-soft' : ''}`} />
          {status.label}
        </span>
      </div>
      <h3 className="mt-6 font-display text-2xl font-semibold tracking-[-.02em]">{game.name}</h3>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{game.tagline}</p>
      <p className="mt-4 text-sm leading-6 text-muted-foreground/90">{game.description}</p>
      <div className="mt-5 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">
        <span className="border border-border/70 px-2 py-1" style={{ color: tier.color }}>{tier.name}</span>
        <span className="border border-border/70 px-2 py-1">{game.players}</span>
        <span className="border border-border/70 px-2 py-1">{game.roadmapMonth}</span>
      </div>
      <div className="mt-auto pt-6">
        {game.status === 'live' ? (
          <button type="button" data-testid={`button-play-${game.slug}`} className="flex w-full items-center justify-center gap-2 border border-primary bg-primary py-3 font-mono text-[10px] uppercase tracking-[.15em] text-primary-foreground transition-transform hover:-translate-y-0.5">
            Play now <ArrowUpRight size={14} />
          </button>
        ) : (
          <div className="flex w-full items-center justify-center gap-2 border border-border py-3 font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">
            <LockKeyhole size={13} /> Notify me
          </div>
        )}
      </div>
    </article>
  );
}

function ArchitectureBlock() {
  const layers = [
    { icon: Signal, title: 'Signal layer', text: 'Game state and scores live in the browser first, matching the frontend-first demo principle. No account needed to play.', tier: 'signal' as const },
    { icon: Map, title: 'City binding', text: 'Each game maps to a real URBANOVA district so play reinforces the same mental model the map uses: signal, workshop, commons, archive.', tier: 'workshop' as const },
    { icon: Coins, title: 'Mint path', text: 'High scores and district milestones are designed to become mintable city NFTs once the November marketplace goes live.', tier: 'commons' as const },
    { icon: Calendar, title: 'Roadmap sync', text: 'Games ship alongside the district they teach. A game only goes live after its district is readable on the main map.', tier: 'archive' as const },
  ];
  return (
    <section className="border-y border-border/60 bg-[#101323]">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-20">
        <SectionLabel>Architecture / how mini games fit</SectionLabel>
        <div className="grid gap-10 md:grid-cols-[.75fr_1.25fr]">
          <div>
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-4xl">Games that teach the city.</h2>
            <p className="mt-5 max-w-md leading-7 text-muted-foreground">Mini games are not a side quest. Each one is a small, playable lesson in how URBANOVA reads public work. They share the same districts, colors, and vocabulary as the main map, so time spent in a game makes the map easier to read.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {layers.map((layer) => {
              const Icon = layer.icon;
              const tier = tierData[layer.tier];
              return (
                <div key={layer.title} className="border border-border bg-card/50 p-5">
                  <div className="grid size-10 place-items-center border" style={{ borderColor: `${tier.color}80`, backgroundColor: `${tier.color}1a`, color: tier.color }}>
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-6 font-display text-lg font-semibold">{layer.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{layer.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function RoadmapAlignment() {
  const months: [string, string, string, boolean, string][] = [
    ['AUG 2026', 'Foundations', 'Landing page live at urbanova.app, listing on EasyA Kickstart, Mint NFT City Urbanova, and the first readable health model.', true, ''],
    ['SEP 2026', 'Districts', 'Four districts online with deeper source connections and on-chain city ownership.', true, 'Signal Rush + District Builder go live'],
    ['OCT 2026', 'Wayfinding', 'A clearer route through your city, with stronger links between a signal and its source.', false, 'Wayfinder enters preview'],
    ['NOV 2026', 'Civic layer', 'Shared spaces for builders to leave context, notes, and invitations, plus a marketplace for city NFTs.', false, 'Civic Signal + score minting'],
    ['DEC 2026', 'Night mode', 'A slower, deeper read of your year in public. What stayed lit, what changed shape, and what to mint next.', false, 'Night Reader goes live'],
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-20">
      <SectionLabel>Roadmap alignment / 2026</SectionLabel>
      <div className="border border-border bg-card/50 p-5 sm:p-8">
        <div className="mb-4 flex items-center justify-between font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">
          <span>Mini games on the roadmap</span>
          <span>2 of 5 games live</span>
        </div>
        <div className="h-1 bg-muted">
          <div className="h-full w-2/5 bg-primary" />
        </div>
        <div className="mt-8 space-y-0">
          {months.map(([month, title, text, complete, gameNote], i) => (
            <div key={month} className="relative grid grid-cols-[76px_18px_1fr] gap-4 pb-9 last:pb-0">
              <div className={`pt-1 font-mono text-[10px] tracking-[.08em] ${complete ? 'text-primary' : 'text-muted-foreground'}`}>{month}</div>
              <div className="relative flex justify-center">
                <span className={`z-10 mt-1.5 size-3 border-2 ${complete ? 'border-primary bg-primary' : 'border-muted-foreground/50 bg-card'}`} />
                {i < months.length - 1 && <span className={`absolute top-4 h-full w-px ${complete ? 'bg-primary/60' : 'bg-border'}`} />}
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold">{title}</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{text}</p>
                {gameNote && (
                  <span className="mt-3 inline-flex items-center gap-2 border border-secondary/40 bg-secondary/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.14em] text-secondary">
                    <Gamepad2 size={12} /> {gameNote}
                  </span>
                )}
                {!gameNote && (
                  <span className={`mt-3 inline-block font-mono text-[9px] uppercase tracking-[.15em] ${complete ? 'text-secondary' : 'text-muted-foreground'}`}>{complete ? 'shipped' : 'in the works'}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MockupPreview() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-8 md:pb-20">
      <SectionLabel>Mockup / in-game preview</SectionLabel>
      <div className="overflow-hidden border border-border bg-card/60">
        <div className="flex items-center justify-between border-b border-border/70 bg-[#0d1020] px-5 py-3">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">
            <span className="size-2 bg-primary" /> Signal Rush / preview frame
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] tracking-[.12em] text-muted-foreground">
            <span>score <span className="text-primary">0240</span></span>
            <span className="h-3 w-px bg-border" />
            <span>combo <span className="text-secondary">x3</span></span>
          </div>
        </div>
        <div className="relative grid-lines p-6 sm:p-10">
          <div className="absolute right-6 top-6 font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground/70">Signal Quarter / east edge</div>
          <div className="mx-auto grid max-w-md grid-cols-5 gap-2.5 sm:gap-3">
            {Array.from({ length: 25 }).map((_, i) => {
              const lit = [3, 7, 9, 14, 18, 20, 22].includes(i);
              const hot = [7, 18].includes(i);
              return (
                <div
                  key={i}
                  className={`aspect-square border ${lit ? 'border-primary/70 bg-primary/20' : 'border-border/60 bg-muted/30'} ${hot ? 'animate-pulse-soft' : ''}`}
                  style={lit ? { boxShadow: '0 0 12px rgba(244,185,78,.25)' } : undefined}
                >
                  {lit && <span className="block h-full w-full bg-primary/40" />}
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="max-w-sm text-center text-sm leading-6 text-muted-foreground sm:text-left">Tap the lit windows before they dim. Each catch extends your combo and lights more of the district behind you.</p>
            <button type="button" className="flex items-center gap-2 border border-primary bg-primary px-5 py-3 font-mono text-[10px] uppercase tracking-[.15em] text-primary-foreground transition-transform hover:-translate-y-0.5">
              <Zap size={14} /> Start round
            </button>
          </div>
        </div>
      </div>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Mockup only. Interactions are illustrative and not wired to live game logic yet.</p>
    </section>
  );
}

export default function MiniGames() {
  return (
    <div className="noise">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-24">
          <div className="grid gap-10 md:grid-cols-[.8fr_1.2fr]">
            <div className="relative">
              <div className="hero-glow animate-gradient-drift" style={{ width: 260, height: 260, background: 'radial-gradient(circle, rgba(244,185,78,.35), transparent 70%)', top: -40, left: -30 }} />
              <div className="relative z-10 animate-rise">
                <SectionLabel>Mini games / playable districts</SectionLabel>
                <h1 className="font-display text-5xl font-bold leading-[.9] tracking-[-.06em] sm:text-7xl text-balance">
                  Play the <span className="shimmer-text">city.</span>
                </h1>
                <p className="mt-7 max-w-md leading-7 text-muted-foreground">
                  Small, focused games that teach the same map URBANOVA uses to read public work. Each one belongs to a district, ships with its roadmap month, and turns a concept into a reflex.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button type="button" data-testid="button-play-signal-rush" className="flex items-center gap-2 border border-primary bg-primary px-5 py-3 font-mono text-[10px] uppercase tracking-[.15em] text-primary-foreground transition-transform hover:-translate-y-0.5">
                    Play Signal Rush <ArrowUpRight size={15} />
                  </button>
                  <Link href="/roadmap" className="flex items-center gap-2 border border-border px-5 py-3 font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground">
                    See the roadmap <ChevronRight size={15} />
                  </Link>
                </div>
                <div className="mt-10 flex items-center gap-4 border-t border-border/70 pt-5 font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">
                  <span className="text-foreground">02</span>
                  <span className="h-px w-12 bg-border" />
                  5 games mapped to 4 districts
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="hero-glow animate-gradient-drift" style={{ width: 320, height: 320, background: 'radial-gradient(circle, rgba(75,181,169,.3), transparent 70%)', bottom: -60, right: -40 }} />
              <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-4">
                {games.map((game) => {
                  const Icon = game.icon;
                  return (
                    <div key={game.slug} className="flex flex-col border border-border bg-card/50 p-4">
                      <div className="grid size-9 place-items-center border" style={{ borderColor: `${game.color}80`, backgroundColor: `${game.color}1a`, color: game.color }}>
                        <Icon size={17} />
                      </div>
                      <p className="mt-4 font-display text-sm font-semibold">{game.name}</p>
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">{game.roadmapMonth}</p>
                    </div>
                  );
                })}
                <div className="flex flex-col items-center justify-center border border-dashed border-border bg-card/20 p-4 text-center">
                  <Trophy size={18} className="text-primary" />
                  <p className="mt-3 font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">Leaderboard<br />coming with civic layer</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-[#101323]">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-20">
            <SectionLabel>The lineup / 5 games</SectionLabel>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {games.map((game) => <GameCard key={game.slug} game={game} />)}
            </div>
          </div>
        </section>

        <ArchitectureBlock />
        <RoadmapAlignment />
        <MockupPreview />

        <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-8 md:pb-20">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="border border-primary/50 bg-primary/5 p-6">
              <Terminal size={20} className="text-primary" />
              <h2 className="mt-10 font-display text-2xl font-semibold">Games are a reading tool.</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">We build in the open and adjust when a game tells us something the map did not. If a game does not make the city clearer, it does not ship.</p>
            </div>
            <div className="border border-border bg-card/50 p-6">
              <CircleHelp size={20} className="text-secondary" />
              <h2 className="mt-10 font-display text-2xl font-semibold">Have a game idea?</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">The best next game usually starts as a precise question from someone using the map. Tell us which district is hardest to read.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
