# Drill: Game Day

## Objective

Full system exercise to validate runbooks, automation, and coordination under controlled stress.

## Scenario

Simulate a partial database outage combined with a sudden spike in notification volume.

## Steps

1. Preparation
   - Notify stakeholders and schedule maintenance window for the exercise
   - Prepare monitoring dashboards and incident channels
2. Execution
   - Trigger the simulated outage in staging or a controlled environment
   - Run the runbooks and escalate as necessary
   - Execute failover procedures and validate data integrity
3. Recovery
   - Reconcile data, remove temporary mitigations, and re-enable normal traffic

## Outcomes

- Confirmed runbook effectiveness
- Identified automation gaps
- Action items and owners

## Post-Drill Notes

- Attach logs and recordings to `docs/drills/assessments/`
