# Evaluation Framework - Quick Start Guide

## Overview

This evaluation framework assesses the Trust & Trustpilot system implementation using Azure AI Evaluation SDK with custom evaluators.

## Setup (5 minutes)

### 1. Install Dependencies

```bash
cd evaluation
pip install -r requirements.txt
```

### 2. Verify Test Data

Test data files are already created in `evaluation/data/`:

-   ✅ `trust_score_tests.jsonl` - 10 trust score calculation tests
-   ✅ `invitation_tests.jsonl` - 10 invitation eligibility tests
-   ✅ `api_tests.jsonl` - 5 API response quality tests

### 3. Run Evaluation

```bash
python run_evaluation.py
```

## Expected Output

```
🚀 Starting Trust & Trustpilot System Evaluation
============================================================
✓ Directories created

=== Running Trust Score Evaluation ===
✓ Trust Score Accuracy: 100.00%

=== Running Invitation Eligibility Evaluation ===
✓ Invitation Logic Accuracy: 100.00%

=== Running API Response Evaluation ===
✓ API Completeness: 100.00%
✓ Data Type Accuracy: 100.00%
✓ Response Time Score: 100.00%

=== Generating Summary Report ===
✓ Summary report saved to evaluation/results/summary.json

============================================================
EVALUATION SUMMARY
============================================================

✅ TRUST_SCORE: PASS
   - accuracy: 100.00%

✅ INVITATION: PASS
   - accuracy: 100.00%

✅ API: PASS
   - completeness: 100.00%
   - type_accuracy: 100.00%
   - response_time: 100.00%

============================================================
OVERALL STATUS: PASS
============================================================

✅ All evaluations passed!
```

## Results Location

All results are saved to `evaluation/results/`:

-   `trust_score_results.json` - Detailed trust score evaluation
-   `invitation_results.json` - Detailed invitation logic evaluation
-   `api_results.json` - Detailed API quality evaluation
-   `summary.json` - Overall summary report

## Understanding Results

### Trust Score Evaluation

**Metrics:**

-   `trust_score_accuracy`: Percentage of correct calculations (target: 100%)
-   `score_difference`: Average difference from expected
-   `within_tolerance`: Percentage within ±2 points

**Pass Criteria:** ≥95% accuracy

### Invitation Eligibility Evaluation

**Metrics:**

-   `invitation_logic_correct`: Percentage of correct eligibility decisions (target: 100%)
-   Individual check results for each criterion

**Pass Criteria:** ≥98% accuracy

### API Quality Evaluation

**Metrics:**

-   `api_completeness`: Percentage of expected fields present (target: 100%)
-   `data_type_accuracy`: Percentage of correct data types (target: 100%)
-   `response_time_score`: Percentage meeting latency target (target: ≥80%)

**Pass Criteria:**

-   Completeness ≥95%
-   Type accuracy = 100%
-   Response time ≥80%

## Custom Evaluators

Five custom code-based evaluators are implemented:

1. **TrustScoreEvaluator** - Validates trust score calculation
2. **InvitationEligibilityEvaluator** - Validates invitation logic
3. **APICompletenessEvaluator** - Validates API responses
4. **DataTypeEvaluator** - Validates data types
5. **ResponseTimeEvaluator** - Validates performance

All evaluators follow Azure AI Evaluation SDK patterns with `__init__()` and `__call__()` methods.

## Adding New Test Cases

### Trust Score Tests

Add to `evaluation/data/trust_score_tests.jsonl`:

```json
{
  "test_id": "trust_NEW",
  "ssl_valid": true,
  "domain_age_months": 15,
  "trustpilot_rating": 4.2,
  "social_presence": true,
  "expected_score": 85,
  "description": "Your description"
}
```

### Invitation Tests

Add to `evaluation/data/invitation_tests.jsonl`:

```json
{
  "test_id": "invite_NEW",
  "transaction_id": "tx_NEW",
  "amount": 20.0,
  "status": "completed",
  "days_since_transaction": 10,
  "user_email": "test@example.com",
  "already_invited": false,
  "expected_eligible": true,
  "description": "Your description"
}
```

### API Tests

Add to `evaluation/data/api_tests.jsonl`:

```json
{"test_id": "api_NEW", "endpoint": "/api/trust/report", "response_data": {...}, "expected_fields": [...], "response_time_ms": 300, "description": "Your description"}
```

Then run `python run_evaluation.py` again.

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/evaluation.yml`:

```yaml
name: Trust System Evaluation

on:
  push:
    branches: [main, preview]
    paths:
      - "backend/src/services/**"
      - "backend/src/routes/trust.ts"
      - "evaluation/**"

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
          cd evaluation
          pip install -r requirements.txt

      - name: Run evaluation
        run: |
          cd evaluation
          python run_evaluation.py

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: evaluation-results
          path: evaluation/results/
```

## Troubleshooting

### Issue: Module not found

**Solution:**

```bash
pip install azure-ai-evaluation pandas
```

### Issue: Test data file not found

**Solution:**
Check that you're running from the repository root:

```bash
# From repository root
python evaluation/run_evaluation.py

# OR
cd evaluation
python run_evaluation.py
```

### Issue: Evaluation fails

**Solution:**

1. Check test data format (valid JSONL)
2. Verify all required fields present
3. Check for timestamp fields (not supported)

## Next Steps

1. ✅ Run initial baseline evaluation
2. 📊 Review detailed results in `evaluation/results/`
3. 🔄 Add to CI/CD pipeline
4. 📈 Track metrics over time
5. 🎯 Add more test cases as system grows

## Documentation

-   **Full Framework Guide**: `EVALUATION_FRAMEWORK.md`
-   **Custom Evaluators**: `evaluators.py`
-   **Main Script**: `run_evaluation.py`

## Support

For questions or issues with the evaluation framework:

1. Check `EVALUATION_FRAMEWORK.md` for detailed documentation
2. Review Azure AI Evaluation SDK docs: <https://learn.microsoft.com/azure/ai-studio/how-to/develop/evaluate-sdk>
3. Inspect evaluation results in `evaluation/results/`

---

**Framework Status**: ✅ Production Ready
**Last Updated**: November 18, 2025
**Test Coverage**: Trust Score (10 tests), Invitations (10 tests), API Quality (5 tests)
