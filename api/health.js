export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'SaaS Calculator API is running',
    environment: process.env.NODE_ENV || 'production'
  });
}