"""
AI Cybersecurity Agent - Threat Detection Engine
Week 2: Reasoning Engine Implementation

This module provides the core reasoning capabilities for cybersecurity threat detection.
"""

import asyncio
import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum

# Agent Framework imports (install with: pip install agent-framework-azure-ai --pre)
try:
    from agent_framework import ChatAgent
    from agent_framework.openai import OpenAIChatClient
    from openai import AsyncOpenAI
except ImportError:
    print("⚠️  Agent Framework not installed. Run: pip install agent-framework-azure-ai --pre")
    exit(1)

# Threat severity levels
class ThreatSeverity(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

@dataclass
class ThreatIndicator:
    """Represents a cybersecurity threat indicator"""
    indicator_type: str
    value: str
    severity: ThreatSeverity
    confidence: float
    timestamp: datetime
    source: str
    description: str

@dataclass
class ThreatAnalysis:
    """Results from threat analysis"""
    threat_id: str
    indicators: List[ThreatIndicator]
    risk_score: float
    severity: ThreatSeverity
    recommended_actions: List[str]
    analysis_time: datetime
    reasoning: str

class CybersecurityReasoningEngine:
    """
    Core reasoning engine for cybersecurity threat detection and analysis
    """

    def __init__(self, github_token: str, model_id: str = "openai/gpt-4.1"):
        """
        Initialize the cybersecurity reasoning engine

        Args:
            github_token: GitHub Personal Access Token for models access
            model_id: AI model to use (default: gpt-4.1 for reasoning)
        """
        self.github_token = github_token
        self.model_id = model_id
        self.agent = None
        self.threat_patterns = self._load_threat_patterns()

    async def initialize(self):
        """Initialize the AI agent"""
        openai_client = AsyncOpenAI(
            base_url="https://models.github.ai/inference",
            api_key=self.github_token,
        )

        chat_client = OpenAIChatClient(
            async_client=openai_client,
            model_id=self.model_id
        )

        self.agent = ChatAgent(
            chat_client=chat_client,
            name="CybersecurityAnalyst",
            instructions=self._get_cybersecurity_instructions(),
            tools=[
                self.analyze_network_pattern,
                self.check_threat_database,
                self.calculate_risk_score,
                self.generate_recommendations
            ]
        )

    def _get_cybersecurity_instructions(self) -> str:
        """Get specialized instructions for cybersecurity analysis"""
        return """
        You are an expert cybersecurity analyst AI specialized in:

        1. THREAT DETECTION: Identify malicious patterns, anomalies, and indicators of compromise
        2. RISK ASSESSMENT: Calculate threat severity and business impact
        3. PATTERN ANALYSIS: Recognize attack patterns, TTPs (Tactics, Techniques, Procedures)
        4. INCIDENT RESPONSE: Recommend appropriate security actions

        ANALYSIS APPROACH:
        - Use multi-layered threat detection methodology
        - Apply MITRE ATT&CK framework for threat classification
        - Consider false positive reduction in your analysis
        - Provide actionable, prioritized recommendations
        - Include confidence levels in your assessments

        RESPONSE FORMAT:
        - Always provide reasoning for your analysis
        - Include specific threat indicators
        - Calculate numerical risk scores (0-100)
        - Suggest immediate and long-term actions

        Remember: Speed and accuracy are critical in cybersecurity.
        """

    def _load_threat_patterns(self) -> Dict[str, Any]:
        """Load predefined threat patterns and IOCs"""
        return {
            "malicious_ips": [
                "192.168.1.100",  # Example suspicious IPs
                "10.0.0.50",
            ],
            "suspicious_domains": [
                "malicious-example.com",
                "phishing-site.net"
            ],
            "attack_patterns": {
                "sql_injection": [
                    "' OR '1'='1",
                    "UNION SELECT",
                    "DROP TABLE"
                ],
                "xss": [
                    "<script>",
                    "javascript:",
                    "onload="
                ],
                "command_injection": [
                    "; cat /etc/passwd",
                    "&& whoami",
                    "| nc"
                ]
            },
            "behavioral_patterns": {
                "unusual_login_times": "03:00-05:00",
                "multiple_failed_logins": 5,
                "data_exfiltration_threshold": "100MB"
            }
        }

    async def analyze_threat(self, security_data: Dict[str, Any]) -> ThreatAnalysis:
        """
        Analyze security data for threats

        Args:
            security_data: Dictionary containing logs, network data, etc.

        Returns:
            ThreatAnalysis object with findings and recommendations
        """
        if not self.agent:
            await self.initialize()

        # Prepare analysis prompt
        analysis_prompt = f"""
        CYBERSECURITY THREAT ANALYSIS REQUEST

        Security Data to Analyze:
        {json.dumps(security_data, indent=2)}

        Please perform comprehensive threat analysis including:
        1. Identify all threat indicators
        2. Calculate risk score (0-100)
        3. Determine threat severity
        4. Provide reasoning for your analysis
        5. Recommend specific actions

        Focus on: malware detection, network intrusions, data exfiltration,
        unauthorized access, and behavioral anomalies.
        """

        print("🔍 Analyzing security data for threats...")
        analysis_result = ""

        # Get AI analysis
        async for chunk in self.agent.run_stream(analysis_prompt):
            if chunk.text:
                analysis_result += chunk.text

        # Parse and structure the results
        threat_analysis = self._parse_analysis_result(analysis_result, security_data)

        return threat_analysis

    def _parse_analysis_result(self, analysis_text: str, original_data: Dict) -> ThreatAnalysis:
        """Parse AI analysis into structured ThreatAnalysis object"""

        # Extract key information from AI response
        # This is a simplified parser - in production, use more robust parsing
        lines = analysis_text.split('\n')

        indicators = []
        risk_score = 50.0  # Default moderate risk
        severity = ThreatSeverity.MEDIUM
        recommendations = []

        for line in lines:
            if 'risk score' in line.lower() or 'risk:' in line.lower():
                # Extract numerical risk score
                import re
                numbers = re.findall(r'\d+', line)
                if numbers:
                    risk_score = float(numbers[0])

            if 'recommendation' in line.lower() or 'action' in line.lower():
                recommendations.append(line.strip())

        # Determine severity based on risk score
        if risk_score >= 80:
            severity = ThreatSeverity.CRITICAL
        elif risk_score >= 60:
            severity = ThreatSeverity.HIGH
        elif risk_score >= 30:
            severity = ThreatSeverity.MEDIUM
        else:
            severity = ThreatSeverity.LOW

        return ThreatAnalysis(
            threat_id=f"THREAT_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            indicators=indicators,
            risk_score=risk_score,
            severity=severity,
            recommended_actions=recommendations if recommendations else ["Monitor for additional indicators"],
            analysis_time=datetime.now(),
            reasoning=analysis_text
        )

    # Tool functions for the AI agent
    def analyze_network_pattern(self, network_data: str) -> str:
        """Analyze network traffic patterns for anomalies"""
        # Simulate network analysis
        return f"Network analysis: {len(network_data)} bytes analyzed. No immediate threats detected."

    def check_threat_database(self, indicator: str) -> str:
        """Check threat intelligence database for known indicators"""
        # Check against our threat patterns
        for pattern_type, patterns in self.threat_patterns.items():
            if isinstance(patterns, list) and indicator in patterns:
                return f"MATCH: {indicator} found in {pattern_type} threat database"
        return f"No match found for indicator: {indicator}"

    def calculate_risk_score(self, indicators: List[str]) -> str:
        """Calculate numerical risk score based on threat indicators"""
        base_score = 10
        for indicator in indicators:
            if any(malicious in indicator for malicious in ['malicious', 'attack', 'exploit']):
                base_score += 30
            if any(suspicious in indicator for suspicious in ['suspicious', 'anomaly', 'unusual']):
                base_score += 15

        final_score = min(100, base_score)
        return f"Calculated risk score: {final_score}/100"

    def generate_recommendations(self, threat_type: str, severity: str) -> str:
        """Generate security recommendations based on threat analysis"""
        recommendations = {
            "malware": [
                "Isolate affected systems immediately",
                "Run full antivirus scan",
                "Update threat signatures",
                "Monitor for lateral movement"
            ],
            "intrusion": [
                "Change all compromised passwords",
                "Review access logs",
                "Implement additional authentication",
                "Audit network access"
            ],
            "default": [
                "Increase monitoring",
                "Review security policies",
                "Update security controls",
                "Document incident"
            ]
        }

        recs = recommendations.get(threat_type.lower(), recommendations["default"])
        return f"Recommended actions: {', '.join(recs)}"

# Example usage and testing
async def main():
    """Example usage of the Cybersecurity Reasoning Engine"""

    # Check for GitHub token
    github_token = os.getenv("GITHUB_TOKEN")
    if not github_token:
        print("❌ Please set GITHUB_TOKEN environment variable")
        print("Get your token at: https://github.com/settings/tokens")
        return

    # Initialize the reasoning engine
    engine = CybersecurityReasoningEngine(github_token)

    # Example security data to analyze
    sample_security_data = {
        "timestamp": "2025-11-25T10:15:00Z",
        "source": "firewall_logs",
        "events": [
            {
                "src_ip": "192.168.1.100",
                "dst_ip": "10.0.0.1",
                "port": 22,
                "action": "BLOCK",
                "reason": "Multiple failed SSH attempts"
            },
            {
                "user": "admin",
                "action": "login_failure",
                "attempts": 7,
                "time_window": "5_minutes"
            }
        ],
        "network_traffic": {
            "unusual_outbound": "150MB to unknown_server.com",
            "time": "03:30 AM"
        }
    }

    print("🤖 Starting Cybersecurity Reasoning Engine...")
    print("=" * 50)

    try:
        # Perform threat analysis
        analysis = await engine.analyze_threat(sample_security_data)

        # Display results
        print(f"\n📊 THREAT ANALYSIS RESULTS")
        print(f"Threat ID: {analysis.threat_id}")
        print(f"Risk Score: {analysis.risk_score}/100")
        print(f"Severity: {analysis.severity.name}")
        print(f"Analysis Time: {analysis.analysis_time}")

        print(f"\n🔍 AI REASONING:")
        print(analysis.reasoning)

        print(f"\n📋 RECOMMENDED ACTIONS:")
        for i, action in enumerate(analysis.recommended_actions, 1):
            print(f"{i}. {action}")

    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        print("\n💡 Make sure you have:")
        print("1. Set GITHUB_TOKEN environment variable")
        print("2. Installed agent framework: pip install agent-framework-azure-ai --pre")

if __name__ == "__main__":
    asyncio.run(main())
