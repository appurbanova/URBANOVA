import { ArrowUpRight, ChevronRight, Github, Menu, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 group" data-testid="link-logo">
      <span className="relative grid size-8 place-items-center border border-primary/70 bg-primary/10 transition-transform group-hover:rotate-45">
        <span className="size-2.5 bg-primary" />
        <span className="absolute inset-1.5 border border-primary/30" />
      </span>
      {!compact && <span className="font-display text-[1.05rem] font-bold tracking-[.2em] text-foreground">URBANOVA</span>}
    </Link>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.22em] text-primary">
      <span className="h-px w-8 bg-primary" />
      {children}
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const links: [string, string][] = [['/demo', 'Demo'], ['/mini-games', 'Mini Games'], ['/about', 'About'], ['/how-to', 'How it works'], ['/roadmap', 'Roadmap']];
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
          {links.map(([href, label]) => (
            <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase().replace(/ /g, '-')}`} className={`font-mono text-[10px] uppercase tracking-[.18em] transition-colors hover:text-primary ${location === href ? 'text-primary' : 'text-muted-foreground'}`}>{label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/dashboard" data-testid="link-command-center" className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground transition-colors hover:text-foreground">Command center</Link>
          <Link href="/login" data-testid="link-enter-city" className="flex items-center gap-2 border border-primary bg-primary px-4 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[.15em] text-primary-foreground transition-transform hover:-translate-y-0.5">Enter city <ArrowUpRight size={14} /></Link>
        </div>
        <button type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen(!open)} className="grid size-10 place-items-center border border-border text-foreground md:hidden" data-testid="button-mobile-nav">{open ? <X size={18} /> : <Menu size={18} />}</button>
      </div>
      {open && (
        <nav className="border-t border-border/60 bg-card px-5 py-5 md:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-1">
            {links.concat([['/dashboard', 'Command center']]).map(([href, label]) => (
              <Link onClick={() => setOpen(false)} key={href} href={href} data-testid={`link-mobile-${label.toLowerCase().replace(/ /g, '-')}`} className="flex items-center justify-between border-b border-border/50 py-4 font-mono text-[11px] uppercase tracking-[.16em] text-muted-foreground">{label}<ChevronRight size={15} /></Link>
            ))}
            <Link onClick={() => setOpen(false)} href="/login" data-testid="link-mobile-enter-city" className="mt-4 flex items-center justify-center gap-2 bg-primary py-3 font-mono text-[10px] uppercase tracking-[.15em] text-primary-foreground">Enter city <ArrowUpRight size={14} /></Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-[#0d1020]">
      <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs font-mono text-[10px] leading-5 tracking-[.08em] text-muted-foreground">A living map for the work you put into the world.</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">
          <Link href="/legal" data-testid="link-footer-legal" className="hover:text-primary">Legal center</Link>
          <Link href="/privacy" data-testid="link-footer-privacy" className="hover:text-primary">Privacy</Link>
          <Link href="/terms" data-testid="link-footer-terms" className="hover:text-primary">Terms</Link>
          <Link href="/cookies" data-testid="link-footer-cookies" className="hover:text-primary">Cookies</Link>
          <Link href="/about" data-testid="link-footer-about" className="hover:text-primary">About</Link>
          <a href="https://github.com/appurbanova/URBANOVA" target="_blank" rel="noreferrer" data-testid="link-footer-github" className="flex items-center gap-2 hover:text-primary">Source <Github size={13} /></a>
        </div>
      </div>
    </footer>
  );
}
