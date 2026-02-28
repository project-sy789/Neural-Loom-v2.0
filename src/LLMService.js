const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const https = require('https');

/**
 * LLMService - Connected directly to OpenClaw Node Gateway
 *
 * Automatically reads ~/.openclaw configs to locate the gateway
 * and authorization tokens, acting as a seamless bridge.
 */

class LLMService {
    constructor() {
        this.openclawConfig = this.loadOpenClawConfig();
    }

    /**
     * Auto-detects OpenClaw configuration from user's deep system files
     */
    loadOpenClawConfig() {
        const baseDir = path.join(os.homedir(), '.openclaw');
        const nodeConfigPath = path.join(baseDir, 'node.json');
        const openclawConfigPath = path.join(baseDir, 'openclaw.json');

        let host = '127.0.0.1';
        let port = 18789;
        let protocol = 'http';
        let token = '';

        try {
            if (fs.existsSync(nodeConfigPath)) {
                const nodeConf = JSON.parse(fs.readFileSync(nodeConfigPath, 'utf-8'));
                if (nodeConf.gateway) {
                    host = nodeConf.gateway.host || host;
                    port = nodeConf.gateway.port || port;
                    protocol = nodeConf.gateway.tls ? 'https' : 'http';
                }
            }

            if (fs.existsSync(openclawConfigPath)) {
                const globalConf = JSON.parse(fs.readFileSync(openclawConfigPath, 'utf-8'));
                if (globalConf.gateway && globalConf.gateway.auth && globalConf.gateway.auth.token) {
                    token = globalConf.gateway.auth.token;
                }
            }
        } catch (error) {
            console.error(`[LLMService] Failed to parse OpenClaw configs:`, error.message);
        }

        return {
            baseUrl: `${protocol}://${host}:${port}/v1/chat/completions`,
            token: token
        };
    }

    /**
     * Sends a prompt to the OpenClaw LLM and returns the response string.
     */
    async askLLM(prompt, options = {}) {
        const { baseUrl, token } = this.openclawConfig;
        console.log(`[LLMService -> OpenClaw] Prompting OpenClaw Engine...`);

        const requestPayload = JSON.stringify({
            model: options.model || "default", // OpenClaw standard default model map
            messages: [
                { role: "system", content: "You are the cognitive core of Neural Loom, an autonomous memory system." },
                { role: "user", content: prompt }
            ],
            temperature: options.temperature || 0.7,
            max_tokens: options.max_tokens
        });

        return new Promise((resolve, reject) => {
            const urlParts = new URL(baseUrl);
            const requestModule = urlParts.protocol === 'https:' ? https : http;

            const reqOptions = {
                hostname: urlParts.hostname,
                port: urlParts.port,
                path: urlParts.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Content-Length': Buffer.byteLength(requestPayload)
                }
            };

            const req = requestModule.request(reqOptions, (res) => {
                let responseBody = '';
                res.on('data', (chunk) => { responseBody += chunk; });

                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseBody);
                        if (res.statusCode >= 400) {
                            console.error(`[OpenClaw API Error]`, parsed);
                            return resolve(`[Error: OpenClaw returned ${res.statusCode}]`);
                        }

                        if (parsed.choices && parsed.choices.length > 0) {
                            resolve(parsed.choices[0].message.content);
                        } else {
                            resolve(responseBody);
                        }
                    } catch (e) {
                        console.error(`[OpenClaw Parse Error]`, e.message);
                        resolve(responseBody);
                    }
                });
            });

            req.on('error', (e) => {
                console.error(`[OpenClaw Connection Error] Make sure OpenClaw node is running! (${e.message})`);
                resolve(`[Error: OpenClaw Offline]`);
            });

            req.write(requestPayload);
            req.end();
        });
    }

    /**
     * Specific helper to ensure the LLM returns structured JSON
     */
    async askLLMForJSON(prompt) {
        const fullPrompt = `${prompt}\n\nPlease respond ONLY in valid JSON format, without markdown formatting or code blocks. Just output the pure JSON object/array.`;
        try {
            const responseText = await this.askLLM(fullPrompt, { temperature: 0.1 });

            // Advanced parsing to strip any markdown ```json if the model ignores the instruction
            let cleanJson = responseText.trim();
            if (cleanJson.startsWith('```json')) {
                cleanJson = cleanJson.substring(7);
            }
            if (cleanJson.startsWith('```')) {
                cleanJson = cleanJson.substring(3);
            }
            if (cleanJson.endsWith('```')) {
                cleanJson = cleanJson.substring(0, cleanJson.length - 3);
            }
            cleanJson = cleanJson.trim();

            return JSON.parse(cleanJson);
        } catch (err) {
            console.error(`[LLMService Error] Failed to parse JSON from OpenClaw: ${err.message}`);
            return null;
        }
    }
}

module.exports = new LLMService();
