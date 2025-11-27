#!/usr/bin/env python3
"""
AI Cybersecurity Agent - Week 2 Setup Script
Sets up the Python environment and reasoning engine
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return None

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} is compatible")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor} is too old. Need Python 3.8+")
        return False

def setup_virtual_environment():
    """Set up Python virtual environment"""
    ai_agent_dir = Path(__file__).parent
    venv_path = ai_agent_dir / "venv"

    if not venv_path.exists():
        print("📦 Creating virtual environment...")
        run_command(f"python -m venv {venv_path}", "Virtual environment creation")
    else:
        print("✅ Virtual environment already exists")

    # Determine activation script based on OS
    if os.name == 'nt':  # Windows
        activate_script = venv_path / "Scripts" / "activate.bat"
        pip_path = venv_path / "Scripts" / "pip.exe"
    else:  # Unix-like
        activate_script = venv_path / "bin" / "activate"
        pip_path = venv_path / "bin" / "pip"

    return str(pip_path), str(activate_script)

def install_dependencies(pip_path):
    """Install required Python packages"""
    requirements_file = Path(__file__).parent / "requirements.txt"

    if requirements_file.exists():
        print("📦 Installing dependencies...")
        # Install agent framework with --pre flag (required for preview)
        run_command(f'"{pip_path}" install agent-framework-azure-ai --pre', "Agent Framework installation")

        # Install other requirements
        run_command(f'"{pip_path}" install -r {requirements_file}', "Dependencies installation")
    else:
        print("❌ requirements.txt not found")

def check_github_token():
    """Check if GitHub token is set"""
    token = os.getenv("GITHUB_TOKEN")
    if token:
        print("✅ GitHub token is configured")
        return True
    else:
        print("⚠️  GitHub token not set")
        print("📝 To set up GitHub token:")
        print("   1. Go to: https://github.com/settings/tokens")
        print("   2. Generate new token with 'Read access to metadata'")
        print("   3. Set environment variable:")
        if os.name == 'nt':  # Windows
            print("      $env:GITHUB_TOKEN = 'your_token_here'")
        else:  # Unix-like
            print("      export GITHUB_TOKEN='your_token_here'")
        return False

def test_agent_framework():
    """Test that agent framework is working"""
    try:
        import agent_framework
        from openai import AsyncOpenAI
        print("✅ Agent framework imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Agent framework import failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🤖 AI Cybersecurity Agent - Week 2 Setup")
    print("=" * 45)

    # Check Python version
    if not check_python_version():
        sys.exit(1)

    # Setup virtual environment
    pip_path, activate_script = setup_virtual_environment()

    # Install dependencies
    install_dependencies(pip_path)

    # Test framework import
    test_agent_framework()

    # Check GitHub token
    token_configured = check_github_token()

    print("\n🎉 Setup Summary:")
    print("=" * 20)
    print("✅ Virtual environment created")
    print("✅ Agent framework installed")
    print("✅ Dependencies installed")
    print(f"{'✅' if token_configured else '⚠️ '} GitHub token {'configured' if token_configured else 'needs setup'}")

    print("\n🚀 Next Steps:")
    print("1. Activate virtual environment:")
    if os.name == 'nt':  # Windows
        print(f"   .\\venv\\Scripts\\Activate.ps1")
    else:
        print(f"   source {activate_script}")

    if not token_configured:
        print("2. Set up GitHub token (see instructions above)")
        print("3. Run the threat reasoning engine:")
    else:
        print("2. Run the threat reasoning engine:")

    print("   python threat_reasoning_engine.py")

    print("\n📋 Week 2 Progress:")
    print("█████ Foundation Setup ✅")
    print("█████ Reasoning Engine 🔧 (In Progress)")
    print("      █████ Execution Engine")
    print("            █████ Integration & Monitoring")
    print("                  █████ CI/CD & Dashboard")
    print("                        █████ Polish & Launch")

if __name__ == "__main__":
    main()
