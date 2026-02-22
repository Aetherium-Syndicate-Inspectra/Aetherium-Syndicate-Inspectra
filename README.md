# Aetherium-Syndicate-Inspector

This project is a comprehensive monitoring and administration dashboard for the Aetherium system. It provides tools for inspecting system components, managing AI agents, and analyzing system performance.

## Features

*   **Executive Dashboard:** A rich user interface for visualizing system state, including agent grids, event feeds, and governance monitoring.
*   **Resonance Drift Detection:** Implements a system to detect and correct deviations in system behavior, using contextual bandits for optimizing interventions.
*   **High-Performance Core:** Integrates a high-performance "Tachyon Core" written in Rust for critical operations.
*   **Aetherbus Extreme:** A high-throughput, low-latency message bus for inter-component communication.
*   **AI Policy & Economy Simulation:** Includes modules for managing AI agent policies, contracts, and economic interactions within the system.

## Tech Stack

*   **Frontend:** React, TypeScript, Vite, Recharts for charting, Tailwind CSS.
*   **Backend:** Python, with a high-performance core in Rust.
*   **Environment:** The development environment is managed using Nix.

## Getting Started

### Prerequisites

*   [Nix](https://nixos.org/download.html)
*   [Node.js 20](https://nodejs.org/) (managed by Nix)
*   [Python 3.11](https://www.python.org/) (managed by Nix)
*   [Rust](https://www.rust-lang.org/tools/install)

### Installation

1.  **Enter the development environment:**
    The project uses Nix to manage dependencies. Your IDE should automatically configure the environment for you.

2.  **Install frontend dependencies:**
    ```bash
    cd frontend
    npm install
    ```

3.  **Build the Rust core:**
    ```bash
    cd tachyon-core
    cargo build --release
    ```

4.  **Install backend dependencies:**
    *(Note: The Python dependency management method is not explicitly defined. Assuming a `requirements.txt` or similar)*
    ```bash
    # Example: pip install -r requirements.txt
    ```


## Running the Application

1.  **Start the backend server:**
    ```bash
    python src/backend/api_server.py
    ```

2.  **Start the frontend development server:**
    ```bash
    cd frontend
    npm run dev
    ```

The application should now be available in your browser at the address provided by Vite (usually `http://localhost:5173`).

## Running Tests

To run the Python test suite:

```bash
pytest
```
