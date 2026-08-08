import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="noise min-h-[100dvh]">
      <main className="mx-auto flex min-h-[calc(100dvh-1px)] max-w-3xl items-center px-5 py-16 sm:px-8">
        <section className="w-full border border-border bg-card/70 p-7 shadow-[0_25px_80px_rgba(0,0,0,.25)] sm:p-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.2em] text-primary">
                <span className="grid size-9 place-items-center border border-primary/60 bg-primary/10">
                  <Compass size={17} />
                </span>
                Lost district
              </div>
              <h1 className="font-display text-5xl font-bold leading-[.9] tracking-[-.06em] sm:text-7xl">
                This street does not exist.
              </h1>
              <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
                The page you are looking for is outside the current city map. Head back to the center and choose another direction.
              </p>
            </div>
            <span className="hidden font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground sm:block">
              404 / unmapped
            </span>
          </div>
          <Link href="/" className="mt-8 inline-flex items-center gap-2 bg-primary px-5 py-3.5 font-mono text-[10px] uppercase tracking-[.15em] text-primary-foreground transition-transform hover:-translate-y-0.5">
            <ArrowLeft size={14} />
            Return to the city
          </Link>
        </section>
      </main>
    </div>
  );
}
