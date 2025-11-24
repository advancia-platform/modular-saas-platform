# Trust & Trustpilot System Evaluation Framework

This evaluation framework assesses the quality, accuracy, and reliability of the Scam Adviser Trust Verification and Trustpilot Integration system.

## Evaluation Objectives

1. **Trust Score Accuracy**: Verify trust score calculation is correct based on SSL, domain age, Trustpilot rating, and social presence
2. **API Response Quality**: Check if trust report API returns complete and accurate data
3. **Invitation Logic**: Validate that only eligible transactions (7+ days old, $10+, completed) receive invitations
4. **Error Handling**: Ensure proper error messages and logging throughout the system
5. **Data Consistency**: Verify Trustpilot reviews sync correctly and match source data

## Test Dataset Structure

### 1. Trust Score Test Cases (`evaluation/data/trust_score_tests.jsonl`)

Each line contains:

```json
{
  "test_id": "trust_001",
  "ssl_valid": true,
  "domain_age_months": 12,
  "trustpilot_rating": 4.5,
  "social_presence": false,
  "expected_score": 82,
  "expected_status": "verified"
}
```

### 2. Invitation Eligibility Tests (`evaluation/data/invitation_tests.jsonl`)

Each line contains:

```json
{
  "test_id": "invite_001",
  "transaction_id": "tx_123",
  "amount": 25.5,
  "status": "completed",
  "days_since_transaction": 8,
  "user_email": "test@example.com",
  "already_invited": false,
  "expected_eligible": true
}
```

### 3. API Response Tests (`evaluation/data/api_tests.jsonl`)

Each line contains:

```json
{
  "test_id": "api_001",
  "endpoint": "/api/trust/report",
  "method": "GET",
  "expected_fields": ["scamAdviserScore", "trustpilotRating", "sslValid", "verifiedBusiness", "status"],
  "expected_status_code": 200
}
```

## Custom Evaluators

### 1. Trust Score Calculation Evaluator (Code-based)

Validates the trust score calculation logic:

```python
class TrustScoreEvaluator:
    def __init__(self):
        pass

    def __call__(self, *, ssl_valid: bool, domain_age_months: int,
                 trustpilot_rating: float, social_presence: bool,
                 expected_score: int, **kwargs):
        # Calculate score using same logic as backend
        score = 0

        # SSL Certificate (20 points)
        if ssl_valid:
            score += 20

        # Domain Age (30 points max, 1 per month)
        score += min(domain_age_months, 30)

        # Trustpilot Rating (40 points max)
        if trustpilot_rating >= 4.0:
            score += 40
        elif trustpilot_rating >= 3.0:
            score += 20
        elif trustpilot_rating >= 2.0:
            score += 10

        # Social Presence (10 points)
        if social_presence:
            score += 10

        # Calculate accuracy
        accuracy = 1.0 if score == expected_score else 0.0
        difference = abs(score - expected_score)

        return {
            "trust_score_accuracy": accuracy,
            "calculated_score": score,
            "expected_score": expected_score,
            "score_difference": difference,
            "within_tolerance": difference <= 2  # Allow 2-point tolerance
        }
```

### 2. Invitation Eligibility Evaluator (Code-based)

Validates invitation logic:

```python
class InvitationEligibilityEvaluator:
    def __init__(self):
        self.MIN_AMOUNT = 10
        self.MIN_DAYS = 7

    def __call__(self, *, amount: float, status: str, days_since_transaction: int,
                 user_email: str, already_invited: bool, expected_eligible: bool, **kwargs):
        # Check eligibility
        is_eligible = (
            amount >= self.MIN_AMOUNT and
            status == "completed" and
            days_since_transaction >= self.MIN_DAYS and
            user_email is not None and
            not already_invited
        )

        # Compare with expected
        correct = is_eligible == expected_eligible

        # Detailed reasoning
        reasons = []
        if amount < self.MIN_AMOUNT:
            reasons.append(f"Amount ${amount} below minimum ${self.MIN_AMOUNT}")
        if status != "completed":
            reasons.append(f"Status '{status}' is not 'completed'")
        if days_since_transaction < self.MIN_DAYS:
            reasons.append(f"Only {days_since_transaction} days, need {self.MIN_DAYS}")
        if user_email is None:
            reasons.append("No user email")
        if already_invited:
            reasons.append("Already invited")

        return {
            "invitation_logic_correct": 1.0 if correct else 0.0,
            "calculated_eligible": is_eligible,
            "expected_eligible": expected_eligible,
            "match": correct,
            "reasons": " | ".join(reasons) if reasons else "All checks passed"
        }
```

### 3. API Completeness Evaluator (Code-based)

Validates API response structure:

```python
class APICompletenessEvaluator:
    def __init__(self):
        pass

    def __call__(self, *, response_data: dict, expected_fields: list, **kwargs):
        # Check which fields are present
        missing_fields = []
        present_fields = []

        for field in expected_fields:
            if field in response_data:
                present_fields.append(field)
            else:
                missing_fields.append(field)

        # Calculate completeness score
        completeness = len(present_fields) / len(expected_fields) if expected_fields else 0.0

        return {
            "api_completeness": completeness,
            "missing_fields": missing_fields,
            "present_fields": present_fields,
            "total_expected": len(expected_fields),
            "total_present": len(present_fields),
            "is_complete": len(missing_fields) == 0
        }
```

### 4. Data Type Validator (Code-based)

Validates data types in responses:

```python
class DataTypeEvaluator:
    def __init__(self):
        self.expected_types = {
            "scamAdviserScore": (int, float),
            "trustpilotRating": (int, float),
            "sslValid": bool,
            "verifiedBusiness": bool,
            "status": str,
            "domainAgeMonths": int
        }

    def __call__(self, *, response_data: dict, **kwargs):
        type_errors = []
        correct_types = 0
        total_checked = 0

        for field, expected_type in self.expected_types.items():
            if field in response_data:
                total_checked += 1
                value = response_data[field]
                if isinstance(value, expected_type):
                    correct_types += 1
                else:
                    type_errors.append(f"{field}: expected {expected_type}, got {type(value)}")

        accuracy = correct_types / total_checked if total_checked > 0 else 0.0

        return {
            "data_type_accuracy": accuracy,
            "type_errors": type_errors,
            "correct_types": correct_types,
            "total_checked": total_checked,
            "all_types_correct": len(type_errors) == 0
        }
```

## Running Evaluations

### Setup

```bash
# Install evaluation dependencies
pip install azure-ai-evaluation pandas

# Ensure test data directory exists
mkdir -p evaluation/data
mkdir -p evaluation/results
```

### Execute Evaluation

```python
from azure.ai.evaluation import evaluate
import os

# Import custom evaluators
from evaluators import (
    TrustScoreEvaluator,
    InvitationEligibilityEvaluator,
    APICompletenessEvaluator,
    DataTypeEvaluator
)

# Create evaluator instances
trust_score_eval = TrustScoreEvaluator()
invitation_eval = InvitationEligibilityEvaluator()
api_completeness_eval = APICompletenessEvaluator()
data_type_eval = DataTypeEvaluator()

# Run evaluation for trust score calculation
trust_score_results = evaluate(
    data="evaluation/data/trust_score_tests.jsonl",
    evaluators={
        "trust_score": trust_score_eval
    },
    evaluator_config={
        "trust_score": {
            "column_mapping": {
                "ssl_valid": "${data.ssl_valid}",
                "domain_age_months": "${data.domain_age_months}",
                "trustpilot_rating": "${data.trustpilot_rating}",
                "social_presence": "${data.social_presence}",
                "expected_score": "${data.expected_score}"
            }
        }
    },
    output_path="evaluation/results/trust_score_results.json"
)

# Run evaluation for invitation eligibility
invitation_results = evaluate(
    data="evaluation/data/invitation_tests.jsonl",
    evaluators={
        "invitation": invitation_eval
    },
    evaluator_config={
        "invitation": {
            "column_mapping": {
                "amount": "${data.amount}",
                "status": "${data.status}",
                "days_since_transaction": "${data.days_since_transaction}",
                "user_email": "${data.user_email}",
                "already_invited": "${data.already_invited}",
                "expected_eligible": "${data.expected_eligible}"
            }
        }
    },
    output_path="evaluation/results/invitation_results.json"
)

# Run evaluation for API responses
api_results = evaluate(
    data="evaluation/data/api_tests.jsonl",
    evaluators={
        "api_completeness": api_completeness_eval,
        "data_types": data_type_eval
    },
    evaluator_config={
        "api_completeness": {
            "column_mapping": {
                "response_data": "${data.response_data}",
                "expected_fields": "${data.expected_fields}"
            }
        },
        "data_types": {
            "column_mapping": {
                "response_data": "${data.response_data}"
            }
        }
    },
    output_path="evaluation/results/api_results.json"
)

print("\n=== Evaluation Results ===")
print(f"\nTrust Score Accuracy: {trust_score_results['metrics']['trust_score.trust_score_accuracy']:.2%}")
print(f"Invitation Logic Accuracy: {invitation_results['metrics']['invitation.invitation_logic_correct']:.2%}")
print(f"API Completeness: {api_results['metrics']['api_completeness.api_completeness']:.2%}")
print(f"Data Type Accuracy: {api_results['metrics']['data_types.data_type_accuracy']:.2%}")
```

## Success Criteria

### Trust Score Calculation

-   ✅ **Pass**: 100% accuracy on all test cases
-   ⚠️ **Warning**: 95-99% accuracy (minor edge cases)
-   ❌ **Fail**: < 95% accuracy

### Invitation Eligibility Logic

-   ✅ **Pass**: 100% correct eligibility determinations
-   ⚠️ **Warning**: 98-99% correct
-   ❌ **Fail**: < 98% correct

### API Completeness

-   ✅ **Pass**: All expected fields present in 100% of responses
-   ⚠️ **Warning**: 95-99% fields present
-   ❌ **Fail**: < 95% fields present

### Data Type Accuracy

-   ✅ **Pass**: 100% correct data types
-   ❌ **Fail**: Any type errors

## Continuous Evaluation

### Integration with CI/CD

Add to `.github/workflows/evaluation.yml`:

```yaml
name: Trust System Evaluation

on:
  push:
    branches: [main, preview]
    paths:
      - "backend/src/services/scamAdviserService.ts"
      - "backend/src/services/trustpilotInvitationService.ts"
      - "backend/src/routes/trust.ts"
  pull_request:
    branches: [main]

jobs:
  evaluate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          pip install azure-ai-evaluation pandas

      - name: Run evaluation
        run: |
          python evaluation/run_evaluation.py

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: evaluation-results
          path: evaluation/results/

      - name: Check success criteria
        run: |
          python evaluation/check_criteria.py
```

## Monitoring Dashboard

Track evaluation metrics over time:

```python
import pandas as pd
import json
from datetime import datetime

def create_evaluation_dashboard(results_dir="evaluation/results"):
    """Generate dashboard from evaluation results"""

    # Load all results
    trust_scores = json.load(open(f"{results_dir}/trust_score_results.json"))
    invitations = json.load(open(f"{results_dir}/invitation_results.json"))
    api_results = json.load(open(f"{results_dir}/api_results.json"))

    # Create summary
    dashboard = {
        "timestamp": datetime.now().isoformat(),
        "metrics": {
            "trust_score_accuracy": trust_scores["metrics"]["trust_score.trust_score_accuracy"],
            "invitation_logic_accuracy": invitations["metrics"]["invitation.invitation_logic_correct"],
            "api_completeness": api_results["metrics"]["api_completeness.api_completeness"],
            "data_type_accuracy": api_results["metrics"]["data_types.data_type_accuracy"]
        },
        "status": "PASS" if all([
            trust_scores["metrics"]["trust_score.trust_score_accuracy"] >= 0.95,
            invitations["metrics"]["invitation.invitation_logic_correct"] >= 0.98,
            api_results["metrics"]["api_completeness.api_completeness"] >= 0.95,
            api_results["metrics"]["data_types.data_type_accuracy"] == 1.0
        ]) else "FAIL"
    }

    # Save dashboard
    with open(f"{results_dir}/dashboard.json", "w") as f:
        json.dump(dashboard, f, indent=2)

    return dashboard
```

## Next Steps

1. **Generate Test Data**: Create JSONL files with test cases
2. **Implement Evaluators**: Code the custom evaluators
3. **Run Initial Evaluation**: Execute baseline evaluation
4. **Set Up CI/CD**: Integrate into GitHub Actions
5. **Monitor & Iterate**: Track metrics and improve system

## References

-   [Azure AI Evaluation SDK](https://learn.microsoft.com/azure/ai-studio/how-to/develop/evaluate-sdk)
-   [Custom Evaluators Guide](https://learn.microsoft.com/azure/ai-studio/how-to/develop/evaluate-sdk#custom-evaluators)
-   [Evaluation Best Practices](https://learn.microsoft.com/azure/ai-studio/concepts/evaluation-approach-gen-ai)
