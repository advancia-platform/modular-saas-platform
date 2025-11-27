"""
Main evaluation runner for security testing.
Orchestrates all evaluators and generates comprehensive reports.
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

# Add evaluators directory to path
sys.path.insert(0, str(Path(__file__).parent / 'evaluators'))

# Load environment variables
load_dotenv()

# Import evaluators
try:
    from password_strength import PasswordStrengthEvaluator
    from auth_flow import AuthFlowEvaluator
    from rate_limiting import RateLimitEvaluator
except ImportError as e:
    print(f"Error importing evaluators: {e}")
    print("Make sure all evaluator modules are created in the evaluators/ directory")
    sys.exit(1)

class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

class SecurityEvaluationRunner:
    """Main runner for security evaluations."""

    def __init__(self, backend_url: str, verbose: bool = False, debug: bool = False):
        self.backend_url = backend_url
        self.verbose = verbose
        self.debug = debug
        self.results: Dict[str, Any] = {
            'overall_score': 0,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'backend_url': backend_url,
            'test_duration_seconds': 0,
            'summary': {
                'total_tests': 0,
                'passed': 0,
                'failed': 0,
                'skipped': 0
            },
            'category_scores': {},
            'issues_found': [],
            'passed_tests': [],
            'failed_tests': []
        }

        # Initialize evaluators
        self.evaluators = {
            'password': PasswordStrengthEvaluator(backend_url, verbose, debug),
            'auth_flow': AuthFlowEvaluator(backend_url, verbose, debug),
            'rate_limiting': RateLimitEvaluator(backend_url, verbose, debug),
        }

    def log(self, message: str, level: str = 'info'):
        """Log message with color coding."""
        if level == 'success':
            print(f"{Colors.GREEN}✓ {message}{Colors.RESET}")
        elif level == 'warning':
            print(f"{Colors.YELLOW}⚠ {message}{Colors.RESET}")
        elif level == 'error':
            print(f"{Colors.RED}✗ {message}{Colors.RESET}")
        elif level == 'info' and self.verbose:
            print(f"{Colors.BLUE}ℹ {message}{Colors.RESET}")

    def run_evaluator(self, name: str, evaluator) -> Dict[str, Any]:
        """Run a single evaluator."""
        self.log(f"Running {name} evaluation...", 'info')

        try:
            start_time = time.time()
            result = evaluator.evaluate()
            duration = time.time() - start_time

            result['duration_seconds'] = round(duration, 2)

            if result.get('score', 0) >= 90:
                self.log(f"{name}: {result['score']}/100 - Excellent", 'success')
            elif result.get('score', 0) >= 70:
                self.log(f"{name}: {result['score']}/100 - Good", 'warning')
            else:
                self.log(f"{name}: {result['score']}/100 - Needs improvement", 'error')

            return result
        except Exception as e:
            self.log(f"Error in {name} evaluation: {e}", 'error')
            if self.debug:
                import traceback
                traceback.print_exc()
            return {
                'score': 0,
                'passed': 0,
                'failed': 0,
                'total': 0,
                'error': str(e),
                'duration_seconds': 0
            }

    def run_all(self, test_filter: Optional[str] = None) -> Dict[str, Any]:
        """Run all evaluations."""
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.BLUE}Security Evaluation Framework{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.RESET}\n")

        start_time = time.time()

        # Filter evaluators if specified
        evaluators_to_run = self.evaluators
        if test_filter:
            if test_filter in self.evaluators:
                evaluators_to_run = {test_filter: self.evaluators[test_filter]}
            else:
                self.log(f"Unknown test: {test_filter}", 'error')
                return self.results

        # Run each evaluator
        for name, evaluator in evaluators_to_run.items():
            result = self.run_evaluator(name, evaluator)

            # Store results
            self.results['category_scores'][name] = {
                'score': result.get('score', 0),
                'passed': result.get('passed', 0),
                'failed': result.get('failed', 0),
                'duration_seconds': result.get('duration_seconds', 0)
            }

            # Aggregate summary
            self.results['summary']['total_tests'] += result.get('total', 0)
            self.results['summary']['passed'] += result.get('passed', 0)
            self.results['summary']['failed'] += result.get('failed', 0)

            # Collect issues
            if 'issues' in result:
                self.results['issues_found'].extend(result['issues'])

            # Collect test names
            if 'passed_tests' in result:
                self.results['passed_tests'].extend(result['passed_tests'])
            if 'failed_tests' in result:
                self.results['failed_tests'].extend(result['failed_tests'])

        # Calculate overall score
        category_count = len(self.results['category_scores'])
        if category_count > 0:
            total_score = sum(cat['score'] for cat in self.results['category_scores'].values())
            self.results['overall_score'] = round(total_score / category_count, 1)

        # Total duration
        self.results['test_duration_seconds'] = round(time.time() - start_time, 2)

        # Print summary
        self.print_summary()

        return self.results

    def print_summary(self):
        """Print evaluation summary."""
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.BLUE}Evaluation Summary{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.RESET}\n")

        score = self.results['overall_score']
        if score >= 90:
            score_color = Colors.GREEN
            rating = "Excellent"
        elif score >= 80:
            score_color = Colors.YELLOW
            rating = "Good"
        elif score >= 70:
            score_color = Colors.YELLOW
            rating = "Fair"
        else:
            score_color = Colors.RED
            rating = "Poor"

        print(f"{Colors.BOLD}Overall Security Score: {score_color}{score}/100 ({rating}){Colors.RESET}\n")

        print(f"Tests Passed: {Colors.GREEN}{self.results['summary']['passed']}{Colors.RESET} / {self.results['summary']['total_tests']}")
        print(f"Tests Failed: {Colors.RED}{self.results['summary']['failed']}{Colors.RESET}")
        print(f"Duration: {self.results['test_duration_seconds']}s\n")

        print("Category Scores:")
        for category, data in self.results['category_scores'].items():
            cat_score = data['score']
            if cat_score >= 90:
                cat_color = Colors.GREEN
            elif cat_score >= 70:
                cat_color = Colors.YELLOW
            else:
                cat_color = Colors.RED

            print(f"  {category:20s}: {cat_color}{cat_score:3.0f}/100{Colors.RESET} ({data['passed']}/{data['passed'] + data['failed']} passed)")

        if self.results['issues_found']:
            print(f"\n{Colors.YELLOW}Issues Found:{Colors.RESET}")
            for issue in self.results['issues_found']:
                severity = issue.get('severity', 'unknown').upper()
                sev_color = Colors.RED if severity == 'HIGH' else Colors.YELLOW if severity == 'MEDIUM' else Colors.BLUE
                print(f"  [{sev_color}{severity}{Colors.RESET}] {issue.get('message', 'Unknown issue')}")

        print()

    def save_results(self, output_path: str, format: str = 'json'):
        """Save results to file."""
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        if format == 'json':
            with open(output_path, 'w') as f:
                json.dump(self.results, f, indent=2)
            self.log(f"Results saved to {output_path}", 'success')
        elif format == 'html':
            html_content = self.generate_html_report()
            with open(output_path, 'w') as f:
                f.write(html_content)
            self.log(f"HTML report saved to {output_path}", 'success')

    def generate_html_report(self) -> str:
        """Generate HTML report."""
        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Security Evaluation Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        h1 {{ color: #333; }}
        .score {{ font-size: 48px; font-weight: bold; }}
        .excellent {{ color: #28a745; }}
        .good {{ color: #ffc107; }}
        .poor {{ color: #dc3545; }}
        table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
        th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
        th {{ background-color: #f2f2f2; }}
        .issue {{ background-color: #fff3cd; padding: 10px; margin: 10px 0; border-left: 4px solid #ffc107; }}
    </style>
</head>
<body>
    <h1>Security Evaluation Report</h1>
    <p><strong>Timestamp:</strong> {self.results['timestamp']}</p>
    <p><strong>Backend URL:</strong> {self.results['backend_url']}</p>
    <p><strong>Duration:</strong> {self.results['test_duration_seconds']}s</p>

    <h2>Overall Score</h2>
    <div class="score {'excellent' if self.results['overall_score'] >= 90 else 'good' if self.results['overall_score'] >= 70 else 'poor'}">
        {self.results['overall_score']}/100
    </div>

    <h2>Category Scores</h2>
    <table>
        <tr><th>Category</th><th>Score</th><th>Passed</th><th>Failed</th></tr>
"""
        for category, data in self.results['category_scores'].items():
            html += f"<tr><td>{category}</td><td>{data['score']}/100</td><td>{data['passed']}</td><td>{data['failed']}</td></tr>\n"

        html += """    </table>

    <h2>Issues Found</h2>
"""
        if self.results['issues_found']:
            for issue in self.results['issues_found']:
                html += f'<div class="issue"><strong>[{issue.get("severity", "UNKNOWN").upper()}]</strong> {issue.get("message", "Unknown issue")}</div>\n'
        else:
            html += "<p>No issues found!</p>"

        html += """
</body>
</html>"""
        return html

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Security Evaluation Framework')
    parser.add_argument('--test', help='Run specific test (password)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    parser.add_argument('--debug', '-d', action='store_true', help='Debug mode')
    parser.add_argument('--report', default='json', choices=['json', 'html'], help='Report format')
    parser.add_argument('--output', default='results/evaluation_report', help='Output file path (without extension)')

    args = parser.parse_args()

    # Get backend URL from environment
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:4000')

    # Create runner
    runner = SecurityEvaluationRunner(backend_url, args.verbose, args.debug)

    # Run evaluations
    results = runner.run_all(args.test)

    # Save results
    output_path = f"{args.output}.{args.report}"
    runner.save_results(output_path, args.report)

    # Exit code based on score
    min_score = int(os.getenv('MIN_SECURITY_SCORE', '80'))
    if results['overall_score'] < min_score:
        print(f"\n{Colors.RED}Security score {results['overall_score']} is below minimum {min_score}{Colors.RESET}")
        sys.exit(1)
    else:
        print(f"\n{Colors.GREEN}Security score {results['overall_score']} meets minimum threshold{Colors.RESET}")
        sys.exit(0)

if __name__ == '__main__':
    main()
