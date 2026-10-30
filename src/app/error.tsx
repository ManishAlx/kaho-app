'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mx-auto my-10 max-w-md text-center">
      <p className="text-5xl" aria-hidden>⚠️</p>
      <h1 className="mt-2 text-2xl font-black">Something went wrong</h1>
      <p className="muted mt-1">Please try again.</p>
      <button onClick={reset} className="btn btn-primary mt-5">Try again</button>
    </div>
  );
}
