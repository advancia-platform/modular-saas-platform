#!/usr/bin/env python3
"""
Setup script for the security evaluation framework
Validates environment, dependencies, and configuration
"""

import os
import sys
import subprocess
from pathlib import Path

def print_header(text):
    """Print formatted header"""
    print("\n" + "="*80)
    print(f" {text}")
    print("="*80)

def print_status(status, message):
    """Print status message"""
    symbols = {"success": "✓", "error": "✗", "warning": "⚠", "info": "ℹ"}
    print(f"{symbols.get(status, '•')} {message}")

def check_python_version():
    """Check Python version"""
    print_header("Checking Python Version")

    version = sys.version_info
    if version.major >= 3 and version.minor >= 9:
        print_status("success", f"Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print_status("error", f"Python {version.major}.{version.minor}.{version.micro} (requires 3.9+)")
        return False

def check_dependencies():
    """Check if required packages are installed"""
    print_header("Checking Dependencies")

    required_packages = [
        'azure.ai.evaluation',
        'dotenv',
        'requests',
        'jwt',
    ]

    missing = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print_status("success", f"{package} installed")
        except ImportError:
            print_status("error", f"{package} not found")
            missing.append(package)

    if missing:
        print_status("info", "Run: pip install -r requirements.txt")
        return False

    return True

def check_environment():
    """Check environment configuration"""
    print_header("Checking Environment Configuration")

    env_file = Path(__file__).parent / '.env'

    if not env_file.exists():
        print_status("warning", ".env file not found")
        print_status("info", "Copy .env.example to .env and configure")
        return False

    print_status("success", ".env file exists")

    # Check required environment variables
    from dotenv import load_dotenv
    load_dotenv()

    required_vars = {
        'BACKEND_URL': 'Backend API URL',
    }

    optional_vars = {
        'AZURE_OPENAI_ENDPOINT': 'Azure OpenAI endpoint',
        'AZURE_OPENAI_API_KEY': 'Azure OpenAI API key',
        'OPENAI_API_KEY': 'OpenAI API key',
    }

    all_valid = True

    for var, description in required_vars.items():
        if os.getenv(var):
            print_status("success", f"{var} configured")
        else:
            print_status("error", f"{var} not set ({description})")
            all_valid = False

    has_ai_provider = False
    for var, description in optional_vars.items():
        if os.getenv(var):
            print_status("success", f"{var} configured")
            if 'API_KEY' in var:
                has_ai_provider = True

    if not has_ai_provider:
        print_status("warning", "No AI provider configured (Azure OpenAI or OpenAI)")
        print_status("info", "LLM-based evaluators will be skipped")

    return all_valid

def check_test_data():
    """Check test data files"""
    print_header("Checking Test Data")

    data_dir = Path(__file__).parent / 'data'

    required_files = [
        'password_test_cases.jsonl',
        'auth_test_cases.jsonl',
        'rate_limit_test_cases.jsonl',
        'security_scenarios.jsonl',
    ]

    all_exist = True

    for filename in required_files:
        filepath = data_dir / filename
        if filepath.exists():
            # Count lines
            with open(filepath, 'r') as f:
                lines = sum(1 for line in f if line.strip())
            print_status("success", f"{filename} ({lines} test cases)")
        else:
            print_status("error", f"{filename} not found")
            all_exist = False

    return all_exist

def check_backend():
    """Check backend availability"""
    print_header("Checking Backend Availability")

    from dotenv import load_dotenv
    import requests

    load_dotenv()
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:4000')

    try:
        response = requests.get(f"{backend_url}/api/system/health", timeout=5)
        if response.status_code == 200:
            print_status("success", f"Backend online at {backend_url}")
            return True
        else:
            print_status("warning", f"Backend returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print_status("warning", f"Backend not reachable: {e}")
        print_status("info", "Start backend before running evaluations")
        return False

def create_directories():
    """Create required directories"""
    print_header("Creating Directories")

    directories = [
        Path(__file__).parent / 'results',
        Path(__file__).parent / 'data',
        Path(__file__).parent / 'evaluators',
    ]

    for directory in directories:
        directory.mkdir(exist_ok=True)
        print_status("success", f"Directory: {directory.name}")

    return True

def install_dependencies():
    """Install Python dependencies"""
    print_header("Installing Dependencies")

    requirements_file = Path(__file__).parent / 'requirements.txt'

    if not requirements_file.exists():
        print_status("error", "requirements.txt not found")
        return False

    try:
        subprocess.check_call([
            sys.executable, '-m', 'pip', 'install', '-r', str(requirements_file)
        ])
        print_status("success", "Dependencies installed")
        return True
    except subprocess.CalledProcessError as e:
        print_status("error", f"Failed to install dependencies: {e}")
        return False

def main():
    """Main setup function"""
    print_header("Security Evaluation Framework Setup")

    results = {
        'Python Version': check_python_version(),
        'Directories': create_directories(),
    }

    # Offer to install dependencies if needed
    if not check_dependencies():
        print_status("info", "Would you like to install dependencies now? (y/n)")
        response = input("> ").strip().lower()
        if response in ['y', 'yes']:
            results['Dependencies'] = install_dependencies()
            # Re-check after installation
            results['Dependencies'] = check_dependencies()
        else:
            results['Dependencies'] = False
    else:
        results['Dependencies'] = True

    results['Environment'] = check_environment()
    results['Test Data'] = check_test_data()
    results['Backend'] = check_backend()

    # Print summary
    print_header("Setup Summary")

    for check, status in results.items():
        print_status("success" if status else "error", check)

    all_passed = all(results.values())
    backend_optional = results.copy()
    backend_optional.pop('Backend', None)
    ready = all(backend_optional.values())

    print()

    if all_passed:
        print_status("success", "All checks passed! Ready to run evaluations.")
        print_status("info", "Run: python run_evaluation.py")
    elif ready:
        print_status("warning", "Setup complete but backend is not running")
        print_status("info", "Start backend: cd ../backend && npm run dev")
        print_status("info", "Then run: python run_evaluation.py")
    else:
        print_status("error", "Setup incomplete. Please fix the errors above.")
        sys.exit(1)

if __name__ == '__main__':
    main()
