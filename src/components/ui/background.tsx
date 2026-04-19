export function BackgroundGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 opacity-60"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, color-mix(in oklch, var(--muted-foreground) 18%, transparent) 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
    />
  );
}
export function GradientOrbs() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed top-[-10%] left-[-10%] -z-10 h-[420px] w-[420px] rounded-full bg-brand-offer/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed right-[-10%] bottom-[-10%] -z-10 h-[420px] w-[420px] rounded-full bg-brand-request/20 blur-[120px]"
      />
    </>
  );
}
