from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field


class OutOfBlocksError(RuntimeError):
    """Raised when no physical KV blocks remain on GPU memory."""


@dataclass
class BlockTable:
    """Logical-to-physical mapping for one active request."""

    mapping: dict[int, int] = field(default_factory=dict)
    filled_count: dict[int, int] = field(default_factory=dict)
    total_tokens: int = 0


class PagedKVBlockManager:
    """Simplified vLLM-like KV cache manager using paged block allocation."""

    def __init__(self, num_gpu_blocks: int, block_size: int = 16):
        if num_gpu_blocks <= 0:
            raise ValueError("num_gpu_blocks must be > 0")
        if block_size <= 0:
            raise ValueError("block_size must be > 0")

        self.block_size = block_size
        self.free_blocks: deque[int] = deque(range(num_gpu_blocks))
        self.active_requests: dict[str, BlockTable] = {}
        self._physical_ref_count: dict[int, int] = {}

    def _acquire_block(self) -> int:
        if not self.free_blocks:
            raise OutOfBlocksError("No free GPU KV blocks available")
        block_id = self.free_blocks.popleft()
        self._physical_ref_count[block_id] = 0
        return block_id

    def _retain(self, block_id: int) -> None:
        self._physical_ref_count[block_id] = self._physical_ref_count.get(block_id, 0) + 1

    def _release(self, block_id: int) -> None:
        ref_count = self._physical_ref_count.get(block_id, 0)
        if ref_count <= 1:
            self._physical_ref_count.pop(block_id, None)
            self.free_blocks.append(block_id)
            return
        self._physical_ref_count[block_id] = ref_count - 1

    def allocate_for_request(self, request_id: str, num_tokens: int) -> list[int]:
        if request_id in self.active_requests:
            raise ValueError(f"request_id already exists: {request_id}")
        if num_tokens < 0:
            raise ValueError("num_tokens must be >= 0")

        table = BlockTable(total_tokens=num_tokens)
        allocated_blocks: list[int] = []

        if num_tokens == 0:
            self.active_requests[request_id] = table
            return allocated_blocks

        num_blocks = (num_tokens + self.block_size - 1) // self.block_size
        for logical_idx in range(num_blocks):
            block_id = self._acquire_block()
            self._retain(block_id)
            allocated_blocks.append(block_id)
            table.mapping[logical_idx] = block_id
            table.filled_count[logical_idx] = min(num_tokens - (logical_idx * self.block_size), self.block_size)

        self.active_requests[request_id] = table
        return allocated_blocks

    def fork_request(self, source_request_id: str, target_request_id: str) -> None:
        if source_request_id not in self.active_requests:
            raise KeyError(f"unknown source request: {source_request_id}")
        if target_request_id in self.active_requests:
            raise ValueError(f"target request already exists: {target_request_id}")

        source = self.active_requests[source_request_id]
        target = BlockTable(
            mapping=source.mapping.copy(),
            filled_count=source.filled_count.copy(),
            total_tokens=source.total_tokens,
        )

        for block_id in target.mapping.values():
            self._retain(block_id)

        self.active_requests[target_request_id] = target

    def append_token(self, request_id: str, token_count: int = 1) -> list[int]:
        if token_count <= 0:
            raise ValueError("token_count must be > 0")
        if request_id not in self.active_requests:
            raise KeyError(f"unknown request: {request_id}")

        new_blocks: list[int] = []
        for _ in range(token_count):
            maybe_new = self._append_one(request_id)
            if maybe_new is not None:
                new_blocks.append(maybe_new)
        return new_blocks

    def _append_one(self, request_id: str) -> int | None:
        table = self.active_requests[request_id]

        if not table.mapping:
            block_id = self._acquire_block()
            self._retain(block_id)
            table.mapping[0] = block_id
            table.filled_count[0] = 1
            table.total_tokens = 1
            return block_id

        last_idx = max(table.mapping)
        block_id = table.mapping[last_idx]
        filled = table.filled_count[last_idx]

        if filled < self.block_size:
            if self._physical_ref_count.get(block_id, 0) > 1:
                replacement = self._acquire_block()
                self._retain(replacement)
                table.mapping[last_idx] = replacement
                self._release(block_id)
            table.filled_count[last_idx] += 1
            table.total_tokens += 1
            return None

        new_block = self._acquire_block()
        self._retain(new_block)
        new_idx = last_idx + 1
        table.mapping[new_idx] = new_block
        table.filled_count[new_idx] = 1
        table.total_tokens += 1
        return new_block

    def release_request(self, request_id: str) -> None:
        table = self.active_requests.pop(request_id, None)
        if table is None:
            return
        for block_id in table.mapping.values():
            self._release(block_id)

    def memory_report(self) -> dict[str, int | float]:
        used_blocks = len(self._physical_ref_count)
        total_blocks = used_blocks + len(self.free_blocks)
        capacity_tokens = used_blocks * self.block_size
        used_tokens = sum(table.total_tokens for table in self.active_requests.values())
        last_block_waste = sum(
            self.block_size - table.filled_count[max(table.filled_count)]
            for table in self.active_requests.values()
            if table.filled_count
        )
        utilization = (used_tokens / capacity_tokens) if capacity_tokens else 0.0

        return {
            "total_blocks": total_blocks,
            "used_blocks": used_blocks,
            "free_blocks": len(self.free_blocks),
            "active_requests": len(self.active_requests),
            "capacity_tokens": capacity_tokens,
            "used_tokens": used_tokens,
            "last_block_waste_tokens": last_block_waste,
            "token_utilization": round(utilization, 4),
        }

    def get_ref_count(self, block_id: int) -> int:
        return self._physical_ref_count.get(block_id, 0)
