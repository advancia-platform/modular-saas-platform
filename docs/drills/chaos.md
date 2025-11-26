# Drill: Chaos Engineering

## Objective

Validate system resilience by introducing controlled failures and verifying automated recovery and monitoring.

## Scenario

Introduce intermittent network partitioning for the notification service and dependency failure (e.g., Redis down) in staging.

## Steps

1. Preparation
   - Define blast radius and safety checks
   - Ensure quick rollback and kill-switch controls
   - Prepare monitoring and alerting to capture the exercise
2. Execution
   - Apply failure injection in staging
   - Observe system behavior, automated retries, and fallback flows
   - Exercise on-call rotation for troubleshooting
3. Recovery
   - Revert failures, validate system health, and run post-recovery checks

## Outcomes

- Validated automatic recovery paths
- Identified single points of failure
- Action items to harden system

## Post-Drill Notes

- Store experiment results and observations in `docs/drills/assessments/`
