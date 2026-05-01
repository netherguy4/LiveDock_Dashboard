function seededOsc(ts: number, periodMs: number, seed: number): number {
  const rad = ((ts % periodMs) / periodMs) * Math.PI * 2
  return 0.5 + 0.5 * Math.sin(rad + seed)
}

function noise(ts: number, seed: number, magnitude: number): number {
  const raw = Math.sin(ts * 0.01 + seed) * Math.cos(ts * 0.013 + seed * 1.3)
  return raw * magnitude
}

export function mockCpu(now: number): number {
  return 20 + 60 * seededOsc(now, 60000, 0) + noise(now, 42, 5)
}

export function mockCpuPerCore(now: number, cores: number): number[] {
  return Array.from({ length: cores }, (_, i) =>
    mockCpu(now + i * 7000) + noise(now, i * 100, 3),
  )
}

export function mockMemory(now: number): { mem: number; mem_used: number; mem_total: number } {
  const memTotal = 16 * 1024 * 1024 * 1024
  const pct = 25 + 50 * seededOsc(now, 120000, 17) + noise(now, 33, 5)
  const memUsed = Math.round((pct / 100) * memTotal)
  return { mem: pct, mem_used: memUsed, mem_total: memTotal }
}

export function mockNetworkRxBps(now: number): number {
  const base = 500_000
  return base + seededOsc(now, 30000, 7) * 2_000_000 + noise(now, 55, 300_000)
}

export function mockNetworkTxBps(now: number): number {
  const base = 200_000
  return base + seededOsc(now, 25000, 11) * 1_000_000 + noise(now, 67, 200_000)
}

export function mockDiskBps(now: number): number {
  return 50_000 + seededOsc(now, 45000, 23) * 200_000 + noise(now, 89, 50_000)
}

export function mockLoad(now: number): [number, number, number] {
  const base = seededOsc(now, 90000, 31) * 4
  return [
    base + noise(now, 101, 0.3),
    base + 0.3 + noise(now, 103, 0.4),
    base + 0.6 + noise(now, 107, 0.5),
  ]
}

export function mockRequests(now: number, hours: number) {
  const points: { ts: number; count: number }[] = []
  const bucketMs = 60_000
  const fromTs = now - hours * 3600_000
  for (let t = fromTs; t <= now; t += bucketMs) {
    const hourOfDay = new Date(t).getHours()
    const daytimeFactor = hourOfDay >= 8 && hourOfDay <= 20
      ? 0.3 + 0.7 * Math.sin(((hourOfDay - 8) / 12) * Math.PI)
      : 0.1
    const count = Math.max(0, Math.round(daytimeFactor * 50 + noise(t, 127, 10)))
    points.push({ ts: Math.floor(t / 1000), count })
  }
  return points
}
