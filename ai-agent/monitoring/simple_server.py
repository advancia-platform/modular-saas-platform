"""
Simplified AI Cybersecurity Agent Integration Server for Week 4 Testing
Provides basic Socket.IO and REST API for dashboard testing
"""

import asyncio
import json
import time
from datetime import datetime
from typing import Dict, Any

import socketio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import psutil

class SimpleIntegrationServer:
    """
    Simplified integration server for testing the dashboard
    """

    def __init__(self, host="localhost", port=8001):
        self.host = host
        self.port = port

        # Initialize FastAPI app
        self.app = FastAPI(
            title="AI Cybersecurity Agent API",
            description="Real-time monitoring API for AI cybersecurity agent",
            version="1.0.0"
        )

        # Initialize Socket.IO server
        self.sio = socketio.AsyncServer(
            cors_allowed_origins="*",
            logger=False,
            engineio_logger=False
        )

        # Attach Socket.IO to FastAPI
        self.socket_app = socketio.ASGIApp(self.sio, self.app)

        # Server state
        self.is_running = False
        self.connected_clients = set()
        self.start_time = time.time()

        # Mock data
        self.mock_threats = []
        self.mock_alerts = []

        # Setup middleware and routes
        self._setup_middleware()
        self._setup_api_routes()
        self._setup_socket_handlers()

    def _setup_middleware(self):
        """Setup CORS middleware"""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
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
            return {
                "status": "operational",
                "uptime_seconds": time.time() - self.start_time,
                "threats_processed": len(self.mock_threats),
                "actions_executed": len(self.mock_threats) * 2,  # Mock: 2 actions per threat
                "response_time_avg": 0.046,
                "last_update": datetime.now().isoformat()
            }

        @self.app.get("/api/v1/health")
        async def get_health():
            """Get comprehensive health status"""
            cpu_percent = psutil.cpu_percent()
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')

            return {
                "overall_status": "healthy" if cpu_percent < 80 else "warning",
                "timestamp": datetime.now().isoformat(),
                "system_metrics": {
                    "cpu_usage_percent": cpu_percent,
                    "memory_usage_percent": memory.percent,
                    "memory_available_gb": memory.available / (1024**3),
                    "disk_usage_percent": disk.used / disk.total * 100,
                    "process_count": len(psutil.pids()),
                    "uptime_seconds": time.time() - self.start_time
                },
                "agent_metrics": {
                    "threats_processed_total": len(self.mock_threats),
                    "threats_processed_per_minute": len(self.mock_threats) / max((time.time() - self.start_time) / 60, 1),
                    "actions_executed_total": len(self.mock_threats) * 2,
                    "action_success_rate": 100.0,
                    "average_response_time_ms": 46.0,
                    "current_queue_size": 0,
                    "agent_status": "operational"
                },
                "active_alerts": self.mock_alerts,
                "alert_summary": {
                    "critical": len([a for a in self.mock_alerts if a.get('severity') == 'critical']),
                    "high": len([a for a in self.mock_alerts if a.get('severity') == 'high']),
                    "total_active": len(self.mock_alerts)
                },
                "uptime_seconds": time.time() - self.start_time
            }

        @self.app.get("/api/v1/metrics")
        async def get_metrics():
            """Get performance metrics"""
            return {
                "system_metrics": [],
                "agent_metrics": [],
                "time_window_minutes": 30
            }

        @self.app.post("/api/v1/admin/command")
        async def execute_admin_command(command_data: dict):
            """Execute admin command"""
            command = command_data.get('command', '')
            print(f"Admin command received: {command}")

            # Emit command result to admin clients
            await self.sio.emit("admin-command-result", {
                "command": command,
                "status": "executed",
                "message": f"Command {command} executed successfully",
                "timestamp": datetime.now().isoformat()
            }, room="admin")

            return {
                "status": "accepted",
                "command": command,
                "timestamp": datetime.now().isoformat()
            }

        @self.app.post("/api/v1/threats/simulate")
        async def simulate_threat(threat_data: dict):
            """Simulate a threat for testing"""
            threat_id = f"threat_{int(time.time())}"

            # Create mock threat
            threat = {
                "id": threat_id,
                "name": threat_data.get("name", "Simulated Threat"),
                "severity": threat_data.get("severity", "medium"),
                "timestamp": datetime.now().isoformat(),
                "source": "dashboard_simulation",
                "actions_taken": ["send_alert", "block_ip"],
                "status": "processed"
            }

            self.mock_threats.append(threat)

            # Emit real-time threat alert
            await self.sio.emit("threat-alert", threat, room="monitoring")

            return {
                "status": "processed",
                "result": {
                    "event_name": threat["name"],
                    "processing_time": 0.046,
                    "actions_executed": 2,
                    "successful_actions": 2,
                    "failed_actions": 0
                },
                "timestamp": datetime.now().isoformat()
            }

    def _setup_socket_handlers(self):
        """Setup Socket.IO event handlers"""

        @self.sio.event
        async def connect(sid, environ):
            """Handle client connection"""
            self.connected_clients.add(sid)
            print(f"Client connected: {sid}")

            # Join general monitoring room
            await self.sio.enter_room(sid, "monitoring")

            # Send current status
            await self.sio.emit("system-status", {
                "status": "operational",
                "timestamp": datetime.now().isoformat()
            }, room=sid)

        @self.sio.event
        async def disconnect(sid):
            """Handle client disconnection"""
            self.connected_clients.discard(sid)
            print(f"Client disconnected: {sid}")

        @self.sio.event
        async def join_admin(sid, data):
            """Handle admin session join"""
            await self.sio.enter_room(sid, "admin")
            print(f"Admin session started")

            await self.sio.emit("admin-joined", {
                "status": "success",
                "timestamp": datetime.now().isoformat()
            }, room=sid)

        @self.sio.event
        async def request_live_data(sid, data):
            """Handle request for live monitoring data"""
            room = data.get("room", "monitoring")
            await self.sio.enter_room(sid, room)

            # Send current health data
            health_data = await self._get_current_health()
            await self.sio.emit("health-update", health_data, room=sid)

    async def _get_current_health(self):
        """Get current health status"""
        cpu_percent = psutil.cpu_percent()
        memory = psutil.virtual_memory()

        return {
            "overall_status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "system_metrics": {
                "cpu_usage_percent": cpu_percent,
                "memory_usage_percent": memory.percent,
                "uptime_seconds": time.time() - self.start_time
            },
            "alert_summary": {
                "critical": 0,
                "high": 0,
                "total_active": 0
            }
        }

    async def _start_real_time_updates(self):
        """Start broadcasting real-time updates"""
        while self.is_running:
            try:
                if self.connected_clients:
                    # Send health updates every 5 seconds
                    health_data = await self._get_current_health()
                    await self.sio.emit("health-update", health_data, room="monitoring")

                await asyncio.sleep(5.0)

            except Exception as e:
                print(f"Real-time update error: {e}")
                await asyncio.sleep(10.0)

    async def start(self):
        """Start the integration server"""
        print("🚀 Starting Simple AI Cybersecurity Integration Server")

        self.is_running = True

        # Start real-time updates task
        asyncio.create_task(self._start_real_time_updates())

        # Start the server
        config = uvicorn.Config(
            self.socket_app,
            host=self.host,
            port=self.port,
            log_level="info"
        )
        server = uvicorn.Server(config)

        print(f"🌐 Server running on http://{self.host}:{self.port}")
        print(f"📊 API docs: http://{self.host}:{self.port}/docs")
        print(f"📡 Socket.IO: ws://{self.host}:{self.port}/socket.io/")

        await server.serve()

# Run the server
async def main():
    server = SimpleIntegrationServer()
    await server.start()

if __name__ == "__main__":
    asyncio.run(main())
