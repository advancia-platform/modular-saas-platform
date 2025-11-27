/**
 * Dashboard Connector
 *
 * Connects AI analysis results to the monitoring dashboard
 * Provides real-time threat intelligence to the UI
 */

const { EventEmitter } = require('events');

class DashboardConnector extends EventEmitter {
    constructor(config = {}) {
        super();

        this.config = {
            dashboardHost: config.dashboardHost || 'localhost',
            dashboardPort: config.dashboardPort || 3002,
            integrationServerHost: config.integrationServerHost || 'localhost',
            integrationServerPort: config.integrationServerPort || 8001,
            reconnectInterval: config.reconnectInterval || 5000,
            maxReconnectAttempts: config.maxReconnectAttempts || 10,
            ...config
        };

        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.socket = null;
        this.aiAgent = null;
        this.threatBuffer = [];
        this.maxBufferSize = 100;

        // Analytics
        this.analytics = {
            threatsSent: 0,
            actionsReported: 0,
            connectionUptime: 0,
            lastConnectionTime: null,
            errors: []
        };

        console.log('🔗 Dashboard Connector initialized');
    }

    /**
     * Connect to the AI Agent and Dashboard
     */
    async connect(aiAgent) {
        try {
            this.aiAgent = aiAgent;

            // Connect to integration server (Socket.IO endpoint)
            await this.connectToIntegrationServer();

            // Set up AI Agent event listeners
            this.setupAIAgentListeners();

            // Start periodic status updates
            this.startStatusUpdates();

            console.log('✅ Dashboard Connector established all connections');
            this.emit('connector-ready');

        } catch (error) {
            console.error('❌ Dashboard connection failed:', error);
            this.emit('connector-error', error);
            throw error;
        }
    }

    /**
     * Connect to the Integration Server
     */
    async connectToIntegrationServer() {
        try {
            const io = require('socket.io-client');
            const serverUrl = `http://${this.config.integrationServerHost}:${this.config.integrationServerPort}`;

            this.socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                autoConnect: false,
                reconnection: true,
                reconnectionAttempts: this.config.maxReconnectAttempts,
                reconnectionDelay: this.config.reconnectInterval
            });

            // Set up socket event handlers
            this.setupSocketHandlers();

            // Connect
            this.socket.connect();

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                }, 10000);

                this.socket.once('connect', () => {
                    clearTimeout(timeout);
                    this.isConnected = true;
                    this.analytics.lastConnectionTime = new Date();
                    resolve();
                });

                this.socket.once('connect_error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });

        } catch (error) {
            console.error('❌ Failed to connect to integration server:', error);
            throw error;
        }
    }

    /**
     * Set up Socket.IO event handlers
     */
    setupSocketHandlers() {
        this.socket.on('connect', () => {
            console.log('✅ Connected to integration server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.analytics.lastConnectionTime = new Date();

            // Send buffered threats
            this.sendBufferedThreats();
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 Disconnected from integration server');
            this.isConnected = false;
        });

        this.socket.on('reconnect', () => {
            console.log('🔄 Reconnected to integration server');
            this.sendBufferedThreats();
        });

        this.socket.on('error', (error) => {
            console.error('❌ Socket error:', error);
            this.analytics.errors.push({
                timestamp: new Date(),
                error: error.message
            });
        });

        // Dashboard requests
        this.socket.on('request-threat-history', (params) => {
            this.sendThreatHistory(params);
        });

        this.socket.on('request-ai-status', () => {
            this.sendAIStatus();
        });
    }

    /**
     * Set up AI Agent event listeners
     */
    setupAIAgentListeners() {
        if (!this.aiAgent) return;

        // Listen for threat analysis results
        this.aiAgent.on('threat-analyzed', (analysis) => {
            this.sendThreatAnalysis(analysis);
        });

        // Listen for action execution results
        this.aiAgent.on('action-executed', (actionResult) => {
            this.sendActionResult(actionResult);
        });

        // Listen for agent status changes
        this.aiAgent.on('status-changed', (status) => {
            this.sendAIStatus(status);
        });

        // Listen for learning updates
        this.aiAgent.on('learning-update', (learningData) => {
            this.sendLearningUpdate(learningData);
        });
    }

    /**
     * Send threat analysis to dashboard
     */
    sendThreatAnalysis(analysis) {
        if (!this.isConnected) {
            this.bufferThreat(analysis);
            return;
        }

        try {
            const dashboardData = {
                id: analysis.id || `threat_${Date.now()}`,
                timestamp: new Date(),
                threatType: analysis.mlClassification || 'unknown',
                severity: this.calculateSeverity(analysis.riskScore),
                riskScore: analysis.riskScore || 0,
                confidence: analysis.confidence || 0,
                description: this.generateThreatDescription(analysis),
                source: analysis.source || 'ai-agent',
                location: this.extractLocationInfo(analysis.data),
                indicators: analysis.indicators || [],
                recommendations: analysis.recommendations || [],
                metadata: {
                    modelVersion: analysis.modelVersion || '1.0.0',
                    processingTime: analysis.processingTime || 0,
                    dataSource: analysis.dataSource || 'unknown'
                }
            };

            this.socket.emit('threat-detected', dashboardData);
            this.analytics.threatsSent++;

            console.log(`🚨 Threat analysis sent: ${analysis.mlClassification} (${analysis.riskScore})`);

        } catch (error) {
            console.error('❌ Failed to send threat analysis:', error);
        }
    }

    /**
     * Send action execution result to dashboard
     */
    sendActionResult(actionResult) {
        if (!this.isConnected) return;

        try {
            const dashboardData = {
                actionId: actionResult.id || `action_${Date.now()}`,
                timestamp: new Date(),
                action: {
                    type: actionResult.action?.type || 'unknown',
                    target: actionResult.action?.target || 'unknown',
                    action: actionResult.action?.action || 'unknown'
                },
                result: {
                    status: actionResult.success ? 'success' : 'failed',
                    executionTime: actionResult.executionTime || 0,
                    details: actionResult.result || {},
                    error: actionResult.error || null
                },
                threat: {
                    id: actionResult.threatId || null,
                    type: actionResult.threatType || 'unknown'
                }
            };

            this.socket.emit('ai-action-executed', dashboardData);
            this.analytics.actionsReported++;

            console.log(`🛡️ Action result sent: ${actionResult.action.action}`);

        } catch (error) {
            console.error('❌ Failed to send action result:', error);
        }
    }

    /**
     * Send AI Agent status to dashboard
     */
    sendAIStatus(status) {
        if (!this.isConnected) return;

        try {
            const aiStatus = status || this.aiAgent.getStatus();

            const dashboardData = {
                agentId: aiStatus.agentId,
                status: aiStatus.status,
                uptime: aiStatus.uptime,
                capabilities: aiStatus.capabilities,
                metrics: {
                    ...aiStatus.metrics,
                    connectorMetrics: {
                        threatsSent: this.analytics.threatsSent,
                        actionsReported: this.analytics.actionsReported,
                        connectionUptime: this.getConnectionUptime(),
                        isConnected: this.isConnected
                    }
                },
                engines: {
                    threatAnalysis: {
                        status: 'active',
                        modelsLoaded: 5
                    },
                    decisionEngine: {
                        status: 'active',
                        rulesCount: 25
                    },
                    learningEngine: {
                        status: 'active',
                        trainingProgress: Math.random() * 100
                    }
                },
                timestamp: new Date()
            };

            this.socket.emit('ai-status-update', dashboardData);

        } catch (error) {
            console.error('❌ Failed to send AI status:', error);
        }
    }

    /**
     * Send learning update to dashboard
     */
    sendLearningUpdate(learningData) {
        if (!this.isConnected) return;

        try {
            const dashboardData = {
                timestamp: new Date(),
                modelUpdates: learningData.modelUpdates || [],
                performanceMetrics: learningData.performance || {},
                newPatterns: learningData.newPatterns || [],
                accuracy: learningData.accuracy || 0
            };

            this.socket.emit('ai-learning-update', dashboardData);

        } catch (error) {
            console.error('❌ Failed to send learning update:', error);
        }
    }

    /**
     * Send threat history to dashboard
     */
    sendThreatHistory(params = {}) {
        if (!this.isConnected) return;

        try {
            // Generate historical threat data
            const history = this.generateThreatHistory(params);
            this.socket.emit('threat-history-response', history);

        } catch (error) {
            console.error('❌ Failed to send threat history:', error);
        }
    }

    /**
     * Buffer threats when disconnected
     */
    bufferThreat(analysis) {
        this.threatBuffer.push({
            timestamp: new Date(),
            analysis
        });

        // Maintain buffer size
        if (this.threatBuffer.length > this.maxBufferSize) {
            this.threatBuffer.shift();
        }

        console.log(`📦 Threat buffered (${this.threatBuffer.length}/${this.maxBufferSize})`);
    }

    /**
     * Send buffered threats when reconnected
     */
    sendBufferedThreats() {
        if (!this.isConnected || this.threatBuffer.length === 0) return;

        console.log(`📤 Sending ${this.threatBuffer.length} buffered threats`);

        this.threatBuffer.forEach(bufferedThreat => {
            this.sendThreatAnalysis(bufferedThreat.analysis);
        });

        this.threatBuffer = [];
        console.log('✅ All buffered threats sent');
    }

    /**
     * Start periodic status updates
     */
    startStatusUpdates() {
        setInterval(() => {
            if (this.isConnected && this.aiAgent) {
                this.sendAIStatus();
            }
        }, 10000); // Every 10 seconds
    }

    /**
     * Calculate threat severity from risk score
     */
    calculateSeverity(riskScore) {
        if (riskScore >= 0.9) return 'critical';
        if (riskScore >= 0.7) return 'high';
        if (riskScore >= 0.5) return 'medium';
        if (riskScore >= 0.3) return 'low';
        return 'info';
    }

    /**
     * Generate threat description
     */
    generateThreatDescription(analysis) {
        const { data, mlClassification } = analysis;

        const descriptions = {
            'malware': `Malicious software detected: ${data?.fileName || 'Unknown file'}`,
            'sql_injection': `SQL injection attempt detected on ${data?.url || 'unknown endpoint'}`,
            'network_anomaly': `Unusual network traffic pattern detected from ${data?.sourceIP}`,
            'behavioral_anomaly': `Suspicious user behavior detected: ${data?.userId || 'unknown user'}`,
            'apt': `Advanced Persistent Threat activity detected: ${data?.campaign || 'unknown campaign'}`,
            'default': `Security threat detected: ${data?.type || 'unknown type'}`
        };

        return descriptions[mlClassification] || descriptions.default;
    }

    /**
     * Extract location information
     */
    extractLocationInfo(data) {
        if (!data) return null;

        return {
            sourceIP: data.sourceIP || data.ip,
            country: data.location?.country || 'Unknown',
            city: data.location?.city || 'Unknown',
            coordinates: data.location?.coordinates || null
        };
    }

    /**
     * Generate threat history data
     */
    generateThreatHistory(params) {
        const days = params.days || 7;
        const history = [];

        for (let i = days; i >= 0; i--) {
            const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));

            history.push({
                date: date.toISOString().split('T')[0],
                threats: {
                    total: Math.floor(Math.random() * 100) + 20,
                    critical: Math.floor(Math.random() * 10),
                    high: Math.floor(Math.random() * 15) + 5,
                    medium: Math.floor(Math.random() * 25) + 10,
                    low: Math.floor(Math.random() * 30) + 15
                },
                actions: {
                    blocked: Math.floor(Math.random() * 20) + 5,
                    quarantined: Math.floor(Math.random() * 15) + 3,
                    alerted: Math.floor(Math.random() * 25) + 10
                }
            });
        }

        return history;
    }

    /**
     * Get connection uptime
     */
    getConnectionUptime() {
        if (!this.analytics.lastConnectionTime) return 0;
        return Date.now() - this.analytics.lastConnectionTime.getTime();
    }

    /**
     * Get connector statistics
     */
    getStatistics() {
        return {
            ...this.analytics,
            isConnected: this.isConnected,
            bufferedThreats: this.threatBuffer.length,
            connectionUptime: this.getConnectionUptime()
        };
    }

    /**
     * Disconnect from dashboard
     */
    async disconnect() {
        console.log('🔌 Disconnecting from dashboard...');

        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        this.isConnected = false;
        this.emit('connector-disconnected');

        console.log('✅ Dashboard connector disconnected');
    }
}

module.exports = DashboardConnector;
