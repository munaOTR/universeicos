import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
  },
};

export default function () {
  const url = __ENV.TARGET_URL || 'http://localhost:5173';
  
  const res = http.get(url);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
