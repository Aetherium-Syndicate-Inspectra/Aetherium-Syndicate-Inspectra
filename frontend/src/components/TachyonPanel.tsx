export function TachyonPanel({ metrics }: { metrics: any }) {
  return <pre className="card text-xs">{JSON.stringify(metrics, null, 2)}</pre>;
}
