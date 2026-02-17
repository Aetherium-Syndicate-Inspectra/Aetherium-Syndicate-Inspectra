import argparse
import asyncio
import os
import time
from dataclasses import dataclass
from typing import List


class MockTachyonCore:
    """Simulated Rust/PyO3 core with a zero-copy pointer-oriented API."""

    def __init__(self) -> None:
        self.memory_buffer = bytearray(1024 * 1024 * 100)  # 100MB shared arena mock
        self.pointer_map: dict[int, int] = {}

    def process_batch_pointers(self, pointers: List[int]) -> int:
        """Simulate Rust batch processing by accepting pointer integers only."""
        return len(pointers)


@dataclass
class EventStats:
    total_msgs: int
    duration: float
    msgs_per_sec: float
    latency_p50_us: float
    latency_p99_us: float


class AetherBusExtreme:
    def __init__(self, batch_size: int = 5000) -> None:
        if batch_size <= 0:
            raise ValueError("batch_size must be > 0")
        self.core = MockTachyonCore()
        self.queue: asyncio.Queue = asyncio.Queue()
        self.batch_size = batch_size
        self.is_running = True
        self.latencies: list[float] = []

    async def producer(self, total_msgs: int) -> None:
        print(f"🔥 Injecting {total_msgs:,} intents into the fabric...")
        dummy_ptr = 0xDEADBEEF

        full_batches, remainder = divmod(total_msgs, self.batch_size)

        for _ in range(full_batches):
            batch = [dummy_ptr] * self.batch_size
            await self.queue.put((time.perf_counter_ns(), batch))
            await asyncio.sleep(0)

        if remainder:
            tail_batch = [dummy_ptr] * remainder
            await self.queue.put((time.perf_counter_ns(), tail_batch))

        await self.queue.put(None)

    async def consumer(self) -> None:
        while self.is_running:
            item = await self.queue.get()
            if item is None:
                self.queue.task_done()
                break

            ts_start, batch = item
            processed_count = self.core.process_batch_pointers(batch)
            if processed_count != len(batch):
                raise RuntimeError("tachyon core returned inconsistent processed_count")

            ts_end = time.perf_counter_ns()
            self.latencies.append((ts_end - ts_start) / 1000.0)
            self.queue.task_done()

    async def run_benchmark(self, duration_sec: int = 5, target_mps: int = 10_000_000) -> EventStats:
        if duration_sec <= 0:
            raise ValueError("duration_sec must be > 0")
        if target_mps <= 0:
            raise ValueError("target_mps must be > 0")

        total_msgs = target_mps * duration_sec
        start_global = time.perf_counter()

        producer_task = asyncio.create_task(self.producer(total_msgs))
        consumer_task = asyncio.create_task(self.consumer())

        await producer_task
        await consumer_task

        total_time = time.perf_counter() - start_global

        if not self.latencies:
            raise RuntimeError("no latency samples were collected")

        # Producer enqueues exactly total_msgs including a possible tail batch.
        total_processed = total_msgs

        self.latencies.sort()
        p50 = self.latencies[int(len(self.latencies) * 0.5)]
        p99 = self.latencies[min(int(len(self.latencies) * 0.99), len(self.latencies) - 1)]

        return EventStats(
            total_msgs=total_processed,
            duration=total_time,
            msgs_per_sec=total_processed / total_time,
            latency_p50_us=p50,
            latency_p99_us=p99,
        )


async def main(duration_sec: int, batch_size: int, target_mps: int) -> None:
    print("=" * 60)
    print("🚀 AETHERBUS EXTREME: STRESS TEST PROTOCOL")
    print("=" * 60)
    print(f"PID: {os.getpid()}")
    print("System: Hybrid Python Asyncio + Mock Rust Core")
    print("-" * 60)

    print("warming up JIT/Cache...", end="", flush=True)
    warmup_bus = AetherBusExtreme(batch_size=batch_size)
    await warmup_bus.run_benchmark(duration_sec=1, target_mps=min(target_mps, 1_000_000))
    print(" Done.")

    bus = AetherBusExtreme(batch_size=batch_size)
    stats = await bus.run_benchmark(duration_sec=duration_sec, target_mps=target_mps)

    print("\n📊 BENCHMARK RESULTS (Zero-Copy Simulation)")
    print("-" * 60)
    print(f"Total Messages Processed : {stats.total_msgs:,}")
    print(f"Total Duration           : {stats.duration:.4f} sec")
    print(f"Throughput (Msg/sec)     : {stats.msgs_per_sec:,.2f} ⚡")
    print("-" * 60)
    print(f"Latency P50 (Median)     : {stats.latency_p50_us:.2f} µs")
    print(f"Latency P99 (Tail)       : {stats.latency_p99_us:.2f} µs")
    print("-" * 60)

    if stats.msgs_per_sec > 5_000_000:
        print("✅ RESULT: TACHYON-READY (High Performance)")
    else:
        print("⚠️ RESULT: SUB-OPTIMAL (Check Batch Size or Overhead)")

    print("=" * 60)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="AetherBus Extreme benchmark suite")
    parser.add_argument("--duration", type=int, default=5, help="Benchmark duration in seconds")
    parser.add_argument("--batch-size", type=int, default=5000, help="Batch size for producer")
    parser.add_argument("--target-mps", type=int, default=10_000_000, help="Target synthetic message rate")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    try:
        import uvloop

        uvloop.install()
        print("Using uvloop: YES")
    except ImportError:
        print("Using uvloop: NO (Standard asyncio)")

    asyncio.run(
        main(
            duration_sec=args.duration,
            batch_size=args.batch_size,
            target_mps=args.target_mps,
        )
    )
