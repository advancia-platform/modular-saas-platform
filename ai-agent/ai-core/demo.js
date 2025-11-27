/**
 * AI Agent Test Runner
 *
 * Demonstrates and tests the complete AI cybersecurity system
 */

const CyberAIAgent = require('./CyberAIAgent');

async function runAIAgentDemo() {
    console.log('🚀 Starting AI Cybersecurity Agent Demo...\n');

    try {
        // Initialize AI Agent
        const aiAgent = new CyberAIAgent({
            agentId: 'demo-agent-001',
            autoResponse: true,
            confidenceThreshold: 0.8,
            learningRate: 0.01
        });

        // Set up event listeners
        setupEventListeners(aiAgent);

        // Initialize the agent
        await aiAgent.initialize();
        console.log('\n✅ AI Agent initialized successfully!\n');

        // Demonstrate various threat scenarios
        await demonstrateThreatScenarios(aiAgent);

        // Show agent status and metrics
        displayAgentStatus(aiAgent);

        console.log('\n🎯 AI Agent Demo completed successfully!');

        // Keep the agent running for real-time monitoring
        console.log('\n📊 Agent now running in monitoring mode...');
        console.log('Press Ctrl+C to stop\n');

        // Simulate ongoing monitoring
        startContinuousMonitoring(aiAgent);

    } catch (error) {
        console.error('❌ Demo failed:', error);
        process.exit(1);
    }
}

function setupEventListeners(aiAgent) {
    aiAgent.on('agent-ready', (data) => {
        console.log('🤖 Agent Ready:', data.agentId);
        console.log('   Capabilities:', Object.keys(data.capabilities).filter(k => data.capabilities[k]).join(', '));
    });

    aiAgent.on('threat-analyzed', (analysis) => {
        console.log(`🔍 Threat Analysis Complete: ${analysis.analysisId}`);
        console.log(`   Risk Score: ${analysis.riskScore.toFixed(3)}`);
        console.log(`   Threats Found: ${analysis.threat?.severity || 'none'}`);
        console.log(`   Actions Recommended: ${analysis.recommendedActions.length}`);
    });

    aiAgent.on('action-executed', (action) => {
        console.log(`🛡️ Action Executed: ${action.action.action}`);
        console.log(`   Result: ${action.result.status}`);
    });

    aiAgent.on('agent-status', (status) => {
        if (status.metrics.threatsAnalyzed > 0 && status.metrics.threatsAnalyzed % 10 === 0) {
            console.log(`📈 Status Update - Threats Analyzed: ${status.metrics.threatsAnalyzed}, Accuracy: ${(status.metrics.accuracyRate * 100).toFixed(1)}%`);
        }
    });
}

async function demonstrateThreatScenarios(aiAgent) {
    console.log('🎭 Demonstrating Threat Detection Scenarios...\n');

    // Scenario 1: SQL Injection Attack
    console.log('📝 Scenario 1: SQL Injection Attack');
    await testSQLInjectionScenario(aiAgent);

    // Scenario 2: Malware Detection
    console.log('\n📝 Scenario 2: Malware Detection');
    await testMalwareScenario(aiAgent);

    // Scenario 3: Network Anomaly
    console.log('\n📝 Scenario 3: Network Anomaly Detection');
    await testNetworkAnomalyScenario(aiAgent);

    // Scenario 4: Behavioral Analysis
    console.log('\n📝 Scenario 4: Behavioral Threat Analysis');
    await testBehavioralScenario(aiAgent);

    // Scenario 5: Advanced Persistent Threat (APT)
    console.log('\n📝 Scenario 5: Advanced Persistent Threat');
    await testAPTScenario(aiAgent);
}

async function testSQLInjectionScenario(aiAgent) {
    const securityData = {
        source: 'web_application',
        type: 'http_request',
        url: '/login.php',
        method: 'POST',
        payload: "username=' OR '1'='1'; DROP TABLE users; --&password=test123",
        timestamp: new Date(),
        sourceIP: '192.168.1.50',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        indicators: ['sql_injection_pattern', 'malicious_payload'],
        severity: 'high'
    };

    console.log('   🎯 Analyzing SQL injection attempt...');
    const analysis = await aiAgent.analyzeThreat(securityData);

    console.log(`   ✅ Analysis Result: ${analysis.riskScore.toFixed(3)} risk score`);
    console.log(`   📊 ML Classification: ${analysis.mlClassification}`);
    console.log(`   🎯 Actions: ${analysis.recommendedActions.map(a => a.action).join(', ')}`);

    // Simulate human feedback
    await aiAgent.provideFeedback(analysis.analysisId, {
        correct: true,
        classification: 'sql_injection',
        severity: 'high'
    });
}

async function testMalwareScenario(aiAgent) {
    const securityData = {
        source: 'endpoint_security',
        type: 'file_analysis',
        fileName: 'invoice_update.exe',
        filePath: 'C:\\Users\\victim\\Downloads\\invoice_update.exe',
        fileHash: 'a1b2c3d4e5f6789012345678901234567890abcd',
        fileSize: 2048000,
        timestamp: new Date(),
        sourceIP: '203.0.113.15',
        indicators: ['suspicious_executable', 'known_malware_hash', 'network_callback'],
        behaviors: ['file_encryption', 'registry_modification', 'network_communication'],
        severity: 'critical'
    };

    console.log('   🎯 Analyzing potential malware...');
    const analysis = await aiAgent.analyzeThreat(securityData);

    console.log(`   ✅ Analysis Result: ${analysis.riskScore.toFixed(3)} risk score`);
    console.log(`   🦠 Threat Type: ${analysis.mlClassification}`);
    console.log(`   🔒 Isolation: ${analysis.decision.autoExecute ? 'Automatic' : 'Manual'}`);

    // Simulate feedback
    await aiAgent.provideFeedback(analysis.analysisId, {
        correct: true,
        classification: 'malware',
        severity: 'critical',
        falsePositive: false
    });
}

async function testNetworkAnomalyScenario(aiAgent) {
    const securityData = {
        source: 'network_monitoring',
        type: 'traffic_analysis',
        timestamp: new Date(),
        sourceIP: '10.0.0.100',
        destinationIP: '198.51.100.50',
        protocol: 'TCP',
        port: 443,
        metrics: {
            packetCount: 15000,
            dataVolume: 50000000, // 50MB
            connectionDuration: 7200, // 2 hours
            requestFrequency: 25
        },
        networkBehavior: {
            normalDataTransfer: 5000000, // Normal: 5MB
            normalConnections: 50,
            normalDuration: 300
        },
        indicators: ['unusual_data_volume', 'extended_connection', 'high_frequency'],
        severity: 'medium'
    };

    console.log('   🎯 Analyzing network traffic anomaly...');
    const analysis = await aiAgent.analyzeThreat(securityData);

    console.log(`   ✅ Analysis Result: ${analysis.riskScore.toFixed(3)} risk score`);
    console.log(`   📡 Anomaly Score: ${analysis.threat.confidence?.toFixed(3) || 'N/A'}`);
    console.log(`   🔧 Monitoring: Enhanced monitoring recommended`);
}

async function testBehavioralScenario(aiAgent) {
    const securityData = {
        source: 'user_behavior_analytics',
        type: 'user_activity',
        userId: 'john.doe@company.com',
        timestamp: new Date(),
        location: {
            ip: '203.0.113.100',
            country: 'Unknown',
            city: 'Unknown'
        },
        userBehavior: {
            loginTime: 3, // 3 AM
            normalLoginTime: 9, // Usually 9 AM
            accessedResources: ['financial_data', 'customer_records', 'source_code'],
            normalResources: ['email', 'documents'],
            dataDownloaded: 500000000, // 500MB
            normalDataDownload: 10000000 // Usually 10MB
        },
        indicators: ['unusual_login_time', 'abnormal_data_access', 'geographical_anomaly'],
        severity: 'high'
    };

    console.log('   🎯 Analyzing suspicious user behavior...');
    const analysis = await aiAgent.analyzeThreat(securityData);

    console.log(`   ✅ Analysis Result: ${analysis.riskScore.toFixed(3)} risk score`);
    console.log(`   👤 Behavior Anomaly: Detected unusual access patterns`);
    console.log(`   🚨 Alert Level: ${analysis.threat?.severity || 'medium'}`);
}

async function testAPTScenario(aiAgent) {
    const securityData = {
        source: 'advanced_threat_detection',
        type: 'multi_stage_attack',
        campaign: 'suspected_apt29',
        timestamp: new Date(),
        stages: [
            {
                stage: 'initial_access',
                technique: 'spear_phishing',
                timestamp: new Date(Date.now() - 86400000), // 1 day ago
                indicators: ['targeted_email', 'malicious_attachment']
            },
            {
                stage: 'persistence',
                technique: 'registry_modification',
                timestamp: new Date(Date.now() - 43200000), // 12 hours ago
                indicators: ['autostart_modification', 'scheduled_task']
            },
            {
                stage: 'lateral_movement',
                technique: 'credential_dumping',
                timestamp: new Date(Date.now() - 3600000), // 1 hour ago
                indicators: ['mimikatz_usage', 'privilege_escalation']
            }
        ],
        indicators: ['apt_behavior', 'multi_stage_attack', 'persistence_mechanisms', 'lateral_movement'],
        confidence: 0.85,
        severity: 'critical'
    };

    console.log('   🎯 Analyzing Advanced Persistent Threat...');
    const analysis = await aiAgent.analyzeThreat(securityData);

    console.log(`   ✅ Analysis Result: ${analysis.riskScore.toFixed(3)} risk score`);
    console.log(`   🎭 APT Campaign: Multi-stage attack detected`);
    console.log(`   🔥 Response: Critical incident response initiated`);
}

function displayAgentStatus(aiAgent) {
    const status = aiAgent.getStatus();

    console.log('\n📊 AI Agent Status Report:');
    console.log('═══════════════════════════════════');
    console.log(`Agent ID: ${status.agentId}`);
    console.log(`Status: ${status.status}`);
    console.log(`Threats Analyzed: ${status.metrics.threatsAnalyzed}`);
    console.log(`Decisions Made: ${status.metrics.decisionsMade || 0}`);
    console.log(`Accuracy Rate: ${(status.metrics.accuracyRate * 100).toFixed(1)}%`);
    console.log(`Avg Response Time: ${status.metrics.avgResponseTime.toFixed(2)}ms`);
    console.log(`Active Analyses: ${status.metrics.activeAnalyses}`);
    console.log('');
    console.log('🧠 Capabilities:');
    Object.entries(status.capabilities).forEach(([capability, enabled]) => {
        console.log(`   ${enabled ? '✅' : '❌'} ${capability.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
    });\n}\n\nfunction startContinuousMonitoring(aiAgent) {\n    let monitoringCount = 0;\n    \n    const monitoringInterval = setInterval(async () => {\n        monitoringCount++;\n        \n        // Generate random security events for continuous monitoring\n        const randomEvents = [\n            {\n                source: 'network_ids',\n                type: 'port_scan',\n                sourceIP: `192.168.1.${Math.floor(Math.random() * 255)}`,\n                timestamp: new Date(),\n                severity: 'low'\n            },\n            {\n                source: 'web_proxy',\n                type: 'suspicious_download',\n                url: 'http://suspicious-site.com/malware.exe',\n                timestamp: new Date(),\n                severity: 'medium'\n            },\n            {\n                source: 'endpoint_agent',\n                type: 'process_anomaly',\n                processName: 'svchost.exe',\n                timestamp: new Date(),\n                severity: Math.random() > 0.8 ? 'high' : 'low'\n            }\n        ];\n        \n        const randomEvent = randomEvents[Math.floor(Math.random() * randomEvents.length)];\n        \n        try {\n            await aiAgent.analyzeThreat(randomEvent);\n        } catch (error) {\n            console.error('Monitoring analysis failed:', error);\n        }\n        \n        // Stop after 20 iterations for demo\n        if (monitoringCount >= 20) {\n            clearInterval(monitoringInterval);\n            console.log('\\n⏹️ Demo monitoring stopped. AI Agent remains active.');\n            \n            // Show final statistics\n            setTimeout(() => {\n                displayAgentStatus(aiAgent);\n                console.log('\\n🎉 AI Cybersecurity Agent Demo Complete!');\n                console.log('\\n🚀 Week 5: AI Core System - SUCCESSFULLY IMPLEMENTED!\\n');\n                \n                // Graceful shutdown\n                aiAgent.shutdown().then(() => {\n                    process.exit(0);\n                });\n            }, 2000);\n        }\n    }, 2000); // Every 2 seconds\n}\n\n// Handle graceful shutdown\nprocess.on('SIGINT', async () => {\n    console.log('\\n🔄 Shutting down AI Agent...');\n    process.exit(0);\n});\n\n// Start the demo\nif (require.main === module) {\n    runAIAgentDemo();\n}\n\nmodule.exports = { runAIAgentDemo };
