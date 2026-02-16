from src.backend.creator_studio import CreatorStudioService


def test_chat_generates_todo_code_without_openai(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    service = CreatorStudioService()

    result = service.chat("ช่วยสร้าง todo list")

    assert "Todo List" in result["code"]
    assert "Todo" in result["response"]


def test_chat_dark_theme_mutates_existing_code(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    service = CreatorStudioService()

    service.chat("สร้าง todo")
    result = service.chat("เปลี่ยนเป็น dark theme")

    assert "background:#111827" in result["code"]


def test_compose_pr_metadata_generates_semantic_commit_and_diff():
    service = CreatorStudioService()

    composed = service.compose_pr_metadata(
        previous_code="const a = 1;\n",
        current_code="const a = 1;\nconst b = 2;\n",
        user_intent="เพิ่มตัวแปร b",
        scope_hint="creator-studio",
    )

    assert composed["commit_message"].startswith(("feat(creator-studio):", "chore(creator-studio):"))
    assert composed["diff_stats"]["added_lines"] >= 1
    assert "```diff" in composed["pr_body"]


def test_policy_guard_rejects_invalid_branch_or_commit():
    service = CreatorStudioService()

    bad = service.validate_pr_policy(
        branch="invalid_branch_name",
        commit_message="update code",
    )

    assert bad["ok"] is False
    assert len(bad["errors"]) >= 1


def test_create_github_pr_without_token_returns_dry_run(monkeypatch):
    monkeypatch.delenv("GITHUB_TOKEN", raising=False)
    service = CreatorStudioService()

    result = service.create_github_pr(
        repo="example/repo",
        branch="feature/creator-studio-test",
        commit_message="feat(creator-studio): add test path",
        code="console.log('ok')",
    )

    assert result["pr_url"] == ""
    assert "dry-run" in result["message"]


def test_chat_build_creator_studio_request_generates_structured_blueprint(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    service = CreatorStudioService()

    result = service.chat("Apply this in Build Creator Studio with flow, views, state, and UX experiments")

    assert 'build-creator-studio-spec' in result["code"]
    assert 'flow orchestration' in result["code"]
    assert 'state store' in result["code"]
    assert 'architecture blueprint' in result["response"]


def test_build_prompt_includes_normalized_intent_model():
    service = CreatorStudioService()
    intent = service._parse_build_studio_intent("Need flow and view refactor with LLM governance")

    prompt = service._build_prompt("Need flow and view refactor with LLM governance", intent)

    assert 'Build Creator Studio intent (normalized)' in prompt
    assert 'Flow modules' in prompt
    assert 'governance checks' in prompt
