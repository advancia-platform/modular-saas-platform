"""
AI Cybersecurity Agent - Real-time Integration Server
Week 4: Socket.IO + FastAPI server for real-time monitoring integration

Provides real-time communication bridge between AI agent and SaaS platform.
"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime
from typing import Dict, List, Optional, Any

import socketio
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import our AI agent components
import sys
sys.path.append('..')

try:
    from threat_reasoning_engine import CybersecurityReasoningEngine
    from security_execution_engine import SecurityExecutionEngine
    from monitoring.system_health_monitor import SystemHealthMonitor
    print("✅ Successfully imported AI agent components")
except ImportError as e:
    print(f"⚠️ Import warning: {e}")

class ThreatAlert(BaseModel):
    """Real-time threat alert model"""
    id: str
    name: str
    severity: str
    timestamp: str
    source: str
    actions_taken: List[str]
    status: str

class SystemStatus(BaseModel):
    """System status model"""
    status: str
    uptime_seconds: float
    threats_processed: int
    actions_executed: int
    response_time_avg: float
    last_update: str

class AgentCommand(BaseModel):
    """Admin command model"""
    command: str
    parameters: Optional[Dict[str, Any]] = {}
    user_id: str
    timestamp: str

class RealTimeIntegrationServer:
    """
    Real-time integration server for AI cybersecurity agent
    Provides Socket.IO and REST API endpoints for platform integration
    """

    def __init__(self, host="localhost", port=8001):
        """
        Initialize the integration server

        Args:
            host: Server host address
            port: Server port
        """
        self.host = host
        self.port = port

        # Initialize FastAPI app
        self.app = FastAPI(
            title="AI Cybersecurity Agent API",
            description="Real-time monitoring and control API for AI cybersecurity agent",
            version="1.0.0"
        )

        # Initialize Socket.IO server
        self.sio = socketio.AsyncServer(
            cors_allowed_origins="*",
            logger=True,
            engineio_logger=True
        )

        # Attach Socket.IO to FastAPI
        self.socket_app = socketio.ASGIApp(self.sio, self.app)

        # Initialize agent components
        self.github_token = os.getenv("GITHUB_TOKEN")
        self.reasoning_engine = None
        self.execution_engine = None
        self.health_monitor = None
        self.cybersecurity_agent = None

        # Server state
        self.is_running = False
        self.connected_clients = set()
        self.admin_sessions = {}

        # Background tasks
        self.monitoring_task = None

        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

        # Setup routes and handlers
        self._setup_api_routes()
        self._setup_socket_handlers()
        self._setup_middleware()

    def _setup_middleware(self):
        """Setup FastAPI middleware"""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Configure for production
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def _setup_api_routes(self):
        """Setup REST API routes"""

        @self.app.get("/")
        async def root():
            return {
                "service": "AI Cybersecurity Agent Integration Server",
                "version": "1.0.0",
                "status": "running" if self.is_running else "stopped",
                "timestamp": datetime.now().isoformat()
            }

        @self.app.get("/api/v1/status")
        async def get_status():
            """Get current agent status"""
            if not self.cybersecurity_agent:
                raise HTTPException(status_code=503, detail="Agent not initialized")

            try:
                performance = self.cybersecurity_agent.get_agent_performance()
                agent_stats = performance.get('agent_overview', {})

                return SystemStatus(
                    status="operational",
                    uptime_seconds=time.time() - getattr(self, 'start_time', time.time()),
                    threats_processed=agent_stats.get('threats_processed', 0),
                    actions_executed=agent_stats.get('actions_executed', 0),
                    response_time_avg=agent_stats.get('average_response_time', 0),
                    last_update=datetime.now().isoformat()
                )
            except Exception as e:
                self.logger.error(f"Status check failed: {e}")
                raise HTTPException(status_code=500, detail="Status check failed")

        @self.app.get("/api/v1/health")
        async def get_health():
            """Get comprehensive health status"""
            if not self.health_monitor:
                raise HTTPException(status_code=503, detail="Health monitor not available")

            try:
                return self.health_monitor.get_current_health_status()
            except Exception as e:
                self.logger.error(f"Health check failed: {e}")
                raise HTTPException(status_code=500, detail="Health check failed")

        @self.app.get("/api/v1/metrics")
        async def get_metrics():
            """Get performance metrics"""
            if not self.health_monitor:
                raise HTTPException(status_code=503, detail="Health monitor not available")

            try:
                return self.health_monitor.get_metrics_history(30)  # Last 30 minutes
            except Exception as e:
                self.logger.error(f"Metrics collection failed: {e}")
                raise HTTPException(status_code=500, detail="Metrics collection failed")

        @self.app.post("/api/v1/admin/command")
        async def execute_admin_command(command: AgentCommand, background_tasks: BackgroundTasks):
            """Execute admin command"""
            self.logger.info(f"Admin command received: {command.command}")

            # Add command to background processing
            background_tasks.add_task(self._process_admin_command, command)

            return {
                "status": "accepted",
                "command": command.command,
                "timestamp": datetime.now().isoformat()
            }

        @self.app.post("/api/v1/threats/simulate")
        async def simulate_threat(threat_data: dict):
            """Simulate a threat for testing (development only)"""
            if not self.cybersecurity_agent:
                raise HTTPException(status_code=503, detail="Agent not initialized")

            try:
                # Process the simulated threat
                result = await self.cybersecurity_agent.process_security_event(threat_data)

                # Emit real-time update
                await self._emit_threat_alert(threat_data, result)

                return {
                    "status": "processed",
                    "result": result,
                    "timestamp": datetime.now().isoformat()
                }
            except Exception as e:
                self.logger.error(f"Threat simulation failed: {e}")
                raise HTTPException(status_code=500, detail="Threat simulation failed")

    def _setup_socket_handlers(self):
        """Setup Socket.IO event handlers"""

        @self.sio.event
        async def connect(sid, environ):
            """Handle client connection"""
            self.connected_clients.add(sid)
            self.logger.info(f"Client connected: {sid}")

            # Join general monitoring room
            await self.sio.enter_room(sid, "monitoring")

            # Send current status
            if self.cybersecurity_agent:
                try:
                    performance = self.cybersecurity_agent.get_agent_performance()
                    await self.sio.emit("system-status", performance, room=sid)
                except Exception as e:
                    self.logger.error(f"Failed to send initial status: {e}")

        @self.sio.event
        async def disconnect(sid):
            """Handle client disconnection"""
            self.connected_clients.discard(sid)
            if sid in self.admin_sessions:
                del self.admin_sessions[sid]
            self.logger.info(f"Client disconnected: {sid}")

        @self.sio.event
        async def join_admin(sid, data):
            """Handle admin session join"""
            # In production, implement proper authentication
            admin_id = data.get("admin_id", "unknown")
            self.admin_sessions[sid] = admin_id

            await self.sio.enter_room(sid, "admin")
            self.logger.info(f"Admin session started: {admin_id}")

            await self.sio.emit("admin-joined", {
                "status": "success",
                "timestamp": datetime.now().isoformat()
            }, room=sid)

        @self.sio.event
        async def request_live_data(sid, data):
            """Handle request for live monitoring data"""
            room = data.get("room", "monitoring")
            await self.sio.enter_room(sid, room)

            # Send current data
            if self.health_monitor:
                health_status = self.health_monitor.get_current_health_status()
                await self.sio.emit("health-update", health_status, room=sid)

    async def _process_admin_command(self, command: AgentCommand):
        """Process admin commands"""
        try:
            self.logger.info(f"Processing admin command: {command.command}")

            command_result = {
                "command": command.command,
                "status": "executed",
                "timestamp": datetime.now().isoformat(),
                "user_id": command.user_id
            }

            if command.command == "restart_agent":
                # Restart agent components
                await self._restart_agent()
                command_result["message"] = "Agent restarted successfully"

            elif command.command == "update_config":
                # Update configuration
                config_updates = command.parameters
                command_result["message"] = f"Configuration updated: {config_updates}"

            elif command.command == "get_diagnostics":
                # Generate diagnostics report
                diagnostics = await self._generate_diagnostics()
                command_result["data"] = diagnostics
                command_result["message"] = "Diagnostics generated"

            else:
                command_result["status"] = "unknown"
                command_result["message"] = f"Unknown command: {command.command}"

            # Emit result to admin clients
            await self.sio.emit("admin-command-result", command_result, room="admin")

        except Exception as e:
            self.logger.error(f"Admin command processing failed: {e}")
            error_result = {
                "command": command.command,
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
            await self.sio.emit("admin-command-result", error_result, room="admin")

    async def _emit_threat_alert(self, threat_data: dict, processing_result: dict):
        """Emit real-time threat alert to connected clients"""
        alert = ThreatAlert(
            id=f"threat_{int(time.time())}",
            name=threat_data.get("name", "Unknown Threat"),
            severity=threat_data.get("severity", "medium"),
            timestamp=datetime.now().isoformat(),
            source=threat_data.get("source", "ai-agent"),
            actions_taken=processing_result.get("execution_results", []),
            status="processed"
        )

        # Emit to monitoring room
        await self.sio.emit("threat-alert", alert.dict(), room="monitoring")

        # Emit to admin room with additional details
        admin_alert = alert.dict()
        admin_alert["processing_details"] = processing_result
        await self.sio.emit("admin-threat-alert", admin_alert, room="admin")

    async def _start_background_monitoring(self):
        """Start background monitoring tasks"""
        if self.health_monitor:
            # Start health monitoring
            self.monitoring_task = asyncio.create_task(
                self.health_monitor.start_monitoring()
            )

            # Start real-time data broadcasting
            await self._start_realtime_broadcast()

    async def _start_realtime_broadcast(self):
        """Start broadcasting real-time data to clients"""
        while self.is_running:
            try:
                if self.health_monitor and self.connected_clients:
                    # Get current health status
                    health_status = self.health_monitor.get_current_health_status()

                    # Broadcast to monitoring clients
                    await self.sio.emit("health-update", health_status, room="monitoring")

                    # Broadcast system metrics to admin
                    if health_status.get("system_metrics"):
                        await self.sio.emit("system-metrics", health_status["system_metrics"], room="admin")

                # Wait before next broadcast
                await asyncio.sleep(5.0)  # 5-second intervals

            except Exception as e:
                self.logger.error(f"Real-time broadcast error: {e}")
                await asyncio.sleep(10.0)  # Wait longer on error

    async def _restart_agent(self):
        """Restart agent components"""
        self.logger.info("Restarting AI agent components...")

        # Stop current monitoring
        if self.health_monitor:
            self.health_monitor.stop_monitoring()

        # Reinitialize components
        await self.initialize_agent()

        self.logger.info("Agent restart complete")

    async def _generate_diagnostics(self) -> Dict[str, Any]:
        """Generate comprehensive diagnostics report"""
        diagnostics = {
            "timestamp": datetime.now().isoformat(),
            "server_info": {
                "host": self.host,
                "port": self.port,
                "connected_clients": len(self.connected_clients),
                "admin_sessions": len(self.admin_sessions)
            }
        }

        if self.health_monitor:
            diagnostics["health_report"] = self.health_monitor.export_health_report()

        if self.cybersecurity_agent:
            diagnostics["agent_performance"] = self.cybersecurity_agent.get_agent_performance()

        return diagnostics

    async def initialize_agent(self):
        """Initialize AI agent components"""
        try:
            self.logger.info("Initializing AI agent components...")

            # Initialize reasoning engine
            if self.github_token:
                self.reasoning_engine = CybersecurityReasoningEngine(self.github_token)

            # Initialize execution engine
            self.execution_engine = SecurityExecutionEngine(self.reasoning_engine)

            # Initialize cybersecurity agent
            from test_complete_system import CyberSecurityAgent
            self.cybersecurity_agent = CyberSecurityAgent(self.github_token)

            # Initialize health monitor
            self.health_monitor = SystemHealthMonitor(self.cybersecurity_agent)

            self.logger.info("✅ AI agent components initialized")

        except Exception as e:
            self.logger.error(f"❌ Agent initialization failed: {e}")
            raise

    async def start(self):
        """Start the integration server"""
        self.logger.info("🚀 Starting AI Cybersecurity Integration Server")

        # Initialize agent components
        await self.initialize_agent()

        # Set running state
        self.is_running = True
        self.start_time = time.time()

        # Start background monitoring
        await self._start_background_monitoring()

        # Start the server
        config = uvicorn.Config(
            self.socket_app,
            host=self.host,
            port=self.port,
            log_level="info"
        )
        server = uvicorn.Server(config)

        self.logger.info(f"🌐 Server starting on http://{self.host}:{self.port}")
        await server.serve()

    async def stop(self):
        """Stop the integration server"""
        self.logger.info("⏹️ Stopping integration server")

        self.is_running = False

        # Stop monitoring
        if self.health_monitor:
            self.health_monitor.stop_monitoring()

        # Cancel monitoring task
        if self.monitoring_task:
            self.monitoring_task.cancel()

        self.logger.info("✅ Integration server stopped")

# Development server runner
async def run_development_server():
    """Run the development integration server"""
    server = RealTimeIntegrationServer(host="localhost", port=8001)

    try:
        await server.start()
    except KeyboardInterrupt:
        await server.stop()

if __name__ == "__main__":
    print("🔧 AI Cybersecurity Integration Server - Development Mode")
    print("=" * 55)
    print("🌐 Starting on http://localhost:8001")
    print("📡 Socket.IO endpoint: ws://localhost:8001/socket.io/")
    print("📊 API docs: http://localhost:8001/docs")
    print("❌ Press Ctrl+C to stop")
    print("=" * 55)

    asyncio.run(run_development_server())
