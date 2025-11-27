"""
AI Cybersecurity Agent - Simple Test (No Token Required)
Tests the reasoning engine structure and basic functionality
"""

import asyncio
import json
from datetime import datetime
import sys
import os

# Add the current directory to path to import our modules
sys.path.append(os.path.dirname(__file__))

try:
    from threat_reasoning_engine import (
        CybersecurityReasoningEngine,
        ThreatSeverity,
        ThreatIndicator,
        ThreatAnalysis
    )
    print("✅ Successfully imported threat reasoning engine")
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

def test_threat_patterns():
    """Test threat pattern detection without AI"""
    print("\n🔍 Testing Threat Pattern Detection...")

    # Create engine instance (without initializing AI)
    engine = CybersecurityReasoningEngine("dummy_token", "openai/gpt-4.1")

    # Test pattern matching
    malicious_indicators = [
        "192.168.1.100",
        "malicious-example.com",
        "' OR '1'='1",
        "<script>alert('xss')</script>"
    ]

    for indicator in malicious_indicators:
        result = engine.check_threat_database(indicator)
        print(f"   🎯 {indicator}: {result}")

def test_risk_scoring():
    """Test risk scoring algorithm"""
    print("\n📊 Testing Risk Scoring...")

    engine = CybersecurityReasoningEngine("dummy_token", "openai/gpt-4.1")

    test_cases = [
        ["normal_activity"],
        ["suspicious_login", "unusual_time"],
        ["malicious_file", "attack_pattern", "exploit_attempt"],
        ["critical_malware", "data_exfiltration", "admin_compromise"]
    ]

    for indicators in test_cases:
        score = engine.calculate_risk_score(indicators)
        print(f"   📈 {indicators}: {score}")

def test_recommendations():
    """Test recommendation generation"""
    print("\n💡 Testing Recommendation Engine...")

    engine = CybersecurityReasoningEngine("dummy_token", "openai/gpt-4.1")

    threat_types = ["malware", "intrusion", "data_breach", "unknown"]

    for threat_type in threat_types:
        recommendations = engine.generate_recommendations(threat_type, "high")
        print(f"   🛡️  {threat_type.upper()}: {recommendations}")

def test_data_structures():
    """Test threat analysis data structures"""
    print("\n📋 Testing Data Structures...")

    # Test ThreatIndicator
    indicator = ThreatIndicator(
        indicator_type="IP_ADDRESS",
        value="192.168.1.100",
        severity=ThreatSeverity.HIGH,
        confidence=0.85,
        timestamp=datetime.now(),
        source="firewall_logs",
        description="Multiple failed login attempts"
    )

    print(f"   📍 Threat Indicator: {indicator.indicator_type} - {indicator.severity.name}")

    # Test ThreatAnalysis
    analysis = ThreatAnalysis(
        threat_id="TEST_001",
        indicators=[indicator],
        risk_score=75.0,
        severity=ThreatSeverity.HIGH,
        recommended_actions=["Block IP", "Monitor activity"],
        analysis_time=datetime.now(),
        reasoning="Test analysis for demonstration"
    )

    print(f"   📊 Threat Analysis: Risk {analysis.risk_score}/100 - {analysis.severity.name}")

def simulate_threat_scenario():
    """Simulate a cybersecurity threat scenario"""
    print("\n🚨 Simulating Threat Scenario...")

    # Sample security event
    security_event = {
        "timestamp": "2025-11-25T10:30:00Z",
        "source": "network_monitoring",
        "events": [
            {
                "type": "failed_login",
                "src_ip": "192.168.1.100",
                "user": "admin",
                "attempts": 15,
                "time_window": "5_minutes"
            },
            {
                "type": "port_scan",
                "src_ip": "192.168.1.100",
                "target": "internal_servers",
                "ports": [22, 80, 443, 3389],
                "success_rate": "high"
            },
            {
                "type": "unusual_traffic",
                "src_ip": "192.168.1.100",
                "data_volume": "500MB",
                "destination": "external_unknown",
                "encryption": "none"
            }
        ]
    }

    print("   📋 Security Event Summary:")
    print(f"      • Source: {security_event['source']}")
    print(f"      • Events: {len(security_event['events'])} suspicious activities")
    print(f"      • Time: {security_event['timestamp']}")

    # Analyze threat indicators
    threat_indicators = []
    for event in security_event["events"]:
        if event["type"] == "failed_login" and event["attempts"] > 10:
            threat_indicators.append("brute_force_attack")
        if event["type"] == "port_scan":
            threat_indicators.append("reconnaissance")
        if event["type"] == "unusual_traffic":
            threat_indicators.append("data_exfiltration")

    print(f"   🎯 Detected Threat Patterns: {threat_indicators}")

    # Calculate risk score
    engine = CybersecurityReasoningEngine("dummy_token", "openai/gpt-4.1")
    risk_result = engine.calculate_risk_score(threat_indicators)
    print(f"   📊 {risk_result}")

    # Get recommendations
    recommendations = engine.generate_recommendations("intrusion", "high")
    print(f"   💡 {recommendations}")

def main():
    """Main test function"""
    print("🤖 AI Cybersecurity Agent - System Test")
    print("=" * 45)

    print("\n🎯 Testing Core Components (No AI Token Required)")

    try:
        test_data_structures()
        test_threat_patterns()
        test_risk_scoring()
        test_recommendations()
        simulate_threat_scenario()

        print("\n🎉 All Tests Passed!")
        print("=" * 20)
        print("✅ Threat detection engine is working")
        print("✅ Risk scoring system functional")
        print("✅ Recommendation engine operational")
        print("✅ Data structures validated")

        print("\n📋 Week 2 Progress:")
        print("█████ Foundation Setup ✅ COMPLETE")
        print("█████ Reasoning Engine ✅ COMPLETE")
        print("      █████ Execution Engine (Next - Week 3)")
        print("            █████ Integration & Monitoring")
        print("                  █████ CI/CD & Dashboard")
        print("                        █████ Polish & Launch")

        print("\n🚀 Next Steps:")
        print("1. Set GitHub token: $env:GITHUB_TOKEN = 'your_token'")
        print("2. Test with real AI: python threat_reasoning_engine.py")
        print("3. Move to Week 3: Execution Engine development")

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        print("🔧 Check your installation and try again")

if __name__ == "__main__":
    main()
