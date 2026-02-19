from src.backend.reasoning_profile import select_reasoning_profile


def test_reasoning_profile_uses_low_budget_for_short_arithmetic_prompts() -> None:
    assert select_reasoning_profile("12 + 30 เท่ากับเท่าไร") == (4, 1)


def test_reasoning_profile_uses_higher_budget_for_analysis_prompts() -> None:
    prompt = "ช่วยวิเคราะห์ trade-off ของการขยายระบบ พร้อมเปรียบเทียบ latency และ cost ต่อผู้ใช้"
    assert select_reasoning_profile(prompt) == (7, 3)


def test_reasoning_profile_uses_balanced_budget_for_general_prompts() -> None:
    assert select_reasoning_profile("ช่วยสรุปแผนงาน sprint นี้ให้สั้นและชัดเจน") == (5, 2)
