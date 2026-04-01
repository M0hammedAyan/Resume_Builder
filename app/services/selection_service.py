from __future__ import annotations

from typing import Sequence

from app.services.embedding_service import cosine_similarity
from app.services.scoring_service import score_event


def _remove_redundancy(scored: list[dict], threshold: float = 0.85) -> tuple[list[dict], set[str]]:
    """Drop semantically redundant events and keep the higher-scoring candidate."""
    selected: list[dict] = []
    redundant_ids: set[str] = set()

    for candidate in sorted(scored, key=lambda item: item["score"]["score"], reverse=True):
        candidate_embedding = [float(value) for value in (candidate["event"].get("embedding") or [])]
        redundant = False
        for kept in selected:
            kept_embedding = [float(value) for value in (kept["event"].get("embedding") or [])]
            if cosine_similarity(candidate_embedding, kept_embedding) > threshold:
                redundant_ids.add(str(candidate["event"]["id"]))
                redundant = True
                break
        if not redundant:
            selected.append(candidate)

    return selected, redundant_ids


def _enforce_diversity(candidates: list[dict], k: int) -> list[dict]:
    """Prefer domain/tool diversity while preserving score order."""
    chosen: list[dict] = []
    seen_domains: set[str] = set()
    seen_tools: set[str] = set()

    for candidate in candidates:
        event = candidate["event"]
        domain = str(event.get("domain", "")).strip()
        tools = {str(tool) for tool in (event.get("tools") or [])}
        diverse = (domain and domain not in seen_domains) or not tools.issubset(seen_tools)

        if diverse:
            chosen.append(candidate)
            if domain:
                seen_domains.add(domain)
            seen_tools.update(tools)
        if len(chosen) >= k:
            break

    if len(chosen) < k:
        chosen_ids = {str(item["event"]["id"]) for item in chosen}
        for candidate in candidates:
            if str(candidate["event"]["id"]) in chosen_ids:
                continue
            chosen.append(candidate)
            if len(chosen) >= k:
                break

    return chosen


def select_events(
    events: list[dict],
    job_embedding: Sequence[float],
    k: int = 5,
    weights: dict[str, float] | None = None,
) -> dict:
    """Run full event selection pipeline and return selected events, scores, and explanations."""
    if not events:
        return {"selected_events": [], "scores": [], "explanations": []}

    scored = []
    for event in events:
        scored.append({"event": event, "score": score_event(event, job_embedding, weights)})

    scored.sort(key=lambda item: item["score"]["score"], reverse=True)
    deduped, redundant_ids = _remove_redundancy(scored, threshold=0.85)
    top = _enforce_diversity(deduped, k=k)

    top_ids = {str(item["event"]["id"]) for item in top}
    explanations: list[dict] = []

    for item in scored:
        event_id = str(item["event"]["id"])
        if event_id in top_ids:
            decision = "included"
            reason = "Included after ranking, redundancy filtering, and diversity constraints"
        elif event_id in redundant_ids:
            decision = "excluded"
            reason = "Excluded due to high semantic overlap with a higher-scoring event"
        else:
            decision = "excluded"
            reason = "Excluded due to top-k cutoff"

        explanations.append(
            {
                "event_id": event_id,
                "decision": decision,
                "reason": reason,
                "score_breakdown": item["score"]["breakdown"],
                "score": item["score"]["score"],
            }
        )

    return {
        "selected_events": [item["event"] for item in top],
        "scores": [
            {
                "event_id": str(item["event"]["id"]),
                "score": item["score"]["score"],
                "breakdown": item["score"]["breakdown"],
            }
            for item in scored
        ],
        "explanations": explanations,
    }
