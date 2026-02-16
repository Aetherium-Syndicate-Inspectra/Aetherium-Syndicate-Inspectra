from __future__ import annotations

import base64
import difflib
import json
import os
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from urllib import error, request

BRANCH_POLICY_RE = re.compile(
    r"^(feature|fix|chore|refactor|docs|test|hotfix)/[a-z0-9]+(?:-[a-z0-9]+)*$"
)
SEMANTIC_COMMIT_RE = re.compile(
    r"^(feat|fix|chore|refactor|docs|test|perf|ci)(\([a-z0-9-]+\))?: .{8,}$"
)


@dataclass
class CreatorSession:
    chat: list[dict[str, str]] = field(default_factory=list)
    code: str = ""


@dataclass
class BuildStudioIntent:
    """Structured intent model for Creator Studio's build workflows."""

    raw_request: str
    architecture_flow: list[str]
    architecture_views: list[str]
    architecture_state: list[str]
    ux_experiments: list[str]
    llm_capabilities: list[str]

    def as_prompt_block(self) -> str:
        return (
            "Build Creator Studio intent (normalized):\n"
            f"- Flow modules: {', '.join(self.architecture_flow) or 'none'}\n"
            f"- View modules: {', '.join(self.architecture_views) or 'none'}\n"
            f"- State modules: {', '.join(self.architecture_state) or 'none'}\n"
            f"- UX experiments: {', '.join(self.ux_experiments) or 'none'}\n"
            f"- LLM capabilities: {', '.join(self.llm_capabilities) or 'none'}"
        )


class CreatorStudioService:
    """Service layer for Creator Studio chat->code generation and GitHub PR shipping."""

    def __init__(self, llm_model: str = "gpt-4o-mini") -> None:
        self.llm_model = llm_model
        self._session = CreatorSession(
            code=(
                "<!doctype html>\n"
                "<html lang=\"th\">\n"
                "<head><meta charset=\"UTF-8\"><title>Creator Preview</title></head>\n"
                "<body>\n"
                "  <h1>Hello Creator Studio</h1>\n"
                "  <p>เริ่มพิมพ์คำสั่งด้านซ้ายเพื่อให้ AI สร้างแอป</p>\n"
                "</body>\n"
                "</html>"
            )
        )

    @property
    def session(self) -> CreatorSession:
        return self._session

    def chat(self, message: str) -> dict[str, str]:
        clean_message = message.strip()
        self._session.chat.append({"role": "user", "content": clean_message})
        structured_intent = self._parse_build_studio_intent(clean_message)

        llm_text, llm_code = self._call_openai(clean_message, structured_intent)
        if not llm_code:
            llm_text, llm_code = self._fallback_generate(clean_message, structured_intent)

        self._session.chat.append({"role": "assistant", "content": llm_text})
        self._session.code = llm_code
        return {"response": llm_text, "code": llm_code}

    def _call_openai(self, message: str, structured_intent: BuildStudioIntent) -> tuple[str, str]:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return "", ""

        try:
            from openai import OpenAI
            import openai
        except ImportError:
            return "", ""

        try:
            client = OpenAI(api_key=api_key)
            prompt = self._build_prompt(message, structured_intent)
            completion = client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are the Creator Studio architecture assistant. "
                            "Return strict JSON with keys: response, code. "
                            "Use clear software-engineering terminology and preserve backward compatibility."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
            )
            payload = json.loads(completion.choices[0].message.content)
            return payload.get("response", ""), payload.get("code", "")
        except (
            openai.APIConnectionError,
            openai.APITimeoutError,
            openai.RateLimitError,
            openai.APIError,
            AttributeError,
            json.JSONDecodeError,
            KeyError,
            TypeError,
            ValueError,
        ):
            return "", ""

    def _build_prompt(self, message: str, structured_intent: BuildStudioIntent) -> str:
        return (
            "Translate user intent into a maintainable Creator Studio implementation.\n"
            f"User message: {message}\n"
            f"{structured_intent.as_prompt_block()}\n"
            f"Current code:\n{self._session.code}\n"
            f"Recent chat: {self._session.chat[-6:]}\n"
            "Requirements:\n"
            "1) Keep existing behavior unless user requested a breaking change.\n"
            "2) Prefer modular structure for flow, views, state, and UX experimentation.\n"
            "3) Output strict JSON only."
        )

    def _fallback_generate(self, message: str, structured_intent: BuildStudioIntent) -> tuple[str, str]:
        current = self._session.code
        lower = message.lower()

        if self._requires_build_studio_blueprint(structured_intent):
            code = self._build_creator_studio_blueprint(current, structured_intent)
            response = (
                "Added a Build Creator Studio architecture blueprint with modular flow, view, state, "
                "and UX experiment primitives."
            )
            return response, code

        if "todo" in lower:
            code = (
                "<!doctype html>\n<html lang=\"th\">\n<head>\n"
                "  <meta charset=\"UTF-8\">\n  <title>Todo by Creator Studio</title>\n"
                "  <style>body{font-family:Arial;padding:20px}button{margin-left:8px}</style>\n"
                "</head>\n<body>\n"
                "  <h2>Todo List</h2>\n"
                "  <input id=\"itemInput\" placeholder=\"เพิ่มงาน\"><button onclick=\"addItem()\">เพิ่ม</button>\n"
                "  <ul id=\"list\"></ul>\n"
                "  <script>\n"
                "    function addItem(){const v=document.getElementById('itemInput').value.trim();if(!v)return;"
                "const li=document.createElement('li');li.textContent=v;document.getElementById('list').appendChild(li);"
                "document.getElementById('itemInput').value='';}\n"
                "  </script>\n"
                "</body>\n</html>"
            )
            return "สร้างเว็บ Todo List ให้พร้อมใช้งานแล้ว สามารถสั่งเพิ่มฟีเจอร์ต่อได้ทันที", code

        if "dark" in lower or "ธีม" in lower:
            code = re.sub(r"<body>", "<body style='background:#111827;color:#e5e7eb;font-family:Arial'>", current)
            return "ปรับธีมเป็นโทนมืดให้แล้ว", code

        stamped = datetime.now(timezone.utc).isoformat()
        code = current + f"\n<!-- Update: {stamped} | {message} -->"
        return "อัปเดตโค้ดตามคำสั่งล่าสุดเรียบร้อย (โหมด local AI fallback)", code

    def _parse_build_studio_intent(self, message: str) -> BuildStudioIntent:
        normalized = message.lower()
        flow_modules = self._collect_keywords(
            normalized,
            {
                "flow orchestration": ["flow", "pipeline", "orchestr", "workflow", "creator studio"],
                "guardrail policies": ["governance", "guardrail", "policy", "contract"],
            },
        )
        view_modules = self._collect_keywords(
            normalized,
            {
                "view registry": ["view", "layout", "dashboard", "screen", "หน้า"],
                "preview sandbox": ["preview", "sandbox", "prototype", "ux"],
            },
        )
        state_modules = self._collect_keywords(
            normalized,
            {
                "state store": ["state", "store", "context", "session"],
                "event timeline": ["event", "history", "replay", "debug"],
            },
        )
        experiments = self._collect_keywords(
            normalized,
            {
                "ab tests": ["a/b", "ab test", "experiment", "ux test", "ทดลอง"],
                "prompt variants": ["prompt", "llm", "model", "reasoning"],
            },
        )
        llm_capabilities = self._collect_keywords(
            normalized,
            {
                "spec-to-plan": ["spec", "plan", "implementation", "sdd"],
                "code synthesis": ["generate", "code", "refactor", "build"],
                "governance checks": ["governance", "contractchecker", "ruleset"],
            },
        )

        return BuildStudioIntent(
            raw_request=message,
            architecture_flow=flow_modules,
            architecture_views=view_modules,
            architecture_state=state_modules,
            ux_experiments=experiments,
            llm_capabilities=llm_capabilities,
        )

    def _collect_keywords(self, normalized: str, dictionary: dict[str, list[str]]) -> list[str]:
        return [term for term, variants in dictionary.items() if any(variant in normalized for variant in variants)]

    def _requires_build_studio_blueprint(self, intent: BuildStudioIntent) -> bool:
        return bool(intent.architecture_flow or intent.architecture_views or intent.architecture_state or intent.ux_experiments)

    def _build_creator_studio_blueprint(self, current_code: str, intent: BuildStudioIntent) -> str:
        modules = {
            "flow": intent.architecture_flow or ["flow orchestration"],
            "views": intent.architecture_views or ["view registry"],
            "state": intent.architecture_state or ["state store"],
            "ux": intent.ux_experiments or ["ab tests"],
        }
        block = (
            "\n<script type=\"application/json\" id=\"build-creator-studio-spec\">\n"
            + json.dumps(
                {
                    "module": "build_creator_studio",
                    "version": "v4.3.1",
                    "intent": intent.raw_request,
                    "architecture": modules,
                    "llm_logic": {
                        "pipeline": ["spec_to_plan", "plan_to_patch", "contract_validation"],
                        "capabilities": intent.llm_capabilities or ["spec-to-plan", "code synthesis"],
                    },
                },
                ensure_ascii=False,
                indent=2,
            )
            + "\n</script>"
        )
        if "build-creator-studio-spec" in current_code:
            return re.sub(
                r"<script type=\"application/json\" id=\"build-creator-studio-spec\">[\s\S]*?</script>",
                block.strip(),
                current_code,
                count=1,
            )
        return f"{current_code}\n{block}"

    def compose_pr_metadata(
        self,
        *,
        previous_code: str,
        current_code: str,
        user_intent: str = "",
        scope_hint: str = "creator-studio",
    ) -> dict[str, Any]:
        previous_lines = previous_code.splitlines()
        current_lines = current_code.splitlines()
        unified = list(
            difflib.unified_diff(
                previous_lines,
                current_lines,
                fromfile="previous",
                tofile="current",
                lineterm="",
            )
        )
        added_lines = sum(1 for line in unified if line.startswith("+") and not line.startswith("+++"))
        removed_lines = sum(1 for line in unified if line.startswith("-") and not line.startswith("---"))
        changed_files = 1 if previous_code != current_code else 0

        if added_lines > removed_lines and added_lines > 8:
            commit_type = "feat"
        elif removed_lines > added_lines:
            commit_type = "refactor"
        else:
            commit_type = "chore"

        scope = re.sub(r"[^a-z0-9-]", "-", scope_hint.lower()).strip("-") or "creator"
        summary = self._derive_change_summary(unified, user_intent)
        commit_message = f"{commit_type}({scope}): {summary}"
        pr_title = commit_message
        pr_body = (
            "## Summary\n"
            f"- Updated generated application flow via Creator Studio\n"
            f"- Diff stats: +{added_lines} / -{removed_lines} lines\n"
            f"- Intent: {user_intent or 'editor-driven update'}\n\n"
            "## Diff Preview\n"
            "```diff\n"
            + "\n".join(unified[:120])
            + "\n```"
        )

        return {
            "commit_message": commit_message,
            "pr_title": pr_title,
            "pr_body": pr_body,
            "diff_preview": "\n".join(unified[:120]),
            "diff_stats": {
                "added_lines": added_lines,
                "removed_lines": removed_lines,
                "changed_files": changed_files,
            },
        }

    def _derive_change_summary(self, unified_diff: list[str], user_intent: str) -> str:
        if user_intent:
            text = user_intent.strip().lower()
            sanitized = re.sub(r"\s+", " ", text)
            return sanitized[:72]

        for line in unified_diff:
            if line.startswith("+") and "<" in line:
                return "update ui and generated code flow"
            if line.startswith("+") and "function" in line.lower():
                return "extend generated logic and helpers"
        return "synchronize generated output"

    def validate_pr_policy(self, *, branch: str, commit_message: str) -> dict[str, Any]:
        errors: list[str] = []
        if not BRANCH_POLICY_RE.fullmatch(branch.strip()):
            errors.append(
                "branch must match '<type>/<kebab-case>' where type is feature|fix|chore|refactor|docs|test|hotfix"
            )

        if not SEMANTIC_COMMIT_RE.fullmatch(commit_message.strip()):
            errors.append(
                "commit message must follow Conventional Commits e.g. 'feat(scope): summary text'"
            )

        return {"ok": not errors, "errors": errors}

    def create_github_pr(
        self,
        repo: str,
        branch: str,
        commit_message: str,
        code: str,
        *,
        filename: str = "app.js",
        base_branch: str | None = None,
        pr_body: str = "Generated by Creator Studio",
        enforce_policy: bool = True,
    ) -> dict[str, str]:
        policy_result = self.validate_pr_policy(branch=branch, commit_message=commit_message)
        if enforce_policy and not policy_result["ok"]:
            return {
                "message": "policy gate rejected request",
                "pr_url": "",
                "policy_errors": "; ".join(policy_result["errors"]),
            }

        token = os.getenv("GITHUB_TOKEN")
        if not token:
            return {
                "message": "dry-run: ไม่พบ GITHUB_TOKEN จึงยังไม่สร้าง PR จริง",
                "pr_url": "",
            }

        owner_repo = repo.strip()
        repo_data = self._github_request("GET", f"/repos/{owner_repo}", token)
        target_base = base_branch or repo_data.get("default_branch", "main")

        base_ref = self._github_request(
            "GET", f"/repos/{owner_repo}/git/ref/heads/{target_base}", token
        )
        base_sha = base_ref["object"]["sha"]

        self._github_request(
            "POST",
            f"/repos/{owner_repo}/git/refs",
            token,
            {"ref": f"refs/heads/{branch}", "sha": base_sha},
        )

        self._github_request(
            "PUT",
            f"/repos/{owner_repo}/contents/{filename}",
            token,
            {
                "message": commit_message,
                "content": base64.b64encode(code.encode("utf-8")).decode("ascii"),
                "branch": branch,
            },
        )

        pr_data = self._github_request(
            "POST",
            f"/repos/{owner_repo}/pulls",
            token,
            {
                "title": commit_message,
                "head": branch,
                "base": target_base,
                "body": pr_body,
            },
        )
        return {"message": "PR created", "pr_url": pr_data.get("html_url", "")}

    def _github_request(
        self,
        method: str,
        path: str,
        token: str,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        url = f"https://api.github.com{path}"
        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        req = request.Request(
            url,
            data=data,
            method=method,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "Content-Type": "application/json",
            },
        )
        try:
            with request.urlopen(req, timeout=30) as resp:
                body = resp.read().decode("utf-8")
                return json.loads(body) if body else {}
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8")
            raise RuntimeError(f"GitHub API error {exc.code}: {detail}") from exc
