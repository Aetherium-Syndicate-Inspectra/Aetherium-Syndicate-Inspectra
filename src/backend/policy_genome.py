from __future__ import annotations

import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class PolicyGenomeEngine:
    def __init__(self, *, embed_dim: int = 32, dedup_threshold: float = 0.8):
        self.embed_dim = embed_dim
        self.dedup_threshold = dedup_threshold

    def build_graph(self, policies: list[dict[str, Any]]) -> dict[str, Any]:
        nodes: list[dict[str, Any]] = []
        for item in policies:
            node = self._policy_to_node(item)
            duplicate = self._find_duplicate(nodes, node)
            if duplicate is None:
                nodes.append(node)
                continue
            duplicate["effect_size"] = max(duplicate["effect_size"], node["effect_size"])
            duplicate["industries_robust"] = sorted(set(duplicate["industries_robust"]) | set(node["industries_robust"]))

        edges: list[dict[str, Any]] = []
        for idx, source in enumerate(nodes):
            for target in nodes[idx + 1 :]:
                weight = _cosine(source["embedding"], target["embedding"])
                if abs(weight) < 0.3:
                    continue
                edges.append(
                    {
                        "source": source["id"],
                        "target": target["id"],
                        "type": "complements" if weight >= 0 else "conflicts",
                        "weight": round(weight, 4),
                        "description": "Embedding similarity edge",
                    }
                )

        return {
            "meta": {
                "version": "1.0",
                "last_updated": datetime.now(tz=timezone.utc).date().isoformat(),
                "node_count": len(nodes),
                "edge_count": len(edges),
                "embed_dim": self.embed_dim,
            },
            "nodes": nodes,
            "edges": edges,
        }

    def save_graph(self, graph: dict[str, Any], output_file: str | Path) -> Path:
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(graph, ensure_ascii=False, indent=2), encoding="utf-8")
        return output_path

    def _policy_to_node(self, policy: dict[str, Any]) -> dict[str, Any]:
        principle = policy.get("policy") or policy.get("principle") or "unknown_policy"
        normalized = principle.lower().replace(" ", "_")
        node_id = f"policy_{normalized}"
        effect_size = float(policy.get("effect_size", 0.0))
        outcome = policy.get("outcome") or "unknown_outcome"
        return {
            "id": node_id,
            "principle": principle,
            "kpi_impact": {outcome: effect_size},
            "horizon": policy.get("horizon", "1Y"),
            "industries_robust": policy.get("industries_robust", ["TechSaaS"]),
            "effect_size": effect_size,
            "embedding": self.generate_embedding(principle),
        }

    def _find_duplicate(self, nodes: list[dict[str, Any]], candidate: dict[str, Any]) -> dict[str, Any] | None:
        for node in nodes:
            if _cosine(node["embedding"], candidate["embedding"]) >= self.dedup_threshold:
                return node
        return None

    def generate_embedding(self, text: str) -> list[float]:
        # Deterministic lightweight embedding fallback.
        vec = [0.0] * self.embed_dim
        for token in text.lower().split():
            digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
            bucket = int(digest[:8], 16) % self.embed_dim
            sign = 1.0 if int(digest[8:10], 16) % 2 == 0 else -1.0
            vec[bucket] += sign
        norm = math.sqrt(sum(v * v for v in vec)) or 1.0
        return [round(v / norm, 6) for v in vec]


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a)) or 1.0
    norm_b = math.sqrt(sum(y * y for y in b)) or 1.0
    return dot / (norm_a * norm_b)
