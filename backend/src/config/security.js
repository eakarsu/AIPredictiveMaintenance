function jwtSecret() {
  const value = String(process.env.JWT_SECRET || '');
  if (value.length < 32 || /replace|change|example|generate|secret-key-2024|default.jwt.secret/i.test(value)) {
    throw new Error('JWT_SECRET must be a non-placeholder value of at least 32 characters.');
  }
  return value;
}
module.exports = { jwtSecret };
