"""
Smoke tests for the deterministic Python grade engine.
These guard against regressions in the engine's core scoring functions
without requiring AI/model calls.
"""

import pytest
from grade_engine import (
    score_to_grade,
    grade_both_sides,
    grade_game_total,
    calculate_ev,
    peter_rules,
)


def test_score_to_grade_thresholds():
    assert score_to_grade(9.5) == "A+"
    assert score_to_grade(8.5) == "A+"
    assert score_to_grade(8.0) == "A+"
    assert score_to_grade(7.5) == "A"
    assert score_to_grade(6.0) == "B+"
    assert score_to_grade(5.0) == "B-"
    assert score_to_grade(2.5) == "D"
    assert score_to_grade(2.0) == "F"
    assert score_to_grade(-1.0) == "F"


def _sample_game():
    """Minimal NBA-shaped game payload for the engine."""
    return {
        "id": "test-nba-1",
        "sport": "nba",
        "home_team": "Boston Celtics",
        "away_team": "Los Angeles Lakers",
        "home_profile": {
            "off_ranking": 8.5,
            "def_ranking": 7.5,
            "rest": 8.0,
            "home_away": 8.0,
            "form": 7.5,
            "star_player": 8.0,
            "three_pt_rate": 7.5,
        },
        "away_profile": {
            "off_ranking": 7.0,
            "def_ranking": 6.5,
            "rest": 7.0,
            "home_away": 6.0,
            "form": 7.0,
            "star_player": 7.5,
            "three_pt_rate": 7.0,
        },
        "odds": {
            "spread": -4.5,
            "total": 224.5,
            "mlHome": -190,
            "mlAway": 165,
        },
    }


def test_grade_both_sides_returns_shape():
    game = _sample_game()
    result = grade_both_sides(game)
    assert "home" in result
    assert "away" in result
    assert "best" in result
    best = result["best"]
    assert "grade" in best
    assert "score" in best
    assert "pick_team" in best
    assert "confidence" in best
    assert isinstance(best["score"], (int, float))
    assert isinstance(best["confidence"], (int, float))


def test_grade_game_total_returns_shape():
    game = _sample_game()
    result = grade_game_total(game)
    assert "verdict" in result
    assert "score" in result
    assert "confidence" in result


def test_calculate_ev_returns_shape():
    game = _sample_game()
    pick = {"side": "home", "type": "spread", "line": -4.5}
    result = calculate_ev(game, "home", 7.2, pick)
    assert "ev_pct" in result
    assert isinstance(result["ev_pct"], (int, float))


def test_peter_rules_returns_shape():
    game = _sample_game()
    result = peter_rules(game, "home")
    assert isinstance(result, dict)
