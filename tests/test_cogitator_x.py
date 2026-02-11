from src.backend.cogitator_x import (
    CogitatorXEngine,
    LanguageMixedThoughtGenerator,
    PangenesAgent,
    ProcessRewardModel,
    RuleBasedOutcomeReward,
    PythonToolExecutor,
    WisdomGemStore,
)


def test_python_tool_executor_addition_is_safe_and_deterministic() -> None:
    assert PythonToolExecutor.safe_eval_addition("12+30") == 42
    assert PythonToolExecutor.safe_eval_addition("12 + 30") == 42
    assert PythonToolExecutor.safe_eval_addition("12*30") is None


def test_cogitator_x_solves_simple_mixed_language_addition_prompt() -> None:
    generator = LanguageMixedThoughtGenerator()
    prm = ProcessRewardModel()
    gems = WisdomGemStore()
    pangenes = PangenesAgent(gems)
    engine = CogitatorXEngine(generator=generator, prm=prm, pangenes=pangenes)

    outcome = RuleBasedOutcomeReward(answer_checker=lambda a: a == "42")
    result = engine.solve(
        prompt="จงหาผลลัพธ์ 12 + 30 และตอบเป็นภาษาไทย",
        outcome_reward=outcome,
        compute_budget=6,
        base_branch_factor=2,
        language_mode="mixed",
    )

    assert result["answer"] == "42"
    assert isinstance(result["hidden_thought"], list)
    assert result["confidence"] > 0.0


def test_pangenes_crystallizes_gems_when_outcome_fails() -> None:
    generator = LanguageMixedThoughtGenerator()
    prm = ProcessRewardModel()
    gems = WisdomGemStore()
    pangenes = PangenesAgent(gems)
    engine = CogitatorXEngine(generator=generator, prm=prm, pangenes=pangenes)

    outcome = RuleBasedOutcomeReward(answer_checker=lambda _: False)
    result = engine.solve(
        prompt="Compute 7 + 5",
        outcome_reward=outcome,
        compute_budget=3,
        base_branch_factor=2,
        language_mode="en",
    )

    assert result["answer"] == "12"
    assert len(result["gems"]) >= 1
