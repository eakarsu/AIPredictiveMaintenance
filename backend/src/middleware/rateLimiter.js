// Simple in-memory rate limiter
// aiRateLimiter: 20 requests per hour per user

const requestCounts = new Map(); // key: userId, value: { count, resetAt }

function createRateLimiter(maxRequests, windowMs) {
  return (req, res, next) => {
    const userId = req.user?.id || req.user?.userId || req.ip;
    const now = Date.now();
    const entry = requestCounts.get(userId);

    if (!entry || now > entry.resetAt) {
      requestCounts.set(userId, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
      });
    }

    entry.count++;
    next();
  };
}

// 20 requests per hour per user for AI endpoints
const aiRateLimiter = createRateLimiter(20, 60 * 60 * 1000);

module.exports = { aiRateLimiter };
