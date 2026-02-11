import pytest

from src.backend.paged_kv_cache import OutOfBlocksError, PagedKVBlockManager


def test_allocate_and_append_on_demand_block_growth():
    manager = PagedKVBlockManager(num_gpu_blocks=8, block_size=4)

    allocated = manager.allocate_for_request("req-1", 6)

    assert len(allocated) == 2
    assert manager.active_requests["req-1"].filled_count == {0: 4, 1: 2}

    # append 3 tokens -> fills current block first, then allocates a new block
    new_blocks = manager.append_token("req-1", token_count=3)

    assert len(new_blocks) == 1
    table = manager.active_requests["req-1"]
    assert table.filled_count == {0: 4, 1: 4, 2: 1}


def test_fork_request_and_copy_on_write_for_shared_tail_block():
    manager = PagedKVBlockManager(num_gpu_blocks=10, block_size=4)
    manager.allocate_for_request("req-parent", 5)  # blocks: [4,1]

    parent_table = manager.active_requests["req-parent"]
    parent_last_block = parent_table.mapping[1]

    manager.fork_request("req-parent", "req-child")

    # child append to shared non-full tail should trigger copy-on-write
    manager.append_token("req-child")

    child_table = manager.active_requests["req-child"]
    assert child_table.mapping[1] != parent_last_block
    assert parent_table.mapping[1] == parent_last_block
    assert manager.get_ref_count(parent_last_block) == 1
    assert manager.get_ref_count(child_table.mapping[1]) == 1


def test_release_request_returns_blocks_to_pool():
    manager = PagedKVBlockManager(num_gpu_blocks=6, block_size=4)
    manager.allocate_for_request("req-1", 8)
    used_before = manager.memory_report()["used_blocks"]

    manager.release_request("req-1")

    report = manager.memory_report()
    assert used_before == 2
    assert report["used_blocks"] == 0
    assert report["free_blocks"] == 6


def test_out_of_blocks_raises_error():
    manager = PagedKVBlockManager(num_gpu_blocks=1, block_size=4)
    manager.allocate_for_request("req-1", 4)

    with pytest.raises(OutOfBlocksError):
        manager.append_token("req-1")
