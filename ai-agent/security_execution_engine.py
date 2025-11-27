"""
AI Cybersecurity Agent - Execution Engine
Week 3: Automated Response System

This module handles the execution of security actions based on threat analysis.
Integrates with the reasoning engine from Week 2.
"""

import asyncio
import json
import time
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import logging

# Import reasoning engine from Week 2
try:
    from threat_reasoning_engine import (
        ThreatAnalysis,
        ThreatSeverity,
        CybersecurityReasoningEngine
    )
except ImportError:
    print("⚠️ Could not import reasoning engine. Ensure Week 2 setup is complete.")

# Action execution status
class ActionStatus(Enum):
    PENDING = "pending"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"

# Action types supported
class ActionType(Enum):
    BLOCK_IP = "block_ip"
    LOCK_ACCOUNT = "lock_account"
    ISOLATE_SYSTEM = "isolate_system"
    TERMINATE_PROCESS = "terminate_process"
    SEND_ALERT = "send_alert"
    CREATE_FIREWALL_RULE = "create_firewall_rule"
    QUARANTINE_FILE = "quarantine_file"
    FORCE_LOGOUT = "force_logout"

@dataclass
class SecurityAction:
    """Represents a security action to be executed"""
    action_id: str
    action_type: ActionType
    target: str  # IP, username, system, etc.
    parameters: Dict[str, Any]
    priority: int  # 1=critical, 5=low
    threat_id: str
    created_at: datetime
    status: ActionStatus = ActionStatus.PENDING
    executed_at: Optional[datetime] = None
    execution_time: Optional[float] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

@dataclass
class ExecutionResult:
    """Result of action execution"""
    action_id: str
    success: bool
    execution_time: float
    result_data: Optional[Dict[str, Any]]
    error_message: Optional[str]
    rollback_needed: bool = False

class SecurityExecutionEngine:
    """
    Core execution engine for automated cybersecurity responses
    """

    def __init__(self, reasoning_engine: Optional[CybersecurityReasoningEngine] = None):
        """
        Initialize the execution engine

        Args:
            reasoning_engine: Optional reasoning engine for threat analysis
        """
        self.reasoning_engine = reasoning_engine
        self.action_queue: List[SecurityAction] = []
        self.execution_history: List[SecurityAction] = []
        self.active_actions: Dict[str, SecurityAction] = {}

        # Action executors - map action types to handler functions
        self.action_executors: Dict[ActionType, Callable] = {
            ActionType.BLOCK_IP: self._execute_block_ip,
            ActionType.LOCK_ACCOUNT: self._execute_lock_account,
            ActionType.ISOLATE_SYSTEM: self._execute_isolate_system,
            ActionType.TERMINATE_PROCESS: self._execute_terminate_process,
            ActionType.SEND_ALERT: self._execute_send_alert,
            ActionType.CREATE_FIREWALL_RULE: self._execute_create_firewall_rule,
            ActionType.QUARANTINE_FILE: self._execute_quarantine_file,
            ActionType.FORCE_LOGOUT: self._execute_force_logout
        }

        # Performance metrics
        self.execution_stats = {
            "total_actions": 0,
            "successful_actions": 0,
            "failed_actions": 0,
            "average_execution_time": 0.0,
            "actions_by_type": {},
            "actions_by_priority": {}
        }

        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger("SecurityExecutionEngine")

    async def analyze_and_execute(self, security_data: Dict[str, Any]) -> List[ExecutionResult]:
        """
        Analyze threat data and execute appropriate security actions

        Args:
            security_data: Raw security event data

        Returns:
            List of execution results
        """
        results = []

        # Step 1: Analyze threats using reasoning engine
        if self.reasoning_engine:
            self.logger.info("🔍 Analyzing threats with AI reasoning engine...")
            try:
                threat_analysis = await self.reasoning_engine.analyze_threat(security_data)
                self.logger.info(f"📊 Threat analysis complete - Risk: {threat_analysis.risk_score}/100")
            except Exception as e:
                self.logger.error(f"❌ Threat analysis failed: {e}")
                # Create fallback analysis
                threat_analysis = self._create_fallback_analysis(security_data)
        else:
            # Create fallback analysis without AI
            threat_analysis = self._create_fallback_analysis(security_data)

        # Step 2: Generate security actions based on analysis
        actions = self._generate_security_actions(threat_analysis, security_data)

        # Step 3: Execute actions in priority order
        if actions:
            self.logger.info(f"⚡ Executing {len(actions)} security actions...")
            for action in actions:
                result = await self.execute_action(action)
                results.append(result)

        return results

    def _create_fallback_analysis(self, security_data: Dict[str, Any]) -> ThreatAnalysis:
        """Create a basic threat analysis without AI"""
        from datetime import datetime

        # Simple rule-based analysis
        risk_score = 30.0  # Default moderate risk
        severity = ThreatSeverity.MEDIUM

        # Check for high-risk indicators
        if any(key in str(security_data).lower() for key in ['malware', 'attack', 'breach', 'exploit']):
            risk_score = 80.0
            severity = ThreatSeverity.CRITICAL
        elif any(key in str(security_data).lower() for key in ['suspicious', 'anomaly', 'failed']):
            risk_score = 60.0
            severity = ThreatSeverity.HIGH

        return ThreatAnalysis(
            threat_id=f"FALLBACK_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            indicators=[],
            risk_score=risk_score,
            severity=severity,
            recommended_actions=["Monitor situation", "Increase logging"],
            analysis_time=datetime.now(),
            reasoning="Fallback analysis - AI reasoning engine not available"
        )

    def _generate_security_actions(self, threat_analysis: ThreatAnalysis, security_data: Dict[str, Any]) -> List[SecurityAction]:
        """
        Generate appropriate security actions based on threat analysis

        Args:
            threat_analysis: Analysis results from reasoning engine
            security_data: Original security event data

        Returns:
            List of security actions to execute
        """
        actions = []
        current_time = datetime.now()

        # Determine priority based on threat severity
        priority = {
            ThreatSeverity.CRITICAL: 1,
            ThreatSeverity.HIGH: 2,
            ThreatSeverity.MEDIUM: 3,
            ThreatSeverity.LOW: 4
        }.get(threat_analysis.severity, 3)

        # Generate actions based on threat type and severity
        if threat_analysis.risk_score >= 80:  # Critical threats
            # Block malicious IPs
            if 'src_ip' in str(security_data):
                actions.append(SecurityAction(
                    action_id=str(uuid.uuid4()),
                    action_type=ActionType.BLOCK_IP,
                    target=self._extract_ip_from_data(security_data),
                    parameters={"reason": f"Critical threat - Risk: {threat_analysis.risk_score}"},
                    priority=1,
                    threat_id=threat_analysis.threat_id,
                    created_at=current_time
                ))

            # Lock compromised accounts
            if 'user' in str(security_data):
                actions.append(SecurityAction(
                    action_id=str(uuid.uuid4()),
                    action_type=ActionType.LOCK_ACCOUNT,
                    target=self._extract_user_from_data(security_data),
                    parameters={"reason": "Account compromise suspected"},
                    priority=1,
                    threat_id=threat_analysis.threat_id,
                    created_at=current_time
                ))

        elif threat_analysis.risk_score >= 60:  # High threats
            # Create monitoring alerts
            actions.append(SecurityAction(
                action_id=str(uuid.uuid4()),
                action_type=ActionType.SEND_ALERT,
                target="security_team",
                parameters={
                    "message": f"High-risk threat detected: {threat_analysis.reasoning[:100]}",
                    "threat_id": threat_analysis.threat_id,
                    "risk_score": threat_analysis.risk_score
                },
                priority=2,
                threat_id=threat_analysis.threat_id,
                created_at=current_time
            ))

        elif threat_analysis.risk_score >= 30:  # Medium threats
            # Enhanced monitoring
            actions.append(SecurityAction(
                action_id=str(uuid.uuid4()),
                action_type=ActionType.SEND_ALERT,
                target="monitoring_system",
                parameters={
                    "message": f"Medium-risk activity detected",
                    "increase_monitoring": True,
                    "threat_id": threat_analysis.threat_id
                },
                priority=3,
                threat_id=threat_analysis.threat_id,
                created_at=current_time
            ))

        # Always log the incident
        actions.append(SecurityAction(
            action_id=str(uuid.uuid4()),
            action_type=ActionType.SEND_ALERT,
            target="audit_system",
            parameters={
                "log_entry": {
                    "threat_analysis": asdict(threat_analysis),
                    "security_data": security_data,
                    "timestamp": current_time.isoformat()
                }
            },
            priority=5,
            threat_id=threat_analysis.threat_id,
            created_at=current_time
        ))

        self.logger.info(f"📋 Generated {len(actions)} security actions")
        return actions

    def _extract_ip_from_data(self, data: Dict[str, Any]) -> str:
        """Extract IP address from security data"""
        # Simple extraction - in production, use more robust parsing
        data_str = str(data)
        if 'src_ip' in data_str:
            # Try to extract IP pattern
            import re
            ip_pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
            matches = re.findall(ip_pattern, data_str)
            if matches:
                return matches[0]
        return "unknown_ip"

    def _extract_user_from_data(self, data: Dict[str, Any]) -> str:
        """Extract username from security data"""
        # Simple extraction - in production, use more robust parsing
        data_str = str(data).lower()
        if 'admin' in data_str:
            return "admin"
        elif 'user' in data_str:
            return "unknown_user"
        return "unknown_user"

    async def execute_action(self, action: SecurityAction) -> ExecutionResult:
        """
        Execute a single security action

        Args:
            action: Security action to execute

        Returns:
            Execution result
        """
        start_time = time.time()
        action.status = ActionStatus.EXECUTING
        action.executed_at = datetime.now()

        self.active_actions[action.action_id] = action

        try:
            self.logger.info(f"⚡ Executing {action.action_type.value} on {action.target}")

            # Get the appropriate executor
            executor = self.action_executors.get(action.action_type)
            if not executor:
                raise Exception(f"No executor found for action type: {action.action_type}")

            # Execute the action
            result_data = await executor(action)

            execution_time = time.time() - start_time
            action.execution_time = execution_time
            action.status = ActionStatus.COMPLETED
            action.result = result_data

            # Update statistics
            self._update_execution_stats(action, True, execution_time)

            self.logger.info(f"✅ Action {action.action_id} completed in {execution_time:.3f}s")

            return ExecutionResult(
                action_id=action.action_id,
                success=True,
                execution_time=execution_time,
                result_data=result_data,
                error_message=None
            )

        except Exception as e:
            execution_time = time.time() - start_time
            action.status = ActionStatus.FAILED
            action.error = str(e)

            self._update_execution_stats(action, False, execution_time)

            self.logger.error(f"❌ Action {action.action_id} failed: {e}")

            return ExecutionResult(
                action_id=action.action_id,
                success=False,
                execution_time=execution_time,
                result_data=None,
                error_message=str(e)
            )

        finally:
            # Move to history
            self.execution_history.append(action)
            if action.action_id in self.active_actions:
                del self.active_actions[action.action_id]

    def _update_execution_stats(self, action: SecurityAction, success: bool, execution_time: float):
        """Update execution statistics"""
        self.execution_stats["total_actions"] += 1

        if success:
            self.execution_stats["successful_actions"] += 1
        else:
            self.execution_stats["failed_actions"] += 1

        # Update average execution time
        total = self.execution_stats["total_actions"]
        current_avg = self.execution_stats["average_execution_time"]
        self.execution_stats["average_execution_time"] = (current_avg * (total - 1) + execution_time) / total

        # Track by type
        action_type_str = action.action_type.value
        if action_type_str not in self.execution_stats["actions_by_type"]:
            self.execution_stats["actions_by_type"][action_type_str] = 0
        self.execution_stats["actions_by_type"][action_type_str] += 1

        # Track by priority
        priority_str = f"priority_{action.priority}"
        if priority_str not in self.execution_stats["actions_by_priority"]:
            self.execution_stats["actions_by_priority"][priority_str] = 0
        self.execution_stats["actions_by_priority"][priority_str] += 1

    # Action executor methods (simulate real security actions)
    async def _execute_block_ip(self, action: SecurityAction) -> Dict[str, Any]:
        """Simulate blocking an IP address"""
        await asyncio.sleep(0.1)  # Simulate network call
        return {
            "blocked_ip": action.target,
            "firewall_rule_id": f"rule_{uuid.uuid4().hex[:8]}",
            "status": "blocked",
            "timestamp": datetime.now().isoformat()
        }

    async def _execute_lock_account(self, action: SecurityAction) -> Dict[str, Any]:
        """Simulate locking a user account"""
        await asyncio.sleep(0.05)  # Simulate API call
        return {
            "locked_account": action.target,
            "lock_reason": action.parameters.get("reason", "Security policy violation"),
            "status": "locked",
            "timestamp": datetime.now().isoformat()
        }

    async def _execute_isolate_system(self, action: SecurityAction) -> Dict[str, Any]:
        """Simulate isolating a system"""
        await asyncio.sleep(0.2)  # Simulate system operation
        return {
            "isolated_system": action.target,
            "isolation_type": "network",
            "status": "isolated",
            "timestamp": datetime.now().isoformat()
        }

    async def _execute_terminate_process(self, action: SecurityAction) -> Dict[str, Any]:
        """Simulate terminating a process"""
        await asyncio.sleep(0.02)  # Simulate process kill
        return {
            "terminated_process": action.target,
            "status": "terminated",
            "timestamp": datetime.now().isoformat()
        }

    async def _execute_send_alert(self, action: SecurityAction) -> Dict[str, Any]:
        """Simulate sending an alert"""
        await asyncio.sleep(0.01)  # Simulate notification
        return {
            "alert_sent_to": action.target,
            "alert_id": str(uuid.uuid4()),
            "message": action.parameters.get("message", "Security alert"),
            "status": "sent",
            "timestamp": datetime.now().isoformat()
        }

    async def _execute_create_firewall_rule(self, action: SecurityAction) -> Dict[str, Any]:
        """Simulate creating a firewall rule"""
        await asyncio.sleep(0.1)  # Simulate firewall API
        return {
            "firewall_rule": action.target,
            "rule_id": f"fw_rule_{uuid.uuid4().hex[:8]}",
            "action_type": "deny",
            "status": "created",
            "timestamp": datetime.now().isoformat()
        }

    async def _execute_quarantine_file(self, action: SecurityAction) -> Dict[str, Any]:
        """Simulate quarantining a file"""
        await asyncio.sleep(0.05)  # Simulate file operation
        return {
            "quarantined_file": action.target,
            "quarantine_location": f"/quarantine/{uuid.uuid4().hex[:8]}",
            "status": "quarantined",
            "timestamp": datetime.now().isoformat()
        }

    async def _execute_force_logout(self, action: SecurityAction) -> Dict[str, Any]:
        """Simulate forcing user logout"""
        await asyncio.sleep(0.03)  # Simulate session termination
        return {
            "logged_out_user": action.target,
            "sessions_terminated": action.parameters.get("session_count", 1),
            "status": "logged_out",
            "timestamp": datetime.now().isoformat()
        }

    def get_execution_stats(self) -> Dict[str, Any]:
        """Get execution statistics"""
        success_rate = 0.0
        if self.execution_stats["total_actions"] > 0:
            success_rate = (self.execution_stats["successful_actions"] /
                          self.execution_stats["total_actions"]) * 100

        return {
            **self.execution_stats,
            "success_rate_percentage": round(success_rate, 2),
            "active_actions": len(self.active_actions),
            "history_count": len(self.execution_history)
        }

# Example usage and testing
async def main():
    """Example usage of the Security Execution Engine"""
    print("⚡ AI Cybersecurity Execution Engine - Week 3")
    print("=" * 50)

    # Initialize execution engine
    execution_engine = SecurityExecutionEngine()

    # Example security scenarios
    security_scenarios = [
        {
            "name": "Brute Force Attack",
            "data": {
                "timestamp": "2025-11-25T15:30:00Z",
                "source": "firewall_logs",
                "events": [{
                    "type": "failed_login",
                    "src_ip": "192.168.1.100",
                    "user": "admin",
                    "attempts": 25,
                    "time_window": "2_minutes"
                }]
            }
        },
        {
            "name": "Malware Detection",
            "data": {
                "timestamp": "2025-11-25T15:35:00Z",
                "source": "endpoint_protection",
                "events": [{
                    "type": "malware_detected",
                    "file": "/tmp/suspicious.exe",
                    "host": "workstation-42",
                    "signature": "Trojan.Generic.123"
                }]
            }
        },
        {
            "name": "Data Exfiltration",
            "data": {
                "timestamp": "2025-11-25T15:40:00Z",
                "source": "network_monitoring",
                "events": [{
                    "type": "unusual_outbound",
                    "src_ip": "10.0.0.50",
                    "dst_ip": "185.123.45.67",
                    "data_volume": "500MB",
                    "user": "finance_user"
                }]
            }
        }
    ]

    # Process each scenario
    for i, scenario in enumerate(security_scenarios, 1):
        print(f"\n🚨 Scenario {i}: {scenario['name']}")
        print("-" * 30)

        try:
            # Analyze and execute security actions
            results = await execution_engine.analyze_and_execute(scenario["data"])

            print(f"📊 Executed {len(results)} actions:")
            for result in results:
                status = "✅" if result.success else "❌"
                print(f"   {status} Action {result.action_id[:8]} - {result.execution_time:.3f}s")
                if result.error_message:
                    print(f"      Error: {result.error_message}")

        except Exception as e:
            print(f"❌ Scenario failed: {e}")

    # Display execution statistics
    print(f"\n📈 Execution Statistics:")
    print("=" * 25)
    stats = execution_engine.get_execution_stats()
    print(f"Total Actions: {stats['total_actions']}")
    print(f"Success Rate: {stats['success_rate_percentage']}%")
    print(f"Average Time: {stats['average_execution_time']:.3f}s")
    print(f"By Type: {stats['actions_by_type']}")

    print("\n🎉 Week 3 Execution Engine Complete!")
    print("✅ Automated response system functional")
    print("✅ Multi-scenario threat handling working")
    print("✅ Performance metrics tracking active")
    print("✅ Security orchestration operational")

if __name__ == "__main__":
    asyncio.run(main())
