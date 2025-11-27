"""
AI Cybersecurity Agent - System Health Monitor
Week 4: Real-time system monitoring and health tracking

Monitors agent performance, system resources, and operational health.
"""

import psutil
import asyncio
import time
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from collections import deque
import logging

@dataclass
class SystemMetrics:
    """System performance metrics snapshot"""
    timestamp: str
    cpu_usage_percent: float
    memory_usage_percent: float
    memory_available_gb: float
    disk_usage_percent: float
    network_bytes_sent: int
    network_bytes_recv: int
    process_count: int
    uptime_seconds: float

@dataclass
class AgentMetrics:
    """AI Agent specific performance metrics"""
    timestamp: str
    threats_processed_total: int
    threats_processed_per_minute: float
    actions_executed_total: int
    action_success_rate: float
    average_response_time_ms: float
    current_queue_size: int
    agent_status: str
    last_threat_timestamp: Optional[str]

@dataclass
class HealthAlert:
    """System health alert"""
    id: str
    alert_type: str
    severity: str  # low, medium, high, critical
    message: str
    timestamp: str
    component: str
    resolved: bool = False
    resolution_time: Optional[str] = None

class SystemHealthMonitor:
    """
    Comprehensive system health monitoring for the AI cybersecurity agent
    """

    def __init__(self, agent_reference=None):
        """
        Initialize health monitor

        Args:
            agent_reference: Reference to the main agent for metrics collection
        """
        self.agent_reference = agent_reference
        self.is_monitoring = False

        # Metrics storage (recent history)
        self.system_metrics_history = deque(maxlen=100)  # Last 100 readings
        self.agent_metrics_history = deque(maxlen=100)
        self.active_alerts = {}
        self.resolved_alerts = deque(maxlen=50)

        # Performance thresholds
        self.thresholds = {
            'cpu_warning': 70.0,
            'cpu_critical': 90.0,
            'memory_warning': 80.0,
            'memory_critical': 95.0,
            'disk_warning': 85.0,
            'disk_critical': 95.0,
            'response_time_warning': 1000.0,  # ms
            'response_time_critical': 5000.0,  # ms
            'queue_size_warning': 10,
            'queue_size_critical': 25
        }

        # Monitoring intervals
        self.system_check_interval = 5.0  # seconds
        self.agent_check_interval = 10.0  # seconds
        self.alert_check_interval = 15.0  # seconds

        # Start time for uptime calculation
        self.start_time = time.time()

        # Setup logging
        self.logger = logging.getLogger(__name__)

    async def start_monitoring(self):
        """Start all monitoring tasks"""
        self.is_monitoring = True
        self.logger.info("🔍 Starting system health monitoring")

        # Create concurrent monitoring tasks
        tasks = [
            self._monitor_system_metrics(),
            self._monitor_agent_metrics(),
            self._monitor_health_alerts()
        ]

        await asyncio.gather(*tasks)

    def stop_monitoring(self):
        """Stop all monitoring"""
        self.is_monitoring = False
        self.logger.info("⏹️ Stopping system health monitoring")

    async def _monitor_system_metrics(self):
        """Monitor system-level metrics continuously"""
        while self.is_monitoring:
            try:
                metrics = self._collect_system_metrics()
                self.system_metrics_history.append(metrics)

                # Check for system-level alerts
                self._check_system_thresholds(metrics)

            except Exception as e:
                self.logger.error(f"System metrics collection error: {e}")

            await asyncio.sleep(self.system_check_interval)

    async def _monitor_agent_metrics(self):
        """Monitor AI agent specific metrics"""
        while self.is_monitoring:
            try:
                metrics = self._collect_agent_metrics()
                if metrics:
                    self.agent_metrics_history.append(metrics)

                    # Check for agent-level alerts
                    self._check_agent_thresholds(metrics)

            except Exception as e:
                self.logger.error(f"Agent metrics collection error: {e}")

            await asyncio.sleep(self.agent_check_interval)

    async def _monitor_health_alerts(self):
        """Monitor and manage health alerts"""
        while self.is_monitoring:
            try:
                # Check if any alerts should be auto-resolved
                self._auto_resolve_alerts()

                # Cleanup old resolved alerts
                self._cleanup_old_alerts()

            except Exception as e:
                self.logger.error(f"Alert monitoring error: {e}")

            await asyncio.sleep(self.alert_check_interval)

    def _collect_system_metrics(self) -> SystemMetrics:
        """Collect current system performance metrics"""
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)

        # Memory usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        memory_available_gb = memory.available / (1024**3)

        # Disk usage (primary drive)
        disk = psutil.disk_usage('/')
        disk_percent = disk.used / disk.total * 100

        # Network I/O
        network = psutil.net_io_counters()

        # Process count
        process_count = len(psutil.pids())

        # System uptime
        uptime_seconds = time.time() - self.start_time

        return SystemMetrics(
            timestamp=datetime.now().isoformat(),
            cpu_usage_percent=cpu_percent,
            memory_usage_percent=memory_percent,
            memory_available_gb=memory_available_gb,
            disk_usage_percent=disk_percent,
            network_bytes_sent=network.bytes_sent,
            network_bytes_recv=network.bytes_recv,
            process_count=process_count,
            uptime_seconds=uptime_seconds
        )

    def _collect_agent_metrics(self) -> Optional[AgentMetrics]:
        """Collect AI agent specific metrics"""
        if not self.agent_reference:
            return None

        try:
            # Get agent performance stats
            agent_stats = self.agent_reference.get_agent_performance()
            agent_overview = agent_stats.get('agent_overview', {})
            execution_engine = agent_stats.get('execution_engine', {})

            # Calculate threats per minute
            threats_total = agent_overview.get('threats_processed', 0)
            current_time = time.time()
            uptime_minutes = (current_time - self.start_time) / 60
            threats_per_minute = threats_total / uptime_minutes if uptime_minutes > 0 else 0

            # Get response time in milliseconds
            avg_response_time_ms = agent_overview.get('average_response_time', 0) * 1000

            return AgentMetrics(
                timestamp=datetime.now().isoformat(),
                threats_processed_total=threats_total,
                threats_processed_per_minute=threats_per_minute,
                actions_executed_total=agent_overview.get('actions_executed', 0),
                action_success_rate=execution_engine.get('success_rate_percentage', 0),
                average_response_time_ms=avg_response_time_ms,
                current_queue_size=0,  # Would connect to actual queue in production
                agent_status="operational",
                last_threat_timestamp=None
            )

        except Exception as e:
            self.logger.error(f"Agent metrics collection failed: {e}")
            return None

    def _check_system_thresholds(self, metrics: SystemMetrics):
        """Check system metrics against thresholds and create alerts"""
        alerts = []

        # CPU usage alerts
        if metrics.cpu_usage_percent > self.thresholds['cpu_critical']:
            alerts.append(self._create_alert(
                'cpu_critical', 'critical',
                f"Critical CPU usage: {metrics.cpu_usage_percent:.1f}%",
                'system'
            ))
        elif metrics.cpu_usage_percent > self.thresholds['cpu_warning']:
            alerts.append(self._create_alert(
                'cpu_warning', 'high',
                f"High CPU usage: {metrics.cpu_usage_percent:.1f}%",
                'system'
            ))

        # Memory usage alerts
        if metrics.memory_usage_percent > self.thresholds['memory_critical']:
            alerts.append(self._create_alert(
                'memory_critical', 'critical',
                f"Critical memory usage: {metrics.memory_usage_percent:.1f}%",
                'system'
            ))
        elif metrics.memory_usage_percent > self.thresholds['memory_warning']:
            alerts.append(self._create_alert(
                'memory_warning', 'high',
                f"High memory usage: {metrics.memory_usage_percent:.1f}%",
                'system'
            ))

        # Disk usage alerts
        if metrics.disk_usage_percent > self.thresholds['disk_critical']:
            alerts.append(self._create_alert(
                'disk_critical', 'critical',
                f"Critical disk usage: {metrics.disk_usage_percent:.1f}%",
                'system'
            ))
        elif metrics.disk_usage_percent > self.thresholds['disk_warning']:
            alerts.append(self._create_alert(
                'disk_warning', 'medium',
                f"High disk usage: {metrics.disk_usage_percent:.1f}%",
                'system'
            ))

        # Add alerts to active alerts
        for alert in alerts:
            self.active_alerts[alert.id] = alert

    def _check_agent_thresholds(self, metrics: AgentMetrics):
        """Check agent metrics against thresholds"""
        alerts = []

        # Response time alerts
        if metrics.average_response_time_ms > self.thresholds['response_time_critical']:
            alerts.append(self._create_alert(
                'response_time_critical', 'critical',
                f"Critical response time: {metrics.average_response_time_ms:.1f}ms",
                'agent'
            ))
        elif metrics.average_response_time_ms > self.thresholds['response_time_warning']:
            alerts.append(self._create_alert(
                'response_time_warning', 'high',
                f"Slow response time: {metrics.average_response_time_ms:.1f}ms",
                'agent'
            ))

        # Queue size alerts
        if metrics.current_queue_size > self.thresholds['queue_size_critical']:
            alerts.append(self._create_alert(
                'queue_critical', 'critical',
                f"Critical queue size: {metrics.current_queue_size} items",
                'agent'
            ))
        elif metrics.current_queue_size > self.thresholds['queue_size_warning']:
            alerts.append(self._create_alert(
                'queue_warning', 'high',
                f"Large queue size: {metrics.current_queue_size} items",
                'agent'
            ))

        # Add alerts to active alerts
        for alert in alerts:
            self.active_alerts[alert.id] = alert

    def _create_alert(self, alert_type: str, severity: str, message: str, component: str) -> HealthAlert:
        """Create a new health alert"""
        alert_id = f"{component}_{alert_type}_{int(time.time())}"

        return HealthAlert(
            id=alert_id,
            alert_type=alert_type,
            severity=severity,
            message=message,
            timestamp=datetime.now().isoformat(),
            component=component
        )

    def _auto_resolve_alerts(self):
        """Auto-resolve alerts that are no longer triggered"""
        current_time = datetime.now()

        # Get latest metrics
        if not self.system_metrics_history:
            return

        latest_system = self.system_metrics_history[-1]

        # Check which alerts can be auto-resolved
        alerts_to_resolve = []

        for alert_id, alert in self.active_alerts.items():
            should_resolve = False

            # CPU alerts
            if alert.alert_type in ['cpu_warning', 'cpu_critical']:
                if latest_system.cpu_usage_percent < self.thresholds['cpu_warning']:
                    should_resolve = True

            # Memory alerts
            elif alert.alert_type in ['memory_warning', 'memory_critical']:
                if latest_system.memory_usage_percent < self.thresholds['memory_warning']:
                    should_resolve = True

            # Disk alerts
            elif alert.alert_type in ['disk_warning', 'disk_critical']:
                if latest_system.disk_usage_percent < self.thresholds['disk_warning']:
                    should_resolve = True

            if should_resolve:
                alerts_to_resolve.append(alert_id)

        # Resolve alerts
        for alert_id in alerts_to_resolve:
            self.resolve_alert(alert_id)

    def resolve_alert(self, alert_id: str):
        """Resolve an active alert"""
        if alert_id in self.active_alerts:
            alert = self.active_alerts[alert_id]
            alert.resolved = True
            alert.resolution_time = datetime.now().isoformat()

            # Move to resolved alerts
            self.resolved_alerts.append(alert)
            del self.active_alerts[alert_id]

            self.logger.info(f"🔧 Resolved alert: {alert.message}")

    def _cleanup_old_alerts(self):
        """Clean up old resolved alerts (keep only recent ones)"""
        # The deque automatically handles this with maxlen=50
        pass

    def get_current_health_status(self) -> Dict[str, Any]:
        """Get comprehensive current health status"""
        if not self.system_metrics_history:
            return {"status": "no_data", "message": "No metrics collected yet"}

        latest_system = self.system_metrics_history[-1]
        latest_agent = self.agent_metrics_history[-1] if self.agent_metrics_history else None

        # Determine overall health status
        critical_alerts = [a for a in self.active_alerts.values() if a.severity == 'critical']
        high_alerts = [a for a in self.active_alerts.values() if a.severity == 'high']

        if critical_alerts:
            overall_status = "critical"
        elif high_alerts:
            overall_status = "warning"
        elif self.active_alerts:
            overall_status = "degraded"
        else:
            overall_status = "healthy"

        return {
            "overall_status": overall_status,
            "timestamp": datetime.now().isoformat(),
            "system_metrics": asdict(latest_system),
            "agent_metrics": asdict(latest_agent) if latest_agent else None,
            "active_alerts": [asdict(alert) for alert in self.active_alerts.values()],
            "alert_summary": {
                "critical": len(critical_alerts),
                "high": len(high_alerts),
                "total_active": len(self.active_alerts)
            },
            "uptime_seconds": latest_system.uptime_seconds
        }

    def get_metrics_history(self, minutes: int = 30) -> Dict[str, List[Dict]]:
        """Get metrics history for specified time period"""
        cutoff_time = datetime.now() - timedelta(minutes=minutes)

        # Filter metrics within time window
        system_history = []
        agent_history = []

        for metrics in self.system_metrics_history:
            metrics_time = datetime.fromisoformat(metrics.timestamp)
            if metrics_time >= cutoff_time:
                system_history.append(asdict(metrics))

        for metrics in self.agent_metrics_history:
            metrics_time = datetime.fromisoformat(metrics.timestamp)
            if metrics_time >= cutoff_time:
                agent_history.append(asdict(metrics))

        return {
            "system_metrics": system_history,
            "agent_metrics": agent_history,
            "time_window_minutes": minutes
        }

    def export_health_report(self) -> Dict[str, Any]:
        """Export comprehensive health report"""
        return {
            "report_timestamp": datetime.now().isoformat(),
            "monitoring_status": "active" if self.is_monitoring else "stopped",
            "current_health": self.get_current_health_status(),
            "metrics_history": self.get_metrics_history(60),  # Last hour
            "configuration": {
                "thresholds": self.thresholds,
                "check_intervals": {
                    "system": self.system_check_interval,
                    "agent": self.agent_check_interval,
                    "alerts": self.alert_check_interval
                }
            },
            "alert_history": [asdict(alert) for alert in self.resolved_alerts]
        }

# Test function for Week 4 development
async def test_health_monitor():
    """Test the health monitoring system"""
    print("🔍 Testing System Health Monitor")
    print("=" * 40)

    monitor = SystemHealthMonitor()

    # Start monitoring for a short test period
    print("🚀 Starting health monitor...")

    # Run monitoring for 30 seconds
    monitoring_task = asyncio.create_task(monitor.start_monitoring())

    # Let it collect some data
    await asyncio.sleep(30)

    # Stop monitoring
    monitor.stop_monitoring()

    # Get health status
    health_status = monitor.get_current_health_status()
    print(f"\n📊 Health Status: {health_status['overall_status'].upper()}")
    print(f"📈 System Metrics Collected: {len(monitor.system_metrics_history)}")
    print(f"🚨 Active Alerts: {len(health_status['active_alerts'])}")

    if health_status['system_metrics']:
        system = health_status['system_metrics']
        print(f"\n💻 Current System Status:")
        print(f"   🔥 CPU Usage: {system['cpu_usage_percent']:.1f}%")
        print(f"   💾 Memory Usage: {system['memory_usage_percent']:.1f}%")
        print(f"   💽 Disk Usage: {system['disk_usage_percent']:.1f}%")
        print(f"   ⏱️ Uptime: {system['uptime_seconds']:.0f} seconds")

    # Export full report
    report = monitor.export_health_report()
    print(f"\n📋 Full Health Report Generated:")
    print(f"   📊 Report Size: {len(str(report))} characters")
    print(f"   🕐 Report Time: {report['report_timestamp']}")

    print(f"\n✅ Health Monitor Test Complete!")
    return True

if __name__ == "__main__":
    asyncio.run(test_health_monitor())
