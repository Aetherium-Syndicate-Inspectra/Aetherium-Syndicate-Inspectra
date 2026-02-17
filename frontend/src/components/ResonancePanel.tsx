export function ResonancePanel({ data }: { data: any }) {
  return <pre className="card text-xs">{JSON.stringify(data, null, 2)}</pre>;
}
