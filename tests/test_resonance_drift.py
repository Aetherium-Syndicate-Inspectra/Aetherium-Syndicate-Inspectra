import pytest
from src.backend.resonance_drift import detect_resonance_drift


def test_drift_detection_positive():
    """Test that drift is detected when a data point is an outlier."""
    # Data with a clear outlier at the end
    data_points = [10, 10.2, 9.8, 10.1, 9.9, 15.0]
    result = detect_resonance_drift(data_points)
    assert result["drift_detected"] is True


def test_drift_detection_negative():
    """Test that no drift is detected in stable data."""
    # Stable data with no outliers
    data_points = [10, 10.2, 9.8, 10.1, 9.9, 10.3]
    result = detect_resonance_drift(data_points)
    assert result["drift_detected"] is False


def test_drift_with_insufficient_data():
    """Test that no drift is detected with insufficient data."""
    # Test with an empty list
    result_empty = detect_resonance_drift([])
    assert result_empty["drift_detected"] is False
    assert result_empty["reason"] == "Insufficient data points"

    # Test with a single data point
    result_single = detect_resonance_drift([10.0])
    assert result_single["drift_detected"] is False
    assert result_single["reason"] == "Insufficient data points"
