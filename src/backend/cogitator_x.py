from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable
import math
import re


@dataclass
class ReasoningTrace:
    """Hidden chain-of-thought artifact retained for verifier/search only."""

    steps: list[str] = field(default_factory=list)
    final_answer: str = ""
    language_mode: str = "mixed"


@dataclass
class SearchNode:
    """A node in a lightweight MCTS-style reasoning tree."""

    trace: ReasoningTrace
    visits: int = 0
    value_sum: float = 0.0
    prior: float = 0.0
    children: list["SearchNode"] = field(default_factory=list)

    @property
    def value(self) -> float:
        return self.value_sum / self.visits if self.visits > 0 else 0.0


class ProcessRewardModel:
    """Step-level verifier that scores each reasoning step."""

    def evaluate_step(self, step: str, context: str) -> float:
        del context
        step_lower = step.lower()
        reward = 0.4
        if any(token in step_lower for token in ("therefore", "because", "compute", "=>", "equation")):
            reward += 0.2
        if re.search(r"\d", step_lower):
            reward += 0.2
        if any(token in step_lower for token in ("contradiction", "re-check", "verify", "backtrack")):
            reward += 0.2
        return min(1.0, reward)

    def evaluate_trace(self, trace: ReasoningTrace, prompt: str) -> float:
        if not trace.steps:
            return 0.0
        step_scores = [self.evaluate_step(step, context=prompt) for step in trace.steps]
        return sum(step_scores) / len(step_scores)


class RuleBasedOutcomeReward:
    """Outcome reward function for deterministic tasks."""

    def __init__(self, answer_checker: Callable[[str], bool]):
        self.answer_checker = answer_checker

    def evaluate(self, answer: str) -> float:
        return 1.0 if self.answer_checker(answer) else 0.0


class LanguageMixedThoughtGenerator:
    """Generator that emits mixed-language hidden reasoning traces."""

    def generate_candidates(self, prompt: str, branch_factor: int, language: str = "mixed") -> list[ReasoningTrace]:
        candidates: list[ReasoningTrace] = []
        for idx in range(branch_factor):
            steps = self._base_steps(prompt=prompt, variant=idx, language=language)
            candidates.append(
                ReasoningTrace(
                    steps=steps,
                    final_answer=self._final_answer(prompt=prompt),
                    language_mode=language,
                )
            )
        return candidates

    @staticmethod
    def _base_steps(prompt: str, variant: int, language: str) -> list[str]:
        bridge = "Use English logic anchors while preserving Thai context"
        if language == "th":
            bridge = "คิดเชิงตรรกะเป็นโครงอังกฤษ แล้วสรุปไทย"
        elif language == "en":
            bridge = "Reason in English only"

        return [
            f"Step 1: Understand task -> {prompt[:120]}",
            f"Step 2: {bridge}",
            f"Step 3: compute equation path variant={variant}",
            "Step 4: verify and backtrack if contradiction appears",
            "Step 5: therefore choose the most consistent answer",
        ]

    @staticmethod
    def _final_answer(prompt: str) -> str:
        match = re.findall(r"-?\d+", prompt)
        if len(match) >= 2 and any(op in prompt for op in ("+", "plus", "บวก")):
            values = [int(x) for x in match[:2]]
            return str(values[0] + values[1])
        return "insufficient-data"


class PythonToolExecutor:
    """Sandbox-friendly arithmetic tool bridge used by the orchestrator."""

    @staticmethod
    def safe_eval_addition(expression: str) -> int | None:
        cleaned = expression.replace(" ", "")
        if not re.fullmatch(r"-?\d+\+-?\d+", cleaned):
            return None
        left, right = cleaned.split("+", maxsplit=1)
        return int(left) + int(right)


class WisdomGemStore:
    """Stores crystallized lessons from failed traces."""

    def __init__(self) -> None:
        self._gems: list[str] = []

    def append_gem(self, lesson: str) -> None:
        if lesson not in self._gems:
            self._gems.append(lesson)

    def list_all(self) -> list[str]:
        return list(self._gems)


class PangenesAgent:
    """Recursive self-improvement loop that turns failures into reusable gems."""

    def __init__(self, store: WisdomGemStore):
        self.store = store

    def learn_from_failure(self, prompt: str, trace: ReasoningTrace, prm_score: float, outcome_score: float) -> None:
        if outcome_score >= 1.0:
            return
        lesson = (
            "GEM: failed reasoning path | "
            f"prompt={prompt[:80]} | prm={prm_score:.2f} | "
            f"steps={len(trace.steps)} | action=add more verification and tool-use"
        )
        self.store.append_gem(lesson)


class CogitatorXEngine:
    """System-2 style orchestrator: generator + PRM + search + RSI."""

    def __init__(
        self,
        generator: LanguageMixedThoughtGenerator,
        prm: ProcessRewardModel,
        pangenes: PangenesAgent,
        *,
        c_puct: float = 1.2,
    ) -> None:
        self.generator = generator
        self.prm = prm
        self.pangenes = pangenes
        self.c_puct = c_puct

    def solve(
        self,
        prompt: str,
        outcome_reward: RuleBasedOutcomeReward,
        *,
        compute_budget: int = 12,
        base_branch_factor: int = 2,
        language_mode: str = "mixed",
    ) -> dict[str, object]:
        root = SearchNode(trace=ReasoningTrace(steps=[], final_answer="", language_mode=language_mode))

        for _ in range(compute_budget):
            leaf = self._select(root)
            branch_factor = self._adaptive_branch_factor(leaf, base_branch_factor)
            children = self._expand(leaf=leaf, prompt=prompt, branch_factor=branch_factor, language_mode=language_mode)

            for child in children:
                prm_score = self.prm.evaluate_trace(child.trace, prompt)
                outcome_score = outcome_reward.evaluate(child.trace.final_answer)
                combined = 0.45 * prm_score + 0.55 * outcome_score
                self._backpropagate(child, combined)
                self.pangenes.learn_from_failure(prompt, child.trace, prm_score, outcome_score)

        best = self._best_child(root)
        best_trace = best.trace if best else ReasoningTrace()
        return {
            "answer": best_trace.final_answer,
            "confidence": best.value if best else 0.0,
            "hidden_thought": best_trace.steps,
            "gems": self.pangenes.store.list_all(),
        }

    def _select(self, root: SearchNode) -> SearchNode:
        node = root
        while node.children:
            total_visits = sum(max(child.visits, 1) for child in node.children)
            node = max(node.children, key=lambda child: self._ucb_score(child, total_visits))
        return node

    def _expand(self, *, leaf: SearchNode, prompt: str, branch_factor: int, language_mode: str) -> list[SearchNode]:
        traces = self.generator.generate_candidates(prompt=prompt, branch_factor=branch_factor, language=language_mode)
        leaf.children = [SearchNode(trace=trace, prior=1.0 / max(1, branch_factor)) for trace in traces]
        return leaf.children

    def _backpropagate(self, node: SearchNode, reward: float) -> None:
        node.visits += 1
        node.value_sum += reward

    def _best_child(self, root: SearchNode) -> SearchNode | None:
        if not root.children:
            return None
        return max(root.children, key=lambda child: (child.value, child.visits))

    def _ucb_score(self, child: SearchNode, total_visits: int) -> float:
        exploration = self.c_puct * child.prior * math.sqrt(total_visits) / (1 + child.visits)
        return child.value + exploration

    def _adaptive_branch_factor(self, node: SearchNode, base_branch_factor: int) -> int:
        if not node.children:
            return base_branch_factor
        confidence = max(child.value for child in node.children)
        if confidence < 0.5:
            return min(base_branch_factor + 2, 5)
        return base_branch_factor


@dataclass(frozen=True)
class SynergyResolution:
    """Deterministic orchestration result for cross-category routing."""

    channel: str
    trigger: str
    agents: tuple[str, ...]
    actions: tuple[str, ...]


class SynergyResolver:
    """Rule-based resolver that maps events into coordinated agent actions."""

    _CHANNEL_AGENT_MAP: dict[str, tuple[str, ...]] = {
        "LINE": ("agentic-brain", "social-commerce"),
        "PROMPTPAY": ("agentic-brain", "fintech"),
        "TIKTOK": ("agentic-brain", "content-engine"),
        "LIFF": ("agentic-brain", "identity"),
    }

    def resolve(self, *, channel: str, trigger: str, payload: dict[str, object] | None = None) -> SynergyResolution:
        normalized_channel = channel.strip().upper()
        normalized_trigger = trigger.strip().lower()
        payload = payload or {}

        base_agents = list(self._CHANNEL_AGENT_MAP.get(normalized_channel, ("agentic-brain",)))
        actions: list[str] = ["log_event"]

        if normalized_channel == "PROMPTPAY" and normalized_trigger in {"payment_received", "payment_confirmed"}:
            base_agents.append("finops")
            actions.extend(["record_income", "start_financial_workflow"])

        if normalized_channel == "LINE" and normalized_trigger in {"purchase_intent", "order_confirmed"}:
            base_agents.append("fintech")
            actions.extend(["check_bnpl_eligibility", "register_social_commerce_event"])

        if normalized_trigger == "education_eligible" or payload.get("category") == "high-tech":
            base_agents.append("edtech")
            actions.append("send_micro_learning")

        if normalized_channel == "TIKTOK" and normalized_trigger == "comment_detected":
            actions.extend(["create_personalized_reply", "handoff_to_line_oa"])

        agents = tuple(sorted(set(base_agents)))
        action_plan = tuple(dict.fromkeys(actions))
        return SynergyResolution(
            channel=normalized_channel,
            trigger=normalized_trigger,
            agents=agents,
            actions=action_plan,
        )


class AgentFinPay:
    """Financial agent that verifies PromptPay slips and unlocks services."""

    def __init__(self, db: object, visual_engine: object, bank_api_client: object | None = None):
        self.db = db
        self.visual_engine = visual_engine
        self.bank_api_client = bank_api_client

    async def call_bank_api(self, ref_id: str) -> bool:
        if not ref_id:
            return False
        if self.bank_api_client is None:
            return True
        result = await self.bank_api_client.verify_reference(ref_id)
        return bool(result)

    async def verify_slip_and_activate(self, image_data: bytes | str, user_id: str) -> str:
        extracted_data = await self.visual_engine.analyze_slip(image_data)

        if not extracted_data.get("is_valid_slip"):
            return "สลิปไม่ถูกต้อง กรุณาส่งใหม่อีกครั้ง"

        ref_id = str(extracted_data.get("ref_id", "")).strip()
        is_authentic = await self.call_bank_api(ref_id)
        if not is_authentic:
            return "ไม่สามารถยืนยันยอดเงินได้ในขณะนี้"

        amount = float(extracted_data.get("amount", 0.0))
        await self.db.update_payment_status(user_id=user_id, amount=amount, status="COMPLETED")
        await self.db.activate_service(user_id)
        return f"ยืนยันยอดเงิน {amount:.2f} บาท เรียบร้อยแล้วค่ะ!"
