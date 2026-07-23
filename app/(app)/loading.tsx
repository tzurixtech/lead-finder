export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-6">
      <div className="bg-muted h-8 w-48 animate-pulse rounded" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-muted h-24 animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="bg-muted h-64 animate-pulse rounded-lg" />
    </main>
  );
}
