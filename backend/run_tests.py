#!/usr/bin/env python3
"""
Comprehensive test runner script for the backend API tests.

This script provides an easy way to run tests with various configurations
and generates comprehensive coverage reports.
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

def run_command(cmd: list, description: str = "") -> bool:
    """Run a command and return success status."""
    print(f"\n{'='*60}")
    print(f"🔄 {description or ' '.join(cmd)}")
    print(f"{'='*60}")

    try:
        result = subprocess.run(cmd, check=True, capture_output=False)
        print(f"✅ {description or 'Command'} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description or 'Command'} failed with exit code {e.returncode}")
        return False

def install_dependencies():
    """Install test dependencies."""
    print("\n📦 Installing test dependencies...")
    return run_command(
        ["pip", "install", "-r", "requirements-test.txt"],
        "Installing test dependencies"
    )

def run_tests(args):
    """Run tests with specified configuration."""
    cmd = ["pytest"]

    # Add verbosity
    if args.verbose:
        cmd.append("-v")
    elif args.quiet:
        cmd.append("-q")

    # Add coverage settings
    if not args.no_coverage:
        cmd.extend([
            "--cov=src",
            "--cov-report=term-missing",
            "--cov-report=xml:coverage.xml",
            "--cov-report=html:htmlcov"
        ])

        if args.coverage_threshold:
            cmd.append(f"--cov-fail-under={args.coverage_threshold}")

    # Add test selection
    if args.markers:
        cmd.extend(["-m", args.markers])

    if args.keyword:
        cmd.extend(["-k", args.keyword])

    # Add parallel execution
    if args.parallel and not args.no_parallel:
        try:
            import pytest_xdist
            cmd.extend(["-n", str(args.parallel)])
        except ImportError:
            print("⚠️ pytest-xdist not available, running tests sequentially")

    # Add test path
    cmd.append(args.test_path)

    return run_command(cmd, f"Running tests from {args.test_path}")

def run_security_checks():
    """Run security checks."""
    print("\n🔐 Running security checks...")

    # Run bandit for security analysis
    bandit_success = run_command(
        ["bandit", "-r", "src/", "-f", "json", "-o", "bandit-report.json"],
        "Running Bandit security analysis"
    )

    # Run safety check for dependency vulnerabilities
    safety_success = run_command(
        ["safety", "check", "--json", "--output", "safety-report.json"],
        "Running Safety dependency check"
    )

    return bandit_success and safety_success

def run_linting():
    """Run code quality checks."""
    print("\n🧹 Running code quality checks...")

    # Run flake8
    flake8_success = run_command(
        ["flake8", "src/", "tests/"],
        "Running Flake8 linting"
    )

    # Run isort check
    isort_success = run_command(
        ["isort", "--check-only", "--diff", "src/", "tests/"],
        "Running isort import sorting check"
    )

    # Run black check
    black_success = run_command(
        ["black", "--check", "--diff", "src/", "tests/"],
        "Running Black code formatting check"
    )

    return flake8_success and isort_success and black_success

def generate_report(args):
    """Generate and display test report."""
    if not args.no_coverage and os.path.exists("coverage.xml"):
        print("\n📊 Coverage Summary:")
        print("-" * 40)

        # Try to parse coverage percentage
        try:
            with open("coverage.xml", "r") as f:
                content = f.read()
                if 'line-rate=' in content:
                    import re
                    match = re.search(r'line-rate="([0-9.]+)"', content)
                    if match:
                        coverage = float(match.group(1)) * 100
                        print(f"Overall Coverage: {coverage:.1f}%")
        except:
            pass

        print("\n📁 Generated Reports:")
        if os.path.exists("htmlcov/index.html"):
            print("  • HTML Coverage Report: htmlcov/index.html")
        if os.path.exists("coverage.xml"):
            print("  • XML Coverage Report: coverage.xml")
        if os.path.exists("bandit-report.json"):
            print("  • Security Report: bandit-report.json")
        if os.path.exists("safety-report.json"):
            print("  • Dependency Security: safety-report.json")

def main():
    """Main test runner function."""
    parser = argparse.ArgumentParser(
        description="Comprehensive test runner for backend API tests",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""\
Examples:
  python run_tests.py                           # Run all tests with coverage
  python run_tests.py --no-coverage            # Run tests without coverage
  python run_tests.py -m "rbac"                # Run only RBAC tests
  python run_tests.py -k "notification"        # Run tests with 'notification' in name
  python run_tests.py --parallel 4             # Run tests in parallel (4 workers)
  python run_tests.py --install-deps           # Install dependencies and run tests
  python run_tests.py --full-check             # Run tests + security + linting
        """
    )

    # Test configuration
    parser.add_argument("test_path", nargs="?", default="tests/",
                       help="Path to tests (default: tests/)")
    parser.add_argument("-v", "--verbose", action="store_true",
                       help="Verbose output")
    parser.add_argument("-q", "--quiet", action="store_true",
                       help="Quiet output")
    parser.add_argument("-m", "--markers", type=str,
                       help="Run tests matching given mark expression")
    parser.add_argument("-k", "--keyword", type=str,
                       help="Run tests matching given keyword expression")

    # Coverage configuration
    parser.add_argument("--no-coverage", action="store_true",
                       help="Skip coverage reporting")
    parser.add_argument("--coverage-threshold", type=int, default=75,
                       help="Coverage threshold percentage (default: 75)")

    # Parallel execution
    parser.add_argument("--parallel", type=int, default=2,
                       help="Number of parallel workers (default: 2)")
    parser.add_argument("--no-parallel", action="store_true",
                       help="Disable parallel execution")

    # Additional checks
    parser.add_argument("--install-deps", action="store_true",
                       help="Install dependencies before running tests")
    parser.add_argument("--security", action="store_true",
                       help="Run security checks")
    parser.add_argument("--lint", action="store_true",
                       help="Run linting checks")
    parser.add_argument("--full-check", action="store_true",
                       help="Run tests + security + linting")

    args = parser.parse_args()

    # Change to backend directory if needed
    if os.path.basename(os.getcwd()) != "backend":
        backend_path = Path(__file__).parent
        os.chdir(backend_path)

    print("🚀 Advancia Pay Ledger API Test Runner")
    print(f"📂 Working Directory: {os.getcwd()}")
    print(f"🐍 Python Version: {sys.version}")

    success = True

    # Install dependencies if requested
    if args.install_deps:
        if not install_dependencies():
            return 1

    # Run tests
    if not run_tests(args):
        success = False

    # Run additional checks
    if args.security or args.full_check:
        if not run_security_checks():
            success = False

    if args.lint or args.full_check:
        if not run_linting():
            success = False

    # Generate report
    generate_report(args)

    if success:
        print("\n🎉 All checks passed successfully!")
        return 0
    else:
        print("\n💥 Some checks failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
