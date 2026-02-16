from src.backend.causal_policy_lab import CausalIntegrityGuard, PolicyProposal


def test_causal_integrity_guard_commits_safe_proposal() -> None:
    guard = CausalIntegrityGuard()
    decision = guard.evaluate(PolicyProposal(actor="agent", action="send_offer", payload={"campaign": "gold"}))

    assert decision.status == "commit"


def test_causal_integrity_guard_rewrites_pdpa_risky_proposal() -> None:
    guard = CausalIntegrityGuard()
    decision = guard.evaluate(
        PolicyProposal(actor="agent", action="segment_users", payload={"field": "national_id", "purpose": "retarget"})
    )

    assert decision.status == "rewrite"
    assert decision.rewritten_action == "request_explicit_consent_before_processing"
