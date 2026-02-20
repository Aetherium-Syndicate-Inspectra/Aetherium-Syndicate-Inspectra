{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-23.11"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.python311
    pkgs.nodejs_20
  ];
  # Sets environment variables in the workspace
  env = {};
  # Search for the extensions you want on https://open-vsx.org/
  extensions = [
    "esbenp.prettier-vscode"
    "ms-python.python"
    "ms-python.black-formatter"
  ];
  # Enable previews and customize configuration
  previews = {
    enable = true;
    previews = {
      # The name of the preview
      web = {
        # The command to run to start the server
        command = ["npm" "run" "dev" "--" "--port" "$PORT" "--host" "0.0.0.0"];
        manager = "web";
        env = {
          PORT = "$PORT";
        };
      };
      backend = {
        command = ["python" "-m" "src.backend.api_server"];
        manager = "process";
        env = {
          PORT = "8000";
        };
      };
    };
  };

  # Workspace lifecycle hooks
  workspace = {
    # Runs when a workspace is first created
    onCreate = {
      npm-install = "npm --prefix frontend install";
    };
    # Runs when the workspace is (re)started
    onStart = {
      # install-backend-deps = "pip install -r requirements.txt";
      # start-backend = "python -m src.backend.api_server &";
      # start-frontend = "npm --prefix frontend run dev";
    };
  };
}
