import http from 'k6/http';
import ws from 'k6/ws';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const calculationTime = new Trend('calculation_duration');
const collaborationLatency = new Trend('collaboration_latency');
const pageLoadTime = new Trend('page_load_time');

// Test configuration for different scenarios
export const options = {
  scenarios: {
    // Baseline load test - 100 concurrent users
    baseline_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
    
    // Stress test - 1000+ concurrent users
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 500 },
        { duration: '5m', target: 1000 },
        { duration: '2m', target: 1500 }, // Peak stress
        { duration: '3m', target: 0 },
      ],
      gracefulRampDown: '60s',
    },

    // Spike test - sudden traffic surge
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '10s', target: 500 }, // Sudden spike
        { duration: '2m', target: 500 },
        { duration: '10s', target: 50 }, // Quick drop
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
    },

    // Collaboration test - WebSocket connections
    collaboration_test: {
      executor: 'constant-vus',
      vus: 50,
      duration: '10m',
    },
  },
  
  thresholds: {
    // Performance requirements
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
    calculation_duration: ['p(95)<3000'], // Calculations under 3s
    collaboration_latency: ['p(95)<500'], // Real-time updates under 500ms
    page_load_time: ['p(95)<3000'],    // Page loads under 3s
    errors: ['rate<0.05'],             // Overall error rate under 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
const API_URL = __ENV.API_URL || 'http://localhost:3000';

export function setup() {
  // Test data setup
  return {
    testCalculations: [
      {
        currentPrice: 99,
        customers: 100,
        churnRate: 5,
        competitorPrice: 120,
        cac: 300,
      },
      {
        currentPrice: 149,
        customers: 250,
        churnRate: 3.5,
        competitorPrice: 179,
        cac: 520,
      },
      {
        currentPrice: 299,
        customers: 1000,
        churnRate: 2.1,
        competitorPrice: 399,
        cac: 1200,
      },
    ],
  };
}

export default function(data) {
  // Randomly select scenario based on current executor
  const scenario = __ENV.SCENARIO || 'mixed';
  
  switch (scenario) {
    case 'page_load':
      testPageLoad();
      break;
    case 'calculation':
      testCalculationPerformance(data);
      break;
    case 'collaboration':
      testCollaboration();
      break;
    case 'ai_insights':
      testAIInsights(data);
      break;
    case 'export':
      testPDFExport(data);
      break;
    default:
      // Mixed scenario - random user behavior
      const action = Math.random();
      if (action < 0.3) {
        testPageLoad();
      } else if (action < 0.6) {
        testCalculationPerformance(data);
      } else if (action < 0.8) {
        testCollaboration();
      } else if (action < 0.9) {
        testAIInsights(data);
      } else {
        testPDFExport(data);
      }
  }

  sleep(Math.random() * 3 + 1); // Random think time 1-4 seconds
}

function testPageLoad() {
  group('Page Load Performance', () => {
    const startTime = Date.now();
    
    // Load main page
    const response = http.get(BASE_URL);
    
    const loadTime = Date.now() - startTime;
    pageLoadTime.add(loadTime);
    
    const pageLoadOk = check(response, {
      'page loaded successfully': (r) => r.status === 200,
      'page load time < 3s': () => loadTime < 3000,
      'page contains calculator': (r) => r.body.includes('data-testid="calculator-container"'),
    });
    
    errorRate.add(!pageLoadOk);

    // Load static assets
    const assetRequests = [
      '/assets/index.css',
      '/assets/index.js',
      '/favicon.svg',
    ];

    assetRequests.forEach(asset => {
      const assetResponse = http.get(`${BASE_URL}${asset}`);
      check(assetResponse, {
        [`asset ${asset} loaded`]: (r) => r.status === 200,
        [`asset ${asset} cached`]: (r) => r.headers['Cache-Control'] !== undefined,
      });
    });
  });
}

function testCalculationPerformance(data) {
  group('Calculation Performance', () => {
    // Select random test data
    const testData = data.testCalculations[Math.floor(Math.random() * data.testCalculations.length)];
    
    const startTime = Date.now();
    
    const response = http.post(`${API_URL}/api/calculate`, JSON.stringify(testData), {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    const duration = Date.now() - startTime;
    calculationTime.add(duration);
    
    const calculationOk = check(response, {
      'calculation completed': (r) => r.status === 200,
      'calculation time < 3s': () => duration < 3000,
      'results contain MRR': (r) => {
        try {
          const results = JSON.parse(r.body);
          return results.mrr !== undefined;
        } catch {
          return false;
        }
      },
      'results contain LTV': (r) => {
        try {
          const results = JSON.parse(r.body);
          return results.ltv !== undefined;
        } catch {
          return false;
        }
      },
    });
    
    errorRate.add(!calculationOk);

    // Test advanced calculations
    if (Math.random() < 0.3) {
      const advancedData = {
        ...testData,
        advanced: true,
        marketSize: 1000000,
        growthRate: 15,
        competitorAnalysis: true,
      };

      const advancedResponse = http.post(`${API_URL}/api/calculate/advanced`, 
        JSON.stringify(advancedData), {
        headers: { 'Content-Type': 'application/json' },
      });

      check(advancedResponse, {
        'advanced calculation completed': (r) => r.status === 200,
        'includes competitive analysis': (r) => {
          try {
            const results = JSON.parse(r.body);
            return results.competitiveAnalysis !== undefined;
          } catch {
            return false;
          }
        },
      });
    }
  });
}

function testCollaboration() {
  group('Real-time Collaboration', () => {
    const roomId = `room_${Math.random().toString(36).substr(2, 9)}`;
    const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
    
    const startTime = Date.now();
    
    const wsUrl = `ws://localhost:3000/socket.io/?EIO=4&transport=websocket`;
    
    ws.connect(wsUrl, {
      tags: { scenario: 'collaboration' },
    }, function(socket) {
      socket.on('open', () => {
        // Join collaboration room
        socket.send(JSON.stringify({
          type: 'join-room',
          data: {
            roomId,
            userId,
            userInfo: {
              name: `Test User ${userId}`,
              avatar: '/avatars/test.jpg'
            }
          }
        }));
      });

      socket.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          const latency = Date.now() - startTime;
          collaborationLatency.add(latency);
          
          check(message, {
            'valid collaboration message': () => message.type !== undefined,
            'collaboration latency < 500ms': () => latency < 500,
          });
        } catch (e) {
          errorRate.add(1);
        }
      });

      // Simulate user interactions
      const interactions = [
        { type: 'field-change', field: 'currentPrice', value: '99' },
        { type: 'field-change', field: 'customers', value: '100' },
        { type: 'calculation-start', data: {} },
        { type: 'cursor-move', x: 150, y: 200 },
      ];

      interactions.forEach((interaction, index) => {
        setTimeout(() => {
          socket.send(JSON.stringify({
            type: interaction.type,
            data: interaction
          }));
        }, index * 1000);
      });

      sleep(5); // Keep connection alive for 5 seconds
    });
  });
}

function testAIInsights(data) {
  group('AI Insights Performance', () => {
    const testData = data.testCalculations[0];
    
    const startTime = Date.now();
    
    const response = http.post(`${API_URL}/api/ai/insights`, JSON.stringify({
      calculationInputs: testData,
      industry: 'b2b-saas',
      context: 'pricing_optimization'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      timeout: '30s', // AI requests can take longer
    });
    
    const duration = Date.now() - startTime;
    
    const aiOk = check(response, {
      'AI insights generated': (r) => r.status === 200,
      'AI response time acceptable': () => duration < 15000, // 15s max for AI
      'contains recommendations': (r) => {
        try {
          const insights = JSON.parse(r.body);
          return Array.isArray(insights.recommendations) && insights.recommendations.length > 0;
        } catch {
          return false;
        }
      },
      'has confidence score': (r) => {
        try {
          const insights = JSON.parse(r.body);
          return typeof insights.confidence === 'number';
        } catch {
          return false;
        }
      },
    });
    
    errorRate.add(!aiOk);

    // Test AI service resilience
    if (Math.random() < 0.1) {
      // Test with invalid data to check error handling
      const invalidResponse = http.post(`${API_URL}/api/ai/insights`, JSON.stringify({
        calculationInputs: { invalid: 'data' }
      }), {
        headers: { 'Content-Type': 'application/json' },
      });

      check(invalidResponse, {
        'handles invalid input gracefully': (r) => r.status === 400,
        'returns error message': (r) => {
          try {
            const error = JSON.parse(r.body);
            return error.message !== undefined;
          } catch {
            return false;
          }
        },
      });
    }
  });
}

function testPDFExport(data) {
  group('PDF Export Performance', () => {
    const testData = {
      calculations: data.testCalculations[0],
      template: 'professional',
      branding: {
        companyName: 'Test Company',
        logo: null,
      }
    };
    
    const startTime = Date.now();
    
    const response = http.post(`${API_URL}/api/export/pdf`, JSON.stringify(testData), {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: '60s', // PDF generation can take time
    });
    
    const duration = Date.now() - startTime;
    
    const exportOk = check(response, {
      'PDF export successful': (r) => r.status === 200,
      'export time reasonable': () => duration < 30000, // 30s max
      'returns download URL': (r) => {
        try {
          const result = JSON.parse(r.body);
          return result.downloadUrl !== undefined;
        } catch {
          return false;
        }
      },
    });
    
    errorRate.add(!exportOk);

    // Test different templates
    const templates = ['professional', 'executive', 'technical'];
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    if (randomTemplate !== 'professional') {
      const templateResponse = http.post(`${API_URL}/api/export/pdf`, JSON.stringify({
        ...testData,
        template: randomTemplate
      }), {
        headers: { 'Content-Type': 'application/json' },
      });

      check(templateResponse, {
        [`${randomTemplate} template works`]: (r) => r.status === 200,
      });
    }
  });
}

export function handleSummary(data) {
  return {
    'performance-report.json': JSON.stringify(data, null, 2),
    'performance-summary.txt': createTextSummary(data),
  };
}

function createTextSummary(data) {
  const summary = [];
  
  summary.push('=== SaaS Pricing Calculator Performance Test Results ===\n');
  
  // Overall metrics
  summary.push('OVERALL PERFORMANCE:');
  summary.push(`Total Requests: ${data.metrics.http_reqs.values.count}`);
  summary.push(`Failed Requests: ${data.metrics.http_req_failed.values.count} (${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%)`);
  summary.push(`Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  summary.push(`95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  summary.push('');
  
  // Specific features
  if (data.metrics.calculation_duration) {
    summary.push('CALCULATION PERFORMANCE:');
    summary.push(`Average: ${data.metrics.calculation_duration.values.avg.toFixed(2)}ms`);
    summary.push(`95th Percentile: ${data.metrics.calculation_duration.values['p(95)'].toFixed(2)}ms`);
    summary.push('');
  }
  
  if (data.metrics.collaboration_latency) {
    summary.push('COLLABORATION PERFORMANCE:');
    summary.push(`Average Latency: ${data.metrics.collaboration_latency.values.avg.toFixed(2)}ms`);
    summary.push(`95th Percentile: ${data.metrics.collaboration_latency.values['p(95)'].toFixed(2)}ms`);
    summary.push('');
  }
  
  if (data.metrics.page_load_time) {
    summary.push('PAGE LOAD PERFORMANCE:');
    summary.push(`Average: ${data.metrics.page_load_time.values.avg.toFixed(2)}ms`);
    summary.push(`95th Percentile: ${data.metrics.page_load_time.values['p(95)'].toFixed(2)}ms`);
    summary.push('');
  }
  
  // Thresholds
  summary.push('THRESHOLD COMPLIANCE:');
  Object.entries(data.root_group.checks).forEach(([name, check]) => {
    const status = check.fails === 0 ? 'PASS' : 'FAIL';
    summary.push(`${status}: ${name} (${check.passes}/${check.passes + check.fails})`);
  });
  
  return summary.join('\n');
}