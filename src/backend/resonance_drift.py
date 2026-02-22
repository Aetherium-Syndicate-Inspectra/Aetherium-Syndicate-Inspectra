import numpy as np

def detect_resonance_drift(data_points):
    """
    Detects resonance drift in the system based on a series of data points.

    Args:
        data_points (list): A list of numerical data points representing system metrics.

    Returns:
        dict: A dictionary containing drift detection results.
    """
    if not data_points or len(data_points) < 2:
        return {"drift_detected": False, "reason": "Insufficient data points"}

    # Calculate the mean and standard deviation
    mean = np.mean(data_points)
    std_dev = np.std(data_points)

    # Simple drift detection: check if the last point is an outlier
    last_point = data_points[-1]
    if abs(last_point - mean) > 2 * std_dev:
        return {
            "drift_detected": True,
            "reason": "Significant deviation from the mean",
            "details": {"mean": mean, "std_dev": std_dev, "last_point": last_point}
        }

    return {"drift_detected": False}
