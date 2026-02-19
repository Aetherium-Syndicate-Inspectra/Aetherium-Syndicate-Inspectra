LIGHTWEIGHT_PROMPT_WORDS = 8
COMPLEX_PROMPT_WORDS = 40


def select_reasoning_profile(prompt: str) -> tuple[int, int]:
    """Choose an efficient search profile to balance quality vs. inference cost."""
    words = prompt.split()
    word_count = len(words)

    has_math_signal = any(symbol in prompt for symbol in ("+", "-", "*", "/", "="))
    has_structured_signal = any(token in prompt.lower() for token in ("explain", "analyze", "เปรียบเทียบ", "วิเคราะห์"))

    if word_count <= LIGHTWEIGHT_PROMPT_WORDS and has_math_signal and not has_structured_signal:
        return 4, 1

    if word_count >= COMPLEX_PROMPT_WORDS or has_structured_signal:
        return 7, 3

    return 5, 2
