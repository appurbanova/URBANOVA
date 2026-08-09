import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Activity, ArrowUpRight, Building2, Check, ChevronRight, CircleHelp,
  Compass, Cookie, Eye, FileText, Github, Layers3, LockKeyhole, LogOut, Menu, Network, Orbit,
  Radio, Scale, ShieldCheck, Terminal, UserRound, WalletCards, X, Zap
} from 'lucide-react';
import { SiApple, SiGoogleplay } from 'react-icons/si';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import NotFound from '@/pages/not-found';
import { Urbanova3D } from '@/components/Urbanova3D';
import { UrbanovaCityPreview } from '@/components/UrbanovaCityPreview';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

const queryClient = new QueryClient();

type DistrictKey = 'signal' | 'workshop' | 'commons' | 'archive';
type User = { email: string; name: string; joined: string; wallet?: string };
type Activity = { source: string; title: string; date: string; type: string; color: string };
type GitHubProfile = {
  login: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  html_url: string;
};

const districtData: Record<DistrictKey, { name: string; eyebrow: string; color: string; description: string; stat: string; detail: string }> = {
  signal: { name: 'Signal Quarter', eyebrow: 'communication', color: '#f4b94e', description: 'Your public conversations, notes, and open decisions become light along the east edge.', stat: '18 active signals', detail: 'New activity is arriving from GitHub discussions and your public changelog.' },
  workshop: { name: 'Workshop Row', eyebrow: 'building', color: '#4bb5a9', description: 'The places where code becomes a product. Repositories, releases, and shipped work shape this district.', stat: '42 structures', detail: 'Four repositories moved from foundation to occupied this week.' },
  commons: { name: 'Commons', eyebrow: 'community', color: '#e4786d', description: 'A shared civic layer for the people who use, test, and extend your work in the open.', stat: '126 visitors', detail: 'Your latest release brought a new cohort into the central square.' },
  archive: { name: 'Archive Heights', eyebrow: 'memory', color: '#9b8ad6', description: 'Past experiments remain visible. A city should remember what it learned, not just what it launched.', stat: '37 preserved blocks', detail: 'A quiet district for old projects, early sketches, and useful dead ends.' },
};

const seedActivity: Activity[] = [
  { source: 'GITHUB', title: 'urbanova/city-core reached a new release', date: '12 min ago', type: 'release', color: '#f4b94e' },
  { source: 'NOTION', title: 'Published “A field guide to open systems”', date: '2 hrs ago', type: 'writing', color: '#4bb5a9' },
  { source: 'GITHUB', title: 'Merged 8 contributions into workshop-row', date: 'Yesterday', type: 'merge', color: '#9b8ad6' },
  { source: 'WEB', title: 'A new reader visited the Commons', date: '2 days ago', type: 'visitor', color: '#e4786d' },
];

function getSession(): User | null { return null; }
function saveSession(_user: User) { /* deprecated: auth now handled by Supabase */ }

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 group" data-testid="link-logo">
      <span className="brand-mark relative grid size-8 place-items-center border transition-transform duration-500 group-hover:rotate-45">
        <span className="brand-mark-core size-2.5" />
        <span className="brand-mark-frame absolute inset-1.5 border" />
      </span>
      {!compact && <span className="brand-wordmark font-display text-[1.05rem] font-bold tracking-[.2em]">URBANOVA</span>}
    </Link>
  );
}

function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const links = [['/demo', 'Demo'], ['/about', 'About'], ['/how-to', 'How it works'], ['/roadmap', 'Roadmap']];
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header className={`sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl transition-shadow duration-300 ${scrolled ? 'shadow-[0_12px_35px_rgba(0,0,0,.22)]' : ''}`}>
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 py-3 sm:h-18 sm:px-8 sm:py-0">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          {links.map(([href, label]) => <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={`font-mono text-[10px] uppercase tracking-[.18em] transition-colors hover:text-primary ${location === href ? 'text-primary' : 'text-muted-foreground'}`}>{label}</Link>)}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/dashboard" data-testid="link-command-center" className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground transition-colors hover:text-foreground">Command center</Link>
           <Link href="/login" data-testid="link-enter-city" className="flex items-center gap-2 border border-primary bg-primary px-4 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[.15em] text-primary-foreground transition-transform hover:-translate-y-0.5 hover:bg-[#f7c96d]">Enter city <ArrowUpRight size={14} /></Link>
        </div>
        <button type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen(!open)} className="grid size-10 place-items-center border border-border text-foreground md:hidden" data-testid="button-mobile-nav">{open ? <X size={18} /> : <Menu size={18} />}</button>
      </div>
      {open && <nav className="border-t border-border/60 bg-card px-5 py-5 md:hidden" aria-label="Mobile navigation">
        <div className="flex flex-col gap-1">
          {links.concat([['/dashboard', 'Command center']]).map(([href, label]) => <Link onClick={() => setOpen(false)} key={href} href={href} data-testid={`link-mobile-${label.toLowerCase().replaceAll(' ', '-')}`} className="flex items-center justify-between border-b border-border/50 py-4 font-mono text-[11px] uppercase tracking-[.16em] text-muted-foreground">{label}<ChevronRight size={15} /></Link>)}
          <Link onClick={() => setOpen(false)} href="/login" data-testid="link-mobile-enter-city" className="mt-4 flex items-center justify-center gap-2 bg-primary py-3 font-mono text-[10px] uppercase tracking-[.15em] text-primary-foreground">Enter city <ArrowUpRight size={14} /></Link>
        </div>
      </nav>}
    </header>
  );
}

function Footer() {
  return <footer className="border-t border-border/60 bg-[#0b1020]">
    <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
      <div><Logo /><p className="mt-4 max-w-xs font-mono text-[10px] leading-5 tracking-[.08em] text-muted-foreground">A living map for the work you put into the world.</p></div>
      <div className="flex flex-wrap gap-x-6 gap-y-3 font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground"><Link href="/legal" data-testid="link-footer-legal" className="hover:text-primary">Legal center</Link><Link href="/privacy" data-testid="link-footer-privacy" className="hover:text-primary">Privacy</Link><Link href="/terms" data-testid="link-footer-terms" className="hover:text-primary">Terms</Link><Link href="/cookies" data-testid="link-footer-cookies" className="hover:text-primary">Cookies</Link><Link href="/about" data-testid="link-footer-about" className="hover:text-primary">About</Link><a href="https://github.com/appurbanova/URBANOVA" target="_blank" rel="noreferrer" data-testid="link-footer-github" className="flex items-center gap-2 hover:text-primary">Source <Github size={13} /></a></div>
    </div>
  </footer>;
}

const seoByPath: Record<string, { title: string; description: string; indexable: boolean }> = {
  '/': {
    title: 'URBANOVA | A Living Digital City for Builders',
    description: 'URBANOVA turns public work into a living digital city where builders can explore projects, signals, communities, and ideas.',
    indexable: true,
  },
  '/demo': {
    title: 'Interactive Digital City Demo | URBANOVA',
    description: 'Explore a living URBANOVA city demo and see how public projects, conversations, and community signals become visible as districts.',
    indexable: true,
  },
  '/about': {
    title: 'About URBANOVA | A Living Digital City for Builders',
    description: 'Learn how URBANOVA gives public work a place to live by turning builder activity, ideas, and communities into an explorable digital city.',
    indexable: true,
  },
  '/how-to': {
    title: 'How URBANOVA Works | Read Your Public Work as a City',
    description: 'See how URBANOVA connects public work, releases, writing, and conversations into a clear, explorable map for builders.',
    indexable: true,
  },
  '/roadmap': {
    title: 'URBANOVA Roadmap | Building the Digital City',
    description: 'Follow the URBANOVA roadmap as the living digital city grows from a thoughtful public-work map into a richer builder environment.',
    indexable: true,
  },
  '/cookies': {
    title: 'URBANOVA Privacy and Local Storage Policy',
    description: 'Read how the URBANOVA frontend preview handles local sessions, demo preferences, analytics choices, and browser storage.',
    indexable: true,
  },
  '/legal': {
    title: 'Legal Center | URBANOVA',
    description: 'Find URBANOVA privacy, terms, and cookie information in one clear legal center.',
    indexable: true,
  },
  '/privacy': {
    title: 'Privacy Policy | URBANOVA',
    description: 'Read how URBANOVA handles information in the public preview and future product surfaces.',
    indexable: true,
  },
  '/terms': {
    title: 'Terms of Use | URBANOVA',
    description: 'Read the terms for using the URBANOVA public preview and its connected public sources.',
    indexable: true,
  },
  '/login': {
    title: 'Enter URBANOVA | Your Private Command Center',
    description: 'Enter the URBANOVA preview to tune your living city, explore districts, and read the health of your public work.',
    indexable: false,
  },
  '/dashboard': {
    title: 'URBANOVA Command Center | Your Living City',
    description: 'View your URBANOVA city health, active districts, public connections, and latest signals in one private command center.',
    indexable: false,
  },
};

function Seo() {
  const [location] = useLocation();
  useEffect(() => {
    const path = location.split('?')[0].replace(/\/$/, '') || '/';
    const metadata = seoByPath[path] ?? {
      title: 'Page Not Found | URBANOVA',
      description: 'The URBANOVA page you requested could not be found.',
      indexable: false,
    };
    const canonicalUrl = `https://urbanova.app${path === '/' ? '/' : path}`;
    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = content;
    };
    document.title = metadata.title;
    setMeta('meta[name="description"]', 'name', 'description', metadata.description);
    setMeta('meta[name="robots"]', 'name', 'robots', metadata.indexable ? 'index, follow' : 'noindex, nofollow');
    setMeta('meta[property="og:title"]', 'property', 'og:title', metadata.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', metadata.description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', metadata.title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', metadata.description);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, [location]);
  return null;
}

function CityMap({ active = [], onSelect, compact = false }: { active?: DistrictKey[]; onSelect?: (key: DistrictKey) => void; compact?: boolean }) {
  const districts: { key: DistrictKey; points: string }[] = [
    { key: 'signal', points: '95,40 190,28 240,82 207,152 116,140 75,93' },
    { key: 'workshop', points: '265,94 390,58 460,116 430,213 312,223 245,163' },
    { key: 'commons', points: '88,183 194,166 275,226 242,322 113,305 61,248' },
    { key: 'archive', points: '310,252 432,232 489,305 439,389 308,358 270,302' },
  ];
  return <div className={`relative overflow-hidden border border-border bg-[#101526] ${compact ? 'h-full min-h-[290px]' : 'aspect-[1.25/1] min-h-[300px] sm:min-h-[420px]'}`}>
    <div className="absolute inset-0 grid-lines opacity-60" />
    <div className="absolute left-4 top-4 z-10 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground"><span className="size-1.5 animate-pulse-soft bg-primary" />Live city model</div>
    <svg viewBox="0 0 560 420" className="city-svg relative z-[1]" role="img" aria-label="Interactive abstract city map">
      <path className="water" d="M0 330 C 90 290, 144 350, 225 335 S 390 310, 560 350 L560 420 L0 420Z" />
      <path className="street" d="M20 156 L540 80 M15 215 L530 180 M28 280 L540 290 M80 20 L70 400 M180 18 L215 400 M285 10 L300 400 M390 10 L405 400 M485 15 L465 400" />
      <path className="artery" d="M30 345 C 135 275, 214 300, 280 180 S 430 100, 540 42" />
      <path className="artery" d="M50 50 C 175 125, 175 240, 287 260 S 420 270, 510 380" />
      {districts.map(({ key, points }) => <g key={key} onClick={() => onSelect?.(key)} className={onSelect ? 'cursor-pointer' : ''}><polygon points={points} className={`district-fill ${active.includes(key) ? 'active' : ''}`} /><text x={key === 'signal' ? 138 : key === 'workshop' ? 320 : key === 'commons' ? 128 : 337} y={key === 'signal' ? 93 : key === 'workshop' ? 142 : key === 'commons' ? 230 : 304} fill={active.includes(key) ? '#f4b94e' : 'rgba(234,230,213,.72)'} fontSize="9" fontFamily="DM Mono" textAnchor="middle" letterSpacing="1">{districtData[key].name.toUpperCase()}</text></g>)}
      {Array.from({ length: 50 }, (_, i) => { const x = 34 + ((i * 83) % 470); const y = 32 + ((i * 47) % 345); return <rect key={i} className="block" x={x} y={y} width={4 + (i % 4) * 2} height={4 + (i % 5) * 2} />; })}
      {Array.from({ length: 24 }, (_, i) => { const x = 64 + ((i * 97) % 430); const y = 44 + ((i * 61) % 320); return <circle key={`w${i}`} className="window" cx={x} cy={y} r={i % 3 === 0 ? 2 : 1.3} opacity={active.length ? .8 : .48} />; })}
    </svg>
    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground"><span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-primary" />activity</span><span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-secondary" />structure</span></div>
  </div>;
}

function SectionLabel({ children }: { children: ReactNode }) { return <div className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.22em] text-primary"><span className="h-px w-8 bg-primary" />{children}</div>; }

function StoreBadge({ store }: { store: 'apple' | 'google' }) {
  const apple = store === 'apple';
  const Icon = apple ? SiApple : SiGoogleplay;
  return (
    <div
      className="group flex min-w-[158px] items-center gap-3 border border-border/90 bg-[#0d1020]/80 px-3.5 py-2.5 opacity-90 shadow-[0_8px_24px_rgba(0,0,0,.16)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-[#12172a]"
      aria-label={`${apple ? 'App Store' : 'Google Play'} download coming soon`}
    >
      <Icon className="size-6 shrink-0 text-foreground transition-colors duration-300 group-hover:text-primary" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block font-mono text-[8px] uppercase tracking-[.14em] text-muted-foreground">Coming soon</span>
        <span className="mt-0.5 block truncate font-display text-[15px] font-semibold leading-none text-foreground">{apple ? 'App Store' : 'Google Play'}</span>
      </span>
    </div>
  );
}

function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let ticking = false;
    const update = () => {
      const scroll = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? scroll / height : 0);
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <div className="scroll-progress" style={{ transform: `scaleX(${progress})` }} />;
}

function useParallax<T extends HTMLElement>(speed = 0.3) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    let ticking = false;
    const update = () => {
      const el = ref.current;
      if (!el) { ticking = false; return; }
      const rect = el.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [speed]);
  return ref;
}

function useCountUp(target: number, duration = 1600, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const begin = performance.now();
    const tick = (now: number) => {
      const elapsed = now - begin;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

function MagneticButton({ href, children, testId, variant = 'primary' }: { href: string; children: ReactNode; testId?: string; variant?: 'primary' | 'ghost' }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.2;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.2;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  }, []);
  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (el) el.style.transform = 'translate(0, 0)';
  }, []);
  const base = 'flex items-center gap-3 px-5 py-3.5 font-mono text-[10px] uppercase tracking-[.14em] magnetic';
  const styles = variant === 'primary'
    ? `${base} bg-primary text-primary-foreground`
    : `${base} border border-border text-muted-foreground hover:border-primary hover:text-primary`;
  return (
    <Link
      ref={ref as React.RefObject<HTMLAnchorElement>}
      href={href}
      data-testid={testId}
      className={styles}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </Link>
  );
}

function useSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        el.style.setProperty('--my', `${e.clientY - rect.top}px`);
        el.classList.add('is-active');
        raf = 0;
      });
    };
    const onLeave = () => el.classList.remove('is-active');
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return ref;
}

function useTilt<T extends HTMLElement>(max = 8) {
  const ref = useRef<T | null>(null);
  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(600px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
  }, [max]);
  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (el) el.style.transform = 'perspective(600px) rotateX(0) rotateY(0)';
  }, []);
  return { ref, onMouseMove, onMouseLeave };
}

function Particles({ count = 18 }: { count?: number }) {
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => {
    const colors = ['#f4b94e', '#4bb5a9', '#e4786d', '#9b8ad6'];
    return {
      id: i,
      left: `${Math.random() * 100}%`,
      bottom: `${Math.random() * 30}%`,
      size: 2 + Math.random() * 4,
      color: colors[i % colors.length],
      duration: `${6 + Math.random() * 8}s`,
      delay: `${Math.random() * 8}s`,
      drift: `${(Math.random() - 0.5) * 60}px`,
      opacity: 0.3 + Math.random() * 0.4,
    };
  }), [count]);
  return <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">{particles.map((p) => <span key={p.id} className="particle" style={{ left: p.left, bottom: p.bottom, width: p.size, height: p.size, background: p.color, '--p-duration': p.duration, '--p-delay': p.delay, '--p-drift': p.drift, '--p-opacity': p.opacity } as React.CSSProperties} />)}</div>;
}

function ActivityTicker() {
  const items = [
    { icon: '◆', text: 'New release · urbanova/city-core v2.1', color: '#f4b94e' },
    { icon: '●', text: '8 contributions merged into Workshop Row', color: '#4bb5a9' },
    { icon: '▲', text: 'Mint NFT City Urbanova is live', color: '#e4786d' },
    { icon: '◆', text: 'Listing confirmed on Orynth.dev', color: '#9b8ad6' },
    { icon: '●', text: '126 visitors explored the Commons', color: '#f4b94e' },
    { icon: '▲', text: 'New field guide published — “Open systems”', color: '#4bb5a9' },
  ];
  const doubled = [...items, ...items];
  return <div className="ticker-mask relative overflow-hidden border-y border-border/60 bg-[#0d1120] py-3"><div className="ticker-track gap-8">{doubled.map((item, i) => <span key={i} className="flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground"><span style={{ color: item.color }}>{item.icon}</span>{item.text}</span>)}</div></div>;
}

function RotatingWord({ words, interval = 2800 }: { words: string[]; interval?: number }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter');
  useEffect(() => {
    const cycle = setInterval(() => {
      setPhase('exit');
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length);
        setPhase('enter');
      }, 400);
    }, interval);
    return () => clearInterval(cycle);
  }, [words.length, interval]);
  return <span className="relative inline-block" style={{ minWidth: '4ch' }}><span key={index} className={phase === 'enter' ? 'rotate-word-enter shimmer-text' : 'rotate-word-exit'}>{words[index]}</span></span>;
}

function DistrictCard3D({ districtKey, index, selected, onSelect }: { districtKey: DistrictKey; index: number; selected: boolean; onSelect: () => void }) {
  const { ref, onMouseMove, onMouseLeave } = useTilt<HTMLAnchorElement>(6);
  const data = districtData[districtKey];
  return (
    <Link
      ref={ref as React.RefObject<HTMLAnchorElement>}
      href="/demo"
      onMouseEnter={onSelect}
      onFocus={onSelect}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      data-testid={`card-home-district-${districtKey}`}
      className={`district-card-3d glow-ring group relative overflow-hidden border bg-card/45 p-5 ${selected ? 'border-primary/70 shadow-[0_16px_42px_rgba(244,185,78,.08)]' : 'border-border/70'}`}
    >
      <div className="card-3d-inner relative z-10">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span>
          <span className="relative size-2">
            <span className="block size-2" style={{ backgroundColor: data.color }} />
            {selected && <span className="pulse-ring" style={{ color: data.color }} />}
          </span>
        </div>
        <h3 className="mt-12 font-display text-xl font-semibold">{data.name}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{data.description}</p>
        <div className="mt-6 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.15em] text-primary">Inspect district <ArrowUpRight size={13} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" /></div>
      </div>
      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: `radial-gradient(circle at 50% 0%, ${data.color}18, transparent 70%)` }} />
    </Link>
  );
}

function Home() {
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictKey>('signal');
  const [healthVisible, setHealthVisible] = useState(false);
  const heroSpotRef = useSpotlight();
  const selected = districtData[selectedDistrict];
  const heroGlowRef = useParallax<HTMLDivElement>(-0.12);
  const cityHealthRef = useRef<HTMLDivElement>(null);
  const healthValue = useCountUp(86.4, 1800, healthVisible);
  useEffect(() => {
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          reveal.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.home-reveal').forEach((element) => reveal.observe(element));
    const healthObserver = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) { setHealthVisible(true); healthObserver.disconnect(); }
    }, { threshold: 0.5 });
    if (cityHealthRef.current) healthObserver.observe(cityHealthRef.current);
    return () => { reveal.disconnect(); healthObserver.disconnect(); };
  }, []);
  return <div className="noise"><ScrollProgress /><SiteHeader /><main>
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-lines opacity-25" />
      <Particles count={16} />
      <div ref={heroSpotRef} className="hero-spotlight" aria-hidden="true" />
      <div ref={heroGlowRef} className="hero-glow animate-gradient-drift -top-20 -left-20 size-[420px] bg-[#f4b94e]/20" />
      <div className="hero-glow animate-gradient-drift [animation-delay:6s] -right-32 top-40 size-[380px] bg-[#4bb5a9]/15" />
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 pb-14 pt-10 sm:gap-10 sm:px-8 sm:pb-16 sm:pt-14 md:grid-cols-[.9fr_1.1fr] md:gap-8 md:pb-24 md:pt-24">
        <div className="relative z-10 animate-rise"><SectionLabel>Public activity, made legible</SectionLabel><h1 className="font-display max-w-xl text-[clamp(3.2rem,8vw,7rem)] font-bold leading-[.9] tracking-[-.07em] text-balance">Your work is already a <span className="shimmer-text">city.</span></h1><p className="mt-7 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">URBANOVA turns the things you build in public into a <RotatingWord words={['living, explorable world.', 'map you can walk.', 'system you can read.', 'place you can return to.']} /> See the signal. Find the shape. Keep moving.</p><div className="mt-8 flex flex-wrap items-center gap-3"><MagneticButton href="/demo" testId="link-hero-demo">Explore a sample city <ArrowUpRight size={15} /></MagneticButton><MagneticButton href="/how-to" testId="link-hero-how-to" variant="ghost">Read the field guide <ChevronRight size={15} /></MagneticButton></div><div className="mt-7 flex flex-wrap items-center gap-2.5" aria-label="Mobile apps coming soon"><StoreBadge store="apple" /><StoreBadge store="google" /></div><div className="mt-10 flex items-center gap-4 border-t border-border/70 pt-5 font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground"><span className="text-foreground">01</span><span className="h-px w-12 bg-border" />A map, not a feed</div></div>
          <div className="city-canvas-shell relative min-h-[430px] animate-rise [animation-delay:120ms] sm:min-h-[470px] md:min-h-[540px]"><div className="absolute -inset-12 bg-[radial-gradient(circle,rgba(244,185,78,.13),transparent_55%)]" /><UrbanovaCityPreview /><div ref={cityHealthRef} className="absolute -bottom-3 right-2 z-20 border border-primary/40 bg-[#12172a]/90 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3 animate-glow-pulse"><div className="font-mono text-[8px] uppercase tracking-[.15em] text-primary">City health</div><div className="mt-1 flex items-end gap-2"><span className="font-display text-2xl font-semibold sm:text-3xl">{healthValue.toFixed(1)}</span><span className="mb-1 font-mono text-[9px] text-muted-foreground sm:text-[10px]">/ 100</span></div></div></div>
      </div>
    </section>
    <ActivityTicker />
    <section className="home-reveal border-y border-border/60 bg-[#101323]"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[.75fr_1.25fr] md:py-20"><div><SectionLabel>Why a city</SectionLabel><h2 className="font-display text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-4xl">A better way to read a builder.</h2></div><div className="grid gap-8 sm:grid-cols-3"><Feature icon={<Orbit size={19} />} title="Find the signal" text="A quiet layer over your public work, connecting releases, writing, and conversation." /><Feature icon={<Layers3 size={19} />} title="See the shape" text="Districts reveal patterns that a chronological feed keeps flat and easy to miss." /><Feature icon={<Compass size={19} />} title="Choose your next" text="Use the city as a personal instrument for deciding where to put your attention." /></div></div></section>
    <section className="home-reveal mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24"><div className="grid gap-10 md:grid-cols-[1.15fr_.85fr] md:items-end"><div><SectionLabel>Made for the open web</SectionLabel><h2 className="font-display max-w-2xl text-4xl font-semibold leading-[.98] tracking-[-.055em] sm:text-6xl">The public internet is a place. <span className="text-muted-foreground">URBANOVA gives it contours.</span></h2></div><div className="border-l border-primary/50 pl-5 text-sm leading-6 text-muted-foreground">No vanity metrics. No productivity theatre. Just a thoughtful surface for the work, people, and ideas you have chosen to make visible.</div></div><div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(Object.keys(districtData) as DistrictKey[]).map((key, i) => <DistrictCard3D key={key} districtKey={key} index={i} selected={selectedDistrict === key} onSelect={() => setSelectedDistrict(key)} />)}</div><div className="mt-4 flex flex-col gap-4 border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between" aria-live="polite"><div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-primary">{selected.eyebrow} / selected layer</div><p className="mt-1 font-display text-xl font-semibold">{selected.name}</p><p className="mt-1 text-sm text-muted-foreground">{selected.stat} · {selected.detail}</p></div><Link href="/demo" className="inline-flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[.14em] text-primary hover:underline">Open the map <ArrowUpRight size={14} /></Link></div></section>
    <section className="home-reveal border-t border-border/60 bg-primary px-5 py-14 text-primary-foreground sm:px-8 md:py-20"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-end"><div><div className="font-mono text-[10px] uppercase tracking-[.2em] opacity-70">Start with what is already there</div><h2 className="mt-4 max-w-xl font-display text-4xl font-bold leading-none tracking-[-.05em] sm:text-6xl">Give your work a place to live.</h2></div><Link href="/login" data-testid="link-cta-create-city" className="magnetic flex items-center gap-3 border border-primary-foreground/50 px-5 py-3.5 font-mono text-[10px] uppercase tracking-[.15em] transition-colors hover:bg-primary-foreground hover:text-primary">Create your demo city <ArrowUpRight size={15} /></Link></div></section>
  </main><Footer /></div>;
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) { return <div><div className="mb-4 grid size-9 place-items-center border border-secondary/60 text-secondary">{icon}</div><h3 className="font-display font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>; }

function Demo() {
  const [identity, setIdentity] = useState('Mara Chen');
  const [active, setActive] = useState<DistrictKey[]>(['signal', 'workshop']);
  const [selected, setSelected] = useState<DistrictKey>('signal');
  const [saved, setSaved] = useState(false);
  const [githubHandle, setGithubHandle] = useState('');
  const [githubProfile, setGithubProfile] = useState<GitHubProfile | null>(null);
  const [githubStatus, setGithubStatus] = useState('');
  const [githubLoading, setGithubLoading] = useState(false);
  const selectedDistrict = districtData[selected];
  const identities = ['Mara Chen', 'Jon Bell', 'Ari Okafor'];
  const toggle = (key: DistrictKey) => setActive((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  const loadGithubProfile = async (event: FormEvent) => {
    event.preventDefault();
    const handle = githubHandle.trim().replace(/^@/, '');
    if (!handle) {
      setGithubStatus('Enter a public GitHub username first.');
      return;
    }
    setGithubLoading(true);
    setGithubStatus('Reading the public profile...');
    setGithubProfile(null);
    try {
      const response = await fetch(`https://api.github.com/users/${encodeURIComponent(handle)}`, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!response.ok) {
        if (response.status === 404) throw new Error('That public GitHub profile could not be found.');
        if (response.status === 403) throw new Error('GitHub is rate limiting public requests. Try again shortly.');
        throw new Error('GitHub did not return a readable profile.');
      }
      const profile = await response.json() as GitHubProfile;
      setGithubProfile(profile);
      setIdentity(profile.name || profile.login);
      setActive((current) => current.length ? current : ['workshop']);
      setGithubStatus(`Public signal loaded for @${profile.login}.`);
    } catch (error) {
      setGithubStatus(error instanceof Error ? error.message : 'The public profile could not be loaded.');
    } finally {
      setGithubLoading(false);
    }
  };
  const cityHealth = githubProfile
    ? Math.min(99, Math.round(58 + githubProfile.public_repos * 0.7 + githubProfile.followers * 0.08 + githubProfile.following * 0.03))
    : 86;
  return <div className="noise"><SiteHeader /><main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 md:py-16"><div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><SectionLabel>Interactive product preview</SectionLabel><h1 className="font-display text-4xl font-bold tracking-[-.05em] sm:text-6xl">Meet <span className="text-primary">{githubProfile?.name || identity}'s</span> city.</h1><p className="mt-4 max-w-lg text-muted-foreground">Change the builder, activate a district, and see how a public practice becomes a place.</p></div><div className="font-mono text-[10px] uppercase tracking-[.17em] text-muted-foreground">Demo / 04 districts / live model</div></div><section className="mb-5 border border-primary/40 bg-primary/5 p-5 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-primary"><Github size={13} /> Public GitHub signal</div><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Load a public profile to shape the demo with real repository and community signals. URBANOVA only reads public GitHub data in this preview.</p></div><form onSubmit={loadGithubProfile} className="flex w-full max-w-md gap-2" noValidate><label htmlFor="github-handle" className="sr-only">GitHub username</label><input id="github-handle" value={githubHandle} onChange={(event) => setGithubHandle(event.target.value)} className="min-w-0 flex-1 border border-input bg-background px-3 py-3 text-sm text-foreground" aria-describedby={githubStatus ? 'github-status' : undefined} data-testid="input-github-handle" /><button type="submit" disabled={githubLoading} className="flex shrink-0 items-center gap-2 bg-primary px-4 py-3 font-mono text-[10px] uppercase tracking-[.13em] text-primary-foreground disabled:opacity-60" data-testid="button-load-github">{githubLoading ? 'Reading...' : 'Load profile'} <ArrowUpRight size={14} /></button></form></div>{githubStatus && <p id="github-status" className="mt-3 border-l-2 border-primary px-3 py-2 text-xs text-muted-foreground" data-testid="status-github">{githubStatus}</p>}{githubProfile && <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border/70 pt-4 sm:grid-cols-4"><SignalMetric label="Public repos" value={githubProfile.public_repos} /><SignalMetric label="Followers" value={githubProfile.followers} /><SignalMetric label="Following" value={githubProfile.following} /><SignalMetric label="City health" value={`${cityHealth}/100`} /></div>}</section><div className="grid gap-5 lg:grid-cols-[1fr_350px]"><div className="min-h-[440px]"><CityMap active={active} onSelect={(key) => setSelected(key)} /></div><aside className="flex flex-col border border-border bg-card/70"><div className="border-b border-border p-5"><div className="mb-3 font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Builder identity</div><div className="flex flex-wrap gap-2">{identities.map((item) => <button type="button" key={item} onClick={() => setIdentity(item)} data-testid={`button-identity-${item.split(' ')[0].toLowerCase()}`} className={`border px-3 py-2 font-mono text-[10px] tracking-wide transition-colors ${identity === item ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/60'}`}>{item}</button>)}</div></div><div className="border-b border-border p-5"><div className="mb-3 font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Activate districts</div><div className="space-y-1">{(Object.keys(districtData) as DistrictKey[]).map((key) => <button type="button" key={key} onClick={() => toggle(key)} data-testid={`button-toggle-district-${key}`} className="flex w-full items-center justify-between py-2 text-left"><span className="flex items-center gap-3 text-sm"><span className="size-2" style={{ backgroundColor: districtData[key].color }} />{districtData[key].name}</span><span className={`grid size-5 place-items-center border ${active.includes(key) ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>{active.includes(key) && <Check size={13} />}</span></button>)}</div></div><div className="flex flex-1 flex-col p-5"><div className="flex items-center justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">{selectedDistrict.eyebrow}</div><h2 className="mt-1 font-display text-2xl font-semibold">{selectedDistrict.name}</h2></div><button type="button" aria-label="Change selected district" onClick={() => setSelected((Object.keys(districtData) as DistrictKey[])[(Object.keys(districtData) as DistrictKey[]).indexOf(selected) + 1 >= 4 ? 0 : (Object.keys(districtData) as DistrictKey[]).indexOf(selected) + 1])} className="grid size-8 place-items-center border border-border text-muted-foreground hover:border-primary hover:text-primary" data-testid="button-next-district"><ChevronRight size={15} /></button></div><p className="mt-4 text-sm leading-6 text-muted-foreground">{selectedDistrict.description}</p><div className="mt-auto border-t border-border/70 pt-4"><div className="font-mono text-[11px] text-foreground">{selectedDistrict.stat}</div><p className="mt-2 text-xs leading-5 text-muted-foreground">{selectedDistrict.detail}</p></div></div></aside></div><div className="mt-5 flex flex-col items-start justify-between gap-4 border border-border bg-[#11162a] p-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center border border-secondary/60 text-secondary"><Radio size={17} /></span><div><div className="font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">Now viewing</div><div className="font-display text-lg">{githubProfile?.login || identity}'s living model</div></div></div><button type="button" onClick={() => { setSaved(true); localStorage.setItem('urbanova-demo-preferences', JSON.stringify({ identity, active, selected, githubHandle: githubProfile?.login || githubHandle })); }} data-testid="button-save-demo" className="flex items-center gap-2 bg-primary px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.15em] text-primary-foreground">{saved ? <Check size={14} /> : <Zap size={14} />}{saved ? 'City state saved' : 'Save this city state'}</button></div></main><Footer /></div>;
}

function SignalMetric({ label, value }: { label: string; value: number | string }) {
  return <div><div className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">{label}</div><div className="mt-1 font-display text-xl font-semibold text-foreground">{value}</div></div>;
}

function Login() {
  const [, setLocation] = useLocation();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (!loading && session) setLocation('/dashboard'); }, [session, loading, setLocation]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address to continue.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError(''); setSubmitting(true);
    setStatus(mode === 'signin' ? 'Opening your command center...' : 'Creating your account...');
    try {
      const result = mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
      if (result.error) throw result.error;
      setStatus(mode === 'signin' ? 'Opening your command center...' : 'Account created. Opening your command center...');
      setTimeout(() => setLocation('/dashboard'), 450);
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Authentication failed.';
      setError(message); setStatus('');
    } finally { setSubmitting(false); }
  };
  return <div className="noise"><SiteHeader /><main className="mx-auto grid min-h-[calc(100dvh-73px)] max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 md:grid-cols-[1fr_420px] md:py-20"><div className="hidden md:block"><SectionLabel>Private command center</SectionLabel><h1 className="max-w-xl font-display text-6xl font-bold leading-[.92] tracking-[-.06em]">Come in. The lights are already <span className="text-primary">on.</span></h1><p className="mt-7 max-w-md leading-7 text-muted-foreground">Your city is a personal layer over your public work. Sign in to tune its districts, read its health, and pick a direction.</p><div className="mt-10 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground"><ShieldCheck size={17} className="text-secondary" />Secured by Supabase Auth</div></div><div className="border border-border bg-card/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,.25)] sm:p-8"><div className="mb-8 md:hidden"><SectionLabel>Private command center</SectionLabel><h1 className="font-display text-4xl font-bold tracking-[-.05em]">Come in. The lights are <span className="text-primary">on.</span></h1></div><div className="mb-6 flex items-center gap-3"><span className="grid size-10 place-items-center border border-primary/60 bg-primary/10 text-primary"><UserRound size={17} /></span><div><h2 className="font-display text-xl font-semibold">{mode === 'signin' ? 'Enter your city' : 'Create your city'}</h2><p className="font-mono text-[9px] uppercase tracking-[.13em] text-muted-foreground">{mode === 'signin' ? 'Sign in to your account' : 'New builder account'}</p></div></div><form onSubmit={submit} noValidate><label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Email address</label><input id="email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@yourcity.dev" className="mt-2 w-full border border-input bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground/70" data-testid="input-email" aria-describedby={error ? 'login-error' : undefined} /><label htmlFor="password" className="mt-4 block font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Password</label><input id="password" value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="At least 6 characters" className="mt-2 w-full border border-input bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground/70" data-testid="input-password" />{error && <p id="login-error" className="mt-2 text-xs text-destructive" data-testid="text-login-error">{error}</p>}<button type="submit" disabled={submitting} data-testid="button-email-login" className="mt-4 flex w-full items-center justify-center gap-2 bg-primary py-3.5 font-mono text-[10px] uppercase tracking-[.15em] text-primary-foreground disabled:opacity-60">{status || (mode === 'signin' ? 'Sign in' : 'Create account')} <ArrowUpRight size={14} /></button></form><div className="mt-5 text-center"><button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setStatus(''); }} data-testid="button-toggle-mode" className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground hover:text-primary">{mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}</button></div>{status && <p className="mt-4 border-l-2 border-primary px-3 py-2 text-xs leading-5 text-muted-foreground" data-testid="status-login">{status}</p>}<p className="mt-7 text-center text-[11px] leading-5 text-muted-foreground">Your account is secured by Supabase. <Link href="/cookies" data-testid="link-login-cookies" className="text-primary hover:underline">Read the policy</Link></p></div></main></div>;
}

function Dashboard() {
  const [, setLocation] = useLocation();
  const { session, loading } = useAuth();
  const [active, setActive] = useState<DistrictKey[]>(['signal', 'workshop', 'commons']);
  useEffect(() => { if (!loading && !session) setLocation('/login'); try { const prefs = JSON.parse(localStorage.getItem('urbanova-demo-preferences') || 'null'); if (prefs?.active) setActive(prefs.active); } catch { /* safe fallback */ } }, [session, loading, setLocation]);
  if (loading || !session) return <div className="grid min-h-[100dvh] place-items-center"><div className="h-5 w-36 animate-pulse bg-muted" /></div>;
  const email = session.user.email || 'City builder';
  const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) || 'City builder';
  const logout = async () => { await supabase.auth.signOut(); setLocation('/'); };
  return <div className="noise min-h-[100dvh]"><SiteHeader /><main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 md:py-12"><div className="flex flex-col justify-between gap-5 border-b border-border pb-8 sm:flex-row sm:items-end"><div><SectionLabel>Private view / authenticated session</SectionLabel><h1 className="font-display text-4xl font-bold tracking-[-.05em] sm:text-5xl">Good evening, {name.split(' ')[0]}.</h1><p className="mt-3 text-sm text-muted-foreground">Your city is healthy. Here is what changed since your last visit.</p></div><button type="button" onClick={logout} data-testid="button-logout" className="flex items-center gap-2 self-start border border-border px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground hover:border-destructive hover:text-destructive sm:self-auto"><LogOut size={14} />Log out</button></div><div className="mt-7 grid gap-5 lg:grid-cols-[1.35fr_.65fr]"><section className="border border-border bg-card/60 p-4 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">City health</div><div className="mt-1 flex items-baseline gap-2"><span className="font-display text-4xl font-semibold text-primary">86.4</span><span className="font-mono text-[10px] text-muted-foreground">/ 100</span></div></div><div className="border border-secondary/50 px-3 py-2 font-mono text-[9px] uppercase tracking-[.14em] text-secondary">+4.2 this week</div></div><div className="h-2 bg-muted"><div className="h-full w-[86.4%] bg-primary" /></div><div className="mt-4 flex justify-between font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground"><span>quiet</span><span>active</span><span>thriving</span></div><div className="mt-6 h-[280px] sm:h-[360px]"><CityMap active={active} /></div></section><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1"><Metric icon={<Building2 size={17} />} label="Active districts" value={`${active.length} / 4`} detail="One district is waiting for a signal" /><Metric icon={<Network size={17} />} label="Public connections" value="214" detail="Across 6 connected sources" /><Metric icon={<Eye size={17} />} label="City visitors" value="1,284" detail="Up 18.6% in the last 30 days" /></div></div><div className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><section className="border border-border bg-card/60 p-5 sm:p-6"><div className="flex items-center justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Your districts</div><h2 className="mt-1 font-display text-2xl font-semibold">The city, by layer</h2></div><Link href="/demo" data-testid="link-dashboard-demo" className="font-mono text-[9px] uppercase tracking-[.12em] text-primary hover:underline">Tune model</Link></div><div className="mt-5 space-y-1">{(Object.keys(districtData) as DistrictKey[]).map((key) => <div key={key} className="flex items-center justify-between border-t border-border/60 py-4"><div className="flex items-center gap-3"><span className="size-2" style={{ background: districtData[key].color }} /><div><div className="font-display text-sm">{districtData[key].name}</div><div className="font-mono text-[9px] uppercase tracking-[.1em] text-muted-foreground">{active.includes(key) ? 'active layer' : 'quiet layer'}</div></div></div><span className="font-mono text-[10px] text-muted-foreground">{districtData[key].stat.split(' ')[0]}</span></div>)}</div></section><section className="border border-border bg-card/60 p-5 sm:p-6"><div className="flex items-center justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Latest activity</div><h2 className="mt-1 font-display text-2xl font-semibold">Signals in the city</h2></div><Activity size={17} className="text-primary" /></div><div className="mt-5">{seedActivity.map((item, index) => <div key={item.title} className="flex gap-4 border-t border-border/60 py-4"><span className="mt-1.5 size-2 shrink-0" style={{ background: item.color }} /><div className="min-w-0"><div className="font-mono text-[9px] uppercase tracking-[.16em]" style={{ color: item.color }}>{item.source}</div><div className="mt-1 text-sm text-foreground">{item.title}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[.1em] text-muted-foreground">{item.date}</div></div>{index === 0 && <span className="ml-auto mt-1 whitespace-nowrap font-mono text-[9px] uppercase text-primary">new</span>}</div>)}</div></section></div></main></div>;
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) { return <div className="border border-border bg-card/60 p-5"><div className="flex items-center gap-2 text-secondary">{icon}<span className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">{label}</span></div><div className="mt-5 font-display text-3xl font-semibold">{value}</div><p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p></div>; }

function About() {
  return <div className="noise"><SiteHeader /><main><section className="mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 md:pb-24 md:pt-24"><SectionLabel>A small studio building a new map</SectionLabel><h1 className="max-w-5xl font-display text-[clamp(3.4rem,9vw,8rem)] font-bold leading-[.88] tracking-[-.08em]">Cities are not made of <span className="text-primary">buildings.</span></h1><div className="mt-10 grid gap-8 md:grid-cols-[1fr_1fr] md:pl-[25%]"><p className="text-xl leading-8 text-foreground">They are made of the relationships between them. URBANOVA is an independent studio exploring what happens when a builder's public work is given a spatial language.</p><p className="leading-7 text-muted-foreground">We started with a simple observation: a developer's work is everywhere, but rarely together. A repository here. A note there. A conversation somewhere else. We wanted a surface that could hold the whole practice without reducing it to a score.</p></div></section><section className="border-y border-border/60 bg-[#101323]"><div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-[.7fr_1.3fr] md:py-24"><div><SectionLabel>Our principles</SectionLabel><h2 className="font-display text-3xl font-semibold tracking-[-.04em]">Civic by default.</h2></div><div className="grid gap-8 sm:grid-cols-2">{[['01', 'Public work deserves context', 'Activity is not a feed of disconnected moments. It has shape, rhythm, and neighborhoods.'], ['02', 'Metrics should make room', 'We use measurement as a way to notice, not a way to rank. A quiet district is still part of the city.'], ['03', 'Tools should feel inhabitable', 'The command center is designed for returning to, not checking off. It should become familiar.'], ['04', 'The map stays yours', 'Your data, your pace, your choices. URBANOVA is a lens, never an owner.']].map(([num, title, text]) => <div key={num} className="border-t border-border pt-4"><span className="font-mono text-[10px] text-primary">{num}</span><h3 className="mt-8 font-display text-xl font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div></div></section><section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24"><div className="flex flex-col items-start justify-between gap-8 border-l-2 border-primary pl-6 md:flex-row md:items-end"><div><div className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">A note from the studio</div><p className="mt-4 max-w-2xl font-display text-3xl leading-tight tracking-[-.04em] sm:text-4xl">“The best map is the one that helps you notice where you are, and choose where to go next.”</p></div><Link href="/demo" data-testid="link-about-demo" className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.15em] text-primary hover:underline">Walk the demo <ArrowUpRight size={14} /></Link></div></section></main><Footer /></div>;
}

function HowTo() {
  const steps = [['01', 'Name your builder identity', 'Start with the public name you already use. URBANOVA reads your practice, not a polished persona.'], ['02', 'Connect the places you build', 'Bring in the sources that tell the story: repositories, writing, releases, and the conversations around them.'], ['03', 'Let the districts take shape', 'Your city organizes activity into Signal Quarter, Workshop Row, the Commons, and Archive Heights.'], ['04', 'Read the city, choose a direction', 'Return to your command center to see what is alive, what is quiet, and which layer deserves your attention.']];
  return <div className="noise"><SiteHeader /><main className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-24"><div className="max-w-3xl"><SectionLabel>Field guide / 01</SectionLabel><h1 className="font-display text-5xl font-bold leading-[.92] tracking-[-.06em] sm:text-7xl">How to make a city from the work you already do.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">URBANOVA does not ask you to create another stream. It helps you see the system inside the one you have.</p></div><div className="mt-16 grid gap-x-14 gap-y-12 md:grid-cols-2">{steps.map(([num, title, text]) => <div key={num} className="border-t border-border pt-5"><div className="flex items-start justify-between"><span className="font-mono text-sm text-primary">{num}</span><ChevronRight size={18} className="text-border" /></div><h2 className="mt-12 font-display text-2xl font-semibold">{title}</h2><p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">{text}</p></div>)}</div><div className="mt-20 grid gap-6 border border-border bg-card/50 p-6 sm:p-8 md:grid-cols-[.75fr_1.25fr] md:items-center"><div><div className="font-mono text-[10px] uppercase tracking-[.18em] text-secondary">Reading the map</div><h2 className="mt-3 font-display text-3xl font-semibold">Follow density, not noise.</h2></div><div className="grid gap-4 text-sm leading-6 text-muted-foreground sm:grid-cols-3"><div><span className="mb-2 block h-1 w-10 bg-primary" />Bright edges mean fresh activity.</div><div><span className="mb-2 block h-1 w-10 bg-secondary" />Dense blocks mean sustained building.</div><div><span className="mb-2 block h-1 w-10 bg-accent" />Quiet streets mean room to explore.</div></div></div><div className="mt-12 text-center"><Link href="/demo" data-testid="link-how-to-demo" className="inline-flex items-center gap-2 bg-primary px-5 py-3.5 font-mono text-[10px] uppercase tracking-[.15em] text-primary-foreground">Try the interactive city <ArrowUpRight size={14} /></Link></div></main><Footer /></div>;
}

function Roadmap() {
  const months = [['AUG 2026', 'Foundations', 'Landing page live at urbanova.app with pastel gradient branding, interactive 3D city demo, GitHub public signal integration, listing on Orynth.dev, Mint NFT City Urbanova, and the first readable city health model.', true], ['SEP 2026', 'Districts & Ownership', 'Four districts online with deeper source connections, on-chain city ownership via wallet login, NFT-gated district customization, and multi-source activity feeds beyond GitHub.', false], ['OCT 2026', 'Wayfinding & API', 'Cross-district navigation with stronger links between signals and their sources, plus a builder API for reading and embedding city data programmatically.', false], ['NOV 2026', 'Civic Layer & Mobile', 'Shared spaces for builders to leave context, notes, and invitations, a marketplace for trading city NFTs, and mobile app beta for App Store and Google Play.', false], ['DEC 2026', 'Night Mode & Reflection', 'A slower, deeper read of your year in public — what stayed lit, what changed shape, annual city health reports, and a mint calendar for the next year.', false]];
  return <div className="noise"><SiteHeader /><main className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-24"><div className="grid gap-10 md:grid-cols-[.8fr_1.2fr]"><div><SectionLabel>Roadmap / 2026</SectionLabel><h1 className="font-display text-5xl font-bold leading-[.9] tracking-[-.06em] sm:text-7xl">Building the city in public.</h1><p className="mt-7 max-w-md leading-7 text-muted-foreground">A monthly view of the places, tools, and rituals we are bringing online next.</p></div><div className="border border-border bg-card/50 p-5 sm:p-8"><div className="mb-4 flex items-center justify-between font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground"><span>Progress map</span><span>1 of 5 live</span></div><div className="h-1 bg-muted"><div className="h-full w-1/5 bg-primary" /></div><div className="mt-8 space-y-0">{months.map(([month, title, text, complete], i) => <div key={month as string} className="relative grid grid-cols-[76px_18px_1fr] gap-4 pb-9 last:pb-0"><div className={`pt-1 font-mono text-[10px] tracking-[.08em] ${complete ? 'text-primary' : 'text-muted-foreground'}`}>{month as string}</div><div className="relative flex justify-center"><span className={`z-10 mt-1.5 size-3 border-2 ${complete ? 'border-primary bg-primary' : 'border-muted-foreground/50 bg-card'}`} />{i < months.length - 1 && <span className={`absolute top-4 h-full w-px ${complete ? 'bg-primary/60' : 'bg-border'}`} />}</div><div><h2 className="font-display text-xl font-semibold">{title as string}</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{text as string}</p><span className={`mt-3 inline-block font-mono text-[9px] uppercase tracking-[.15em] ${complete ? 'text-secondary' : 'text-muted-foreground'}`}>{complete ? 'shipped' : 'in the works'}</span></div></div>)}</div></div></div><section className="mt-16 grid gap-5 sm:grid-cols-2"><div className="border border-primary/50 bg-primary/5 p-6"><Terminal size={20} className="text-primary" /><h2 className="mt-10 font-display text-2xl font-semibold">The roadmap is a conversation.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">We build in the open and adjust when the city tells us something we did not expect.</p></div><div className="border border-border bg-card/50 p-6"><CircleHelp size={20} className="text-secondary" /><h2 className="mt-10 font-display text-2xl font-semibold">Have a useful signal?</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">The best next district usually starts as a precise question from someone using the map.</p></div></section></main><Footer /></div>;
}

function Cookies() {
  const [analytics, setAnalytics] = useState(() => localStorage.getItem('urbanova-analytics') !== 'off');
  const save = (value: boolean) => { setAnalytics(value); localStorage.setItem('urbanova-analytics', value ? 'on' : 'off'); };
  return <div className="noise"><SiteHeader /><main className="mx-auto max-w-4xl px-5 py-14 sm:px-8 md:py-24"><SectionLabel>Cookies and local storage</SectionLabel><h1 className="font-display text-5xl font-bold tracking-[-.06em] sm:text-7xl">A small, clear footprint.</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">This frontend preview keeps only what it needs to make the experience work. We do not sell your data, and there is no hidden advertising layer.</p><section className="mt-14 space-y-4"><PolicyRow title="Demo session" text="Your email or connected wallet address is stored locally so the command center can recognize you. It never leaves this browser in the frontend preview." /><PolicyRow title="Demo preferences" text="The builder identity, active districts, and selected district you save in the demo are stored locally to make your next visit feel continuous." /><PolicyRow title="Analytics preference" text="Your choice below is stored locally. The preview does not send analytics events to a third party." /></section><div className="mt-10 border border-border bg-card/60 p-5 sm:p-6"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><h2 className="font-display text-xl font-semibold">Optional analytics preference</h2><p className="mt-1 text-sm text-muted-foreground">Allow anonymous product signals in a future production version.</p></div><button type="button" onClick={() => save(!analytics)} aria-pressed={analytics} data-testid="button-toggle-analytics" className={`flex items-center gap-3 border px-4 py-3 font-mono text-[10px] uppercase tracking-[.14em] ${analytics ? 'border-secondary text-secondary' : 'border-border text-muted-foreground'}`}><span className={`size-2 ${analytics ? 'bg-secondary' : 'bg-muted-foreground'}`} />{analytics ? 'Allowed' : 'Off'}</button></div></div><div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={() => { localStorage.removeItem('urbanova-demo-preferences'); save(false); }} data-testid="button-clear-local-data" className="border border-destructive/60 px-4 py-3 font-mono text-[10px] uppercase tracking-[.14em] text-destructive hover:bg-destructive/10">Clear local demo data</button><Link href="/login" data-testid="link-cookies-login" className="flex items-center gap-2 border border-border px-4 py-3 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground hover:border-primary hover:text-primary">Enter the preview <ArrowUpRight size={14} /></Link></div></main><Footer /></div>;
}

function PolicyRow({ title, text }: { title: string; text: string }) { return <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-[180px_1fr]"><h2 className="font-display text-lg font-semibold">{title}</h2><p className="text-sm leading-7 text-muted-foreground">{text}</p></div>; }

function LegalCenter() {
  const documents = [
    { href: '/privacy', label: 'Privacy policy', eyebrow: 'How information is handled', text: 'A plain-language view of what the preview stores, what it reads from public sources, and what stays in your browser.', icon: <LockKeyhole size={18} /> },
    { href: '/terms', label: 'Terms of use', eyebrow: 'The agreement for using URBANOVA', text: 'The boundaries for using the preview, connecting public profiles, and participating in the city as it grows.', icon: <Scale size={18} /> },
    { href: '/cookies', label: 'Cookies & local storage', eyebrow: 'Your browser footprint', text: 'Control optional analytics preferences and clear local preview data from this browser at any time.', icon: <Cookie size={18} /> },
  ];
  return <div className="noise"><SiteHeader /><main className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-24"><div className="max-w-3xl"><SectionLabel>Legal center / 2026</SectionLabel><h1 className="font-display text-5xl font-bold leading-[.9] tracking-[-.06em] sm:text-7xl">Clear ground for a <span className="text-primary">living city.</span></h1><p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">The short version: URBANOVA is a public preview built to make public work easier to read. These documents explain the small amount of information the preview uses and the rules that keep the map useful.</p></div><div className="mt-14 grid gap-4 md:grid-cols-3">{documents.map((document) => <Link key={document.href} href={document.href} data-testid={`link-legal-${document.href.slice(1)}`} className="group flex min-h-[250px] flex-col border border-border bg-card/60 p-5 transition-colors hover:border-primary/70"><div className="grid size-10 place-items-center border border-primary/50 bg-primary/10 text-primary transition-transform group-hover:rotate-6">{document.icon}</div><div className="mt-10 font-mono text-[9px] uppercase tracking-[.16em] text-secondary">{document.eyebrow}</div><h2 className="mt-2 font-display text-2xl font-semibold">{document.label}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{document.text}</p><span className="mt-auto pt-6 font-mono text-[10px] uppercase tracking-[.14em] text-primary">Read document <ArrowUpRight size={13} className="ml-1 inline" /></span></Link>)}</div><div className="mt-12 grid gap-5 border border-primary/40 bg-primary/5 p-5 sm:p-7 md:grid-cols-[.7fr_1.3fr] md:items-center"><div className="flex items-center gap-3"><FileText size={20} className="text-primary" /><h2 className="font-display text-2xl font-semibold">A preview, honestly labeled.</h2></div><p className="text-sm leading-7 text-muted-foreground">This version of URBANOVA stores demo sessions and preferences locally in your browser. If a production version introduces accounts, integrations, or analytics, these documents will be updated before those features go live.</p></div><p className="mt-7 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Last reviewed · August 2026</p></main><Footer /></div>;
}

function Privacy() {
  return <div className="noise"><SiteHeader /><main className="mx-auto max-w-4xl px-5 py-14 sm:px-8 md:py-24"><SectionLabel>Legal center / Privacy</SectionLabel><h1 className="font-display text-5xl font-bold leading-[.9] tracking-[-.06em] sm:text-7xl">Your map should not <span className="text-primary">map you.</span></h1><p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">This policy describes the current URBANOVA public preview. It is intentionally scoped to what exists today, rather than promising features that are not live.</p><section className="mt-14 space-y-7"><PolicyRow title="What you enter" text="An email address used to enter the preview, plus the name derived from it, is stored in this browser so the local command center can recognize you. Wallet addresses are stored locally when you choose a wallet connection." /><PolicyRow title="Public GitHub data" text="The demo can read a public GitHub profile when you request it. It uses the public profile response to shape the visual preview and does not ask for a GitHub password or private repository access." /><PolicyRow title="Where it goes" text="In this preview, session, city preferences, and analytics preference remain in local browser storage. They are not sent to a URBANOVA backend. Public GitHub requests go directly to GitHub from your browser." /><PolicyRow title="Your choices" text="You can clear local demo data from the Cookies page or remove this site's stored data through your browser settings. Optional analytics is off when you choose it and is not sent by this preview." /><PolicyRow title="Future changes" text="If URBANOVA adds accounts, connected services, or analytics, this policy will be updated before those changes are used. The Legal Center will always link to the current version." /></section><div className="mt-10 flex flex-wrap gap-3"><Link href="/cookies" data-testid="link-privacy-cookies" className="flex items-center gap-2 bg-primary px-4 py-3 font-mono text-[10px] uppercase tracking-[.14em] text-primary-foreground">Manage local data <ArrowUpRight size={14} /></Link><Link href="/legal" data-testid="link-privacy-legal" className="flex items-center gap-2 border border-border px-4 py-3 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground hover:border-primary hover:text-primary">Back to Legal Center</Link></div></main><Footer /></div>;
}

function Terms() {
  return <div className="noise"><SiteHeader /><main className="mx-auto max-w-4xl px-5 py-14 sm:px-8 md:py-24"><SectionLabel>Legal center / Terms</SectionLabel><h1 className="font-display text-5xl font-bold leading-[.9] tracking-[-.06em] sm:text-7xl">Keep the city <span className="text-primary">constructive.</span></h1><p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">By using the current URBANOVA public preview, you agree to use it respectfully and understand that it is an experimental product surface.</p><section className="mt-14 space-y-7"><PolicyRow title="Use the preview responsibly" text="Do not use URBANOVA to abuse, harass, impersonate, scrape at unreasonable volume, or interfere with the service or other people's access to it." /><PolicyRow title="Public sources stay public" text="When you load a public GitHub profile, you confirm that you have the right to request and display that public information. URBANOVA does not grant access to private repositories or accounts." /><PolicyRow title="Experimental service" text="The preview is provided as-is while the product is being developed. Data, features, availability, and visual interpretations may change as the city learns." /><PolicyRow title="Your content and choices" text="You keep ownership of work you connect or reference. You are responsible for the information you choose to enter and for reviewing the public visibility of anything you connect." /><PolicyRow title="Questions and updates" text="If a production service introduces new obligations, the Terms will be revised and linked from the Legal Center before the new experience is used." /></section><div className="mt-10 flex flex-wrap gap-3"><Link href="/legal" data-testid="link-terms-legal" className="flex items-center gap-2 border border-border px-4 py-3 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground hover:border-primary hover:text-primary">Back to Legal Center</Link><Link href="/privacy" data-testid="link-terms-privacy" className="flex items-center gap-2 border border-border px-4 py-3 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground hover:border-primary hover:text-primary">Read Privacy <ArrowUpRight size={14} /></Link></div></main><Footer /></div>;
}

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/demo" component={Urbanova3D} /><Route path="/login" component={Login} /><Route path="/dashboard" component={Dashboard} /><Route path="/about" component={About} /><Route path="/how-to" component={HowTo} /><Route path="/legal" component={LegalCenter} /><Route path="/privacy" component={Privacy} /><Route path="/terms" component={Terms} /><Route path="/cookies" component={Cookies} /><Route path="/roadmap" component={Roadmap} /><Route component={NotFound} /></Switch>;
}

function App() {
  return <QueryClientProvider client={queryClient}><AuthProvider><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Seo /><Router /></WouterRouter><Toaster /></TooltipProvider></AuthProvider></QueryClientProvider>;
}

export default App;