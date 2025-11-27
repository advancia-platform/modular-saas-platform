/**
 * AI Knowledge Base
 *
 * Maintains a comprehensive database of security intelligence, threat patterns,
 * attack signatures, and mitigation strategies for intelligent decision making.
 */

const EventEmitter = require('events');

class KnowledgeBase extends EventEmitter {
    constructor(config = {}) {
        super();

        this.config = {
            updateInterval: config.updateInterval || 3600000, // 1 hour
            maxEntries: config.maxEntries || 1000000,
            confidenceThreshold: config.confidenceThreshold || 0.7,
            ...config
        };

        // Knowledge repositories
        this.threatIntelligence = new Map();
        this.attackPatterns = new Map();
        this.vulnerabilities = new Map();
        this.mitigationStrategies = new Map();
        this.iocDatabase = new Map(); // Indicators of Compromise
        this.behaviorProfiles = new Map();

        // Statistics
        this.statistics = {
            totalEntries: 0,
            lastUpdate: null,
            queriesProcessed: 0,
            matchesFound: 0
        };

        // Built-in threat intelligence
        this.builtInIntelligence = {
            malwareFamilies: [
                {
                    name: 'Mirai',
                    type: 'botnet',
                    category: 'iot_malware',
                    indicators: ['telnet_brute_force', 'default_credentials', 'ddos_capability'],
                    severity: 'high',
                    description: 'IoT botnet malware targeting default credentials'
                },
                {
                    name: 'WannaCry',
                    type: 'ransomware',
                    category: 'cryptomalware',
                    indicators: ['smb_exploitation', 'file_encryption', 'ransom_note'],
                    severity: 'critical',
                    description: 'Ransomware exploiting SMB vulnerabilities'
                },
                {
                    name: 'Zeus',
                    type: 'banking_trojan',
                    category: 'financial_malware',
                    indicators: ['keylogger', 'form_grabbing', 'credential_theft'],
                    severity: 'high',
                    description: 'Banking trojan targeting financial credentials'
                }
            ],
            attackTechniques: [
                {
                    id: 'T1190',
                    name: 'Exploit Public-Facing Application',
                    tactic: 'Initial Access',
                    description: 'Adversaries may attempt to take advantage of a weakness in an Internet-facing computer or program',
                    indicators: ['web_application_attack', 'vulnerability_exploitation', 'code_injection'],
                    mitigation: ['input_validation', 'web_application_firewall', 'regular_patching']
                },
                {
                    id: 'T1059',
                    name: 'Command and Scripting Interpreter',
                    tactic: 'Execution',
                    description: 'Adversaries may abuse command and script interpreters to execute commands',
                    indicators: ['command_line_execution', 'script_execution', 'powershell_usage'],
                    mitigation: ['command_line_monitoring', 'script_blocking', 'privilege_restriction']
                }
            ],
            vulnerabilityPatterns: [
                {
                    cve: 'CVE-2021-44228',
                    name: 'Log4Shell',
                    severity: 'critical',
                    type: 'remote_code_execution',
                    description: 'Apache Log4j2 JNDI features do not protect against attacker controlled LDAP',
                    indicators: ['log4j_usage', 'jndi_lookup', 'ldap_request'],
                    affected: ['apache_log4j', 'java_applications']
                },
                {
                    cve: 'CVE-2017-0144',
                    name: 'EternalBlue',
                    severity: 'critical',
                    type: 'remote_code_execution',
                    description: 'Microsoft SMBv1 server vulnerability',
                    indicators: ['smb_v1_usage', 'ms17_010_exploit', 'network_propagation'],
                    affected: ['windows_smb', 'legacy_systems']
                }
            ]
        };
    }

    async initialize() {
        console.log('📚 Initializing Knowledge Base...');

        // Load built-in intelligence
        await this.loadBuiltInIntelligence();

        // Load external threat feeds
        await this.loadThreatFeeds();

        // Initialize update processes
        this.startUpdateProcesses();

        console.log('✅ Knowledge Base ready with', this.statistics.totalEntries, 'entries');
    }

    /**
     * Find matches in knowledge base for given security data
     */
    async findMatches(securityData) {
        const startTime = Date.now();
        this.statistics.queriesProcessed++;

        try {
            const matches = [];

            // Search threat intelligence
            const threatMatches = await this.searchThreatIntelligence(securityData);
            matches.push(...threatMatches);

            // Search attack patterns
            const patternMatches = await this.searchAttackPatterns(securityData);
            matches.push(...patternMatches);

            // Search vulnerabilities
            const vulnMatches = await this.searchVulnerabilities(securityData);
            matches.push(...vulnMatches);

            // Search IOCs
            const iocMatches = await this.searchIOCs(securityData);
            matches.push(...iocMatches);

            // Search behavior profiles
            const behaviorMatches = await this.searchBehaviorProfiles(securityData);
            matches.push(...behaviorMatches);

            // Filter and rank matches
            const rankedMatches = this.rankMatches(matches);

            if (rankedMatches.length > 0) {
                this.statistics.matchesFound++;
            }

            const result = {
                matches: rankedMatches,
                queryTime: Date.now() - startTime,
                totalSearched: this.statistics.totalEntries,
                confidence: this.calculateMatchConfidence(rankedMatches)
            };

            this.emit('knowledge-query', {
                securityData: securityData,
                matches: rankedMatches.length,
                processingTime: result.queryTime
            });

            return rankedMatches;

        } catch (error) {
            console.error('Knowledge base search failed:', error);
            return [];
        }
    }

    /**
     * Search threat intelligence database
     */
    async searchThreatIntelligence(data) {
        const matches = [];

        for (const [threatId, threat] of this.threatIntelligence) {
            const similarity = this.calculateSimilarity(data, threat);

            if (similarity > this.config.confidenceThreshold) {
                matches.push({
                    type: 'threat_intelligence',
                    id: threatId,
                    threat: threat,
                    confidence: similarity,
                    relevance: this.calculateRelevance(data, threat),
                    source: 'knowledge_base'
                });
            }
        }

        return matches;
    }

    /**
     * Search attack pattern database
     */
    async searchAttackPatterns(data) {
        const matches = [];

        for (const [patternId, pattern] of this.attackPatterns) {
            const indicators = data.indicators || [];
            const patternIndicators = pattern.indicators || [];

            const matchingIndicators = indicators.filter(ind =>
                patternIndicators.includes(ind)
            );

            if (matchingIndicators.length > 0) {
                const confidence = matchingIndicators.length / patternIndicators.length;

                if (confidence > 0.3) { // Lower threshold for pattern matching
                    matches.push({
                        type: 'attack_pattern',
                        id: patternId,
                        pattern: pattern,
                        confidence: confidence,
                        matchingIndicators: matchingIndicators,
                        source: 'mitre_attack'
                    });
                }
            }
        }

        return matches;
    }

    /**
     * Search vulnerability database
     */
    async searchVulnerabilities(data) {
        const matches = [];

        // Check for vulnerability indicators in the data
        for (const [vulnId, vuln] of this.vulnerabilities) {
            if (data.software || data.services || data.versions) {
                const affected = vuln.affected || [];
                const dataServices = [
                    ...(data.software || []),
                    ...(data.services || []),
                    ...(data.versions || [])
                ].map(s => s.toLowerCase());

                const matchingServices = affected.filter(service =>
                    dataServices.some(ds => ds.includes(service.toLowerCase()))
                );

                if (matchingServices.length > 0) {
                    matches.push({
                        type: 'vulnerability',
                        id: vulnId,
                        vulnerability: vuln,
                        confidence: 0.8,
                        affectedServices: matchingServices,
                        source: 'vulnerability_database'
                    });
                }
            }
        }

        return matches;
    }

    /**
     * Search Indicators of Compromise
     */
    async searchIOCs(data) {
        const matches = [];

        for (const [iocId, ioc] of this.iocDatabase) {
            const match = this.matchIOC(data, ioc);

            if (match.confidence > 0.5) {
                matches.push({
                    type: 'ioc',
                    id: iocId,
                    ioc: ioc,
                    confidence: match.confidence,
                    matchType: match.type,
                    source: 'threat_intelligence'
                });
            }
        }

        return matches;
    }

    /**
     * Search behavior profiles
     */
    async searchBehaviorProfiles(data) {
        const matches = [];

        if (data.behaviorData) {
            for (const [profileId, profile] of this.behaviorProfiles) {
                const similarity = this.compareBehaviorProfiles(data.behaviorData, profile);

                if (similarity > 0.7) {
                    matches.push({
                        type: 'behavior_profile',
                        id: profileId,
                        profile: profile,
                        confidence: similarity,
                        source: 'behavior_analysis'
                    });
                }
            }
        }

        return matches;
    }

    /**
     * Rank and filter matches by relevance and confidence
     */
    rankMatches(matches) {
        // Sort by confidence and relevance
        return matches
            .sort((a, b) => {
                const scoreA = (a.confidence * 0.7) + ((a.relevance || 0.5) * 0.3);
                const scoreB = (b.confidence * 0.7) + ((b.relevance || 0.5) * 0.3);
                return scoreB - scoreA;
            })
            .filter(match => match.confidence > this.config.confidenceThreshold)
            .slice(0, 20); // Limit to top 20 matches
    }

    /**
     * Add new threat intelligence to the knowledge base
     */
    async addThreatIntelligence(threat) {
        const threatId = `threat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const enrichedThreat = {
            ...threat,
            id: threatId,
            timestamp: new Date(),
            source: threat.source || 'manual',
            confidence: threat.confidence || 0.8
        };

        this.threatIntelligence.set(threatId, enrichedThreat);
        this.statistics.totalEntries++;

        console.log(`📥 Added threat intelligence: ${threat.name || threatId}`);

        this.emit('intelligence-added', {
            id: threatId,
            type: 'threat_intelligence',
            threat: enrichedThreat
        });

        return threatId;
    }

    /**
     * Update threat intelligence feeds from external sources
     */
    async updateThreatIntelligence() {
        console.log('🔄 Updating threat intelligence feeds...');

        try {
            // Simulate fetching from multiple threat intelligence sources
            const feeds = [
                { name: 'AlienVault OTX', url: 'https://otx.alienvault.com/', active: true },
                { name: 'MISP', url: 'https://www.misp-project.org/', active: true },
                { name: 'Abuse.ch', url: 'https://abuse.ch/', active: true },
                { name: 'VirusTotal', url: 'https://www.virustotal.com/', active: true }
            ];

            for (const feed of feeds) {
                if (feed.active) {
                    await this.fetchThreatFeed(feed);
                }
            }

            this.statistics.lastUpdate = new Date();

            console.log('✅ Threat intelligence feeds updated');

        } catch (error) {
            console.error('❌ Threat intelligence update failed:', error);
        }
    }

    /**
     * Load built-in threat intelligence
     */
    async loadBuiltInIntelligence() {
        console.log('📖 Loading built-in threat intelligence...');

        // Load malware families
        for (const malware of this.builtInIntelligence.malwareFamilies) {
            const id = `malware-${malware.name.toLowerCase()}`;
            this.threatIntelligence.set(id, {
                ...malware,
                id: id,
                timestamp: new Date(),
                source: 'builtin'
            });
        }

        // Load attack techniques
        for (const technique of this.builtInIntelligence.attackTechniques) {
            this.attackPatterns.set(technique.id, {
                ...technique,
                timestamp: new Date(),
                source: 'mitre_attack'
            });
        }

        // Load vulnerability patterns
        for (const vuln of this.builtInIntelligence.vulnerabilityPatterns) {
            this.vulnerabilities.set(vuln.cve, {
                ...vuln,
                timestamp: new Date(),
                source: 'nvd'
            });
        }

        this.statistics.totalEntries +=
            this.builtInIntelligence.malwareFamilies.length +
            this.builtInIntelligence.attackTechniques.length +
            this.builtInIntelligence.vulnerabilityPatterns.length;

        console.log('✅ Built-in intelligence loaded');
    }

    /**
     * Load external threat feeds
     */
    async loadThreatFeeds() {
        console.log('🌐 Loading external threat feeds...');

        // Simulate loading external feeds
        await this.simulateExternalFeeds();

        console.log('✅ External feeds loaded');
    }

    /**
     * Simulate external threat feed loading
     */
    async simulateExternalFeeds() {
        // Simulate IOCs
        const sampleIOCs = [
            {
                type: 'ip_address',
                value: '192.168.1.100',
                threat_type: 'malware_c2',
                confidence: 0.9,
                first_seen: new Date(Date.now() - 86400000), // 1 day ago
                last_seen: new Date()
            },
            {
                type: 'domain',
                value: 'malicious-example.com',
                threat_type: 'phishing',
                confidence: 0.85,
                first_seen: new Date(Date.now() - 172800000), // 2 days ago
                last_seen: new Date()
            },
            {
                type: 'file_hash',
                value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                threat_type: 'malware',
                confidence: 0.95,
                first_seen: new Date(Date.now() - 259200000), // 3 days ago
                last_seen: new Date()
            }
        ];

        for (const ioc of sampleIOCs) {
            const id = `ioc-${ioc.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            this.iocDatabase.set(id, {
                ...ioc,
                id: id,
                timestamp: new Date(),
                source: 'external_feed'
            });
        }

        this.statistics.totalEntries += sampleIOCs.length;
    }\n\n    // Helper methods\n    calculateSimilarity(data1, data2) {\n        // Simple similarity calculation (would be more sophisticated in production)\n        let score = 0;\n        let comparisons = 0;\n        \n        if (data1.type && data2.type) {\n            score += data1.type === data2.type ? 1 : 0;\n            comparisons++;\n        }\n        \n        if (data1.category && data2.category) {\n            score += data1.category === data2.category ? 1 : 0;\n            comparisons++;\n        }\n        \n        if (data1.indicators && data2.indicators) {\n            const commonIndicators = data1.indicators.filter(ind => \n                data2.indicators.includes(ind)\n            ).length;\n            score += commonIndicators / Math.max(data1.indicators.length, data2.indicators.length);\n            comparisons++;\n        }\n        \n        return comparisons > 0 ? score / comparisons : 0;\n    }\n\n    calculateRelevance(data, threat) {\n        // Calculate contextual relevance\n        let relevance = 0.5; // Base relevance\n        \n        // Recent threats are more relevant\n        if (threat.timestamp) {\n            const daysSinceUpdate = (Date.now() - threat.timestamp.getTime()) / (1000 * 60 * 60 * 24);\n            relevance += Math.max(0, (30 - daysSinceUpdate) / 30 * 0.3);\n        }\n        \n        // High confidence threats are more relevant\n        if (threat.confidence) {\n            relevance += threat.confidence * 0.2;\n        }\n        \n        return Math.min(1, relevance);\n    }\n\n    calculateMatchConfidence(matches) {\n        if (matches.length === 0) return 0;\n        \n        const totalConfidence = matches.reduce((sum, match) => sum + match.confidence, 0);\n        return totalConfidence / matches.length;\n    }\n\n    matchIOC(data, ioc) {\n        const dataStr = JSON.stringify(data).toLowerCase();\n        const iocValue = ioc.value.toLowerCase();\n        \n        if (dataStr.includes(iocValue)) {\n            return {\n                confidence: ioc.confidence || 0.8,\n                type: 'exact_match'\n            };\n        }\n        \n        // Check for partial matches\n        if (ioc.type === 'domain' && data.domains) {\n            const domainMatch = data.domains.some(domain => \n                domain.toLowerCase().includes(iocValue)\n            );\n            if (domainMatch) {\n                return {\n                    confidence: (ioc.confidence || 0.8) * 0.8,\n                    type: 'partial_match'\n                };\n            }\n        }\n        \n        return { confidence: 0, type: 'no_match' };\n    }\n\n    compareBehaviorProfiles(behavior1, behavior2) {\n        // Simple behavior similarity calculation\n        return Math.random() * 0.5 + 0.25; // Placeholder\n    }\n\n    async fetchThreatFeed(feed) {\n        // Simulate fetching from external threat intelligence feed\n        console.log(`  📡 Fetching from ${feed.name}...`);\n        \n        // Simulate network delay\n        await new Promise(resolve => setTimeout(resolve, 100));\n        \n        // Add some simulated intelligence\n        const simulated = {\n            name: `Threat from ${feed.name}`,\n            type: 'malware',\n            confidence: 0.8,\n            source: feed.name,\n            timestamp: new Date()\n        };\n        \n        const id = await this.addThreatIntelligence(simulated);\n        console.log(`  ✅ Added threat: ${id}`);\n    }\n\n    startUpdateProcesses() {\n        // Schedule regular updates\n        setInterval(async () => {\n            await this.updateThreatIntelligence();\n        }, this.config.updateInterval);\n    }\n\n    async save() {\n        console.log('💾 Saving knowledge base...');\n        // Implementation would save to persistent storage\n    }\n\n    getStatistics() {\n        return {\n            ...this.statistics,\n            repositories: {\n                threatIntelligence: this.threatIntelligence.size,
                attackPatterns: this.attackPatterns.size,
                vulnerabilities: this.vulnerabilities.size,
                iocDatabase: this.iocDatabase.size,
                behaviorProfiles: this.behaviorProfiles.size\n            }\n        };\n    }\n}\n\nmodule.exports = KnowledgeBase;
