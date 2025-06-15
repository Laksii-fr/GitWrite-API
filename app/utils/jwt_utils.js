import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';
const JWT_EXPIRES_IN = '30d'; // adjust as needed

function generateToken(payload) {
  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET environment variable is not set, using fallback secret');
  }
  console.log('Generating JWT token with payload:', payload);
  return sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  try {
    if (!process.env.JWT_SECRET) {
      console.warn('JWT_SECRET environment variable is not set, using fallback secret');
    }
    const decoded = verify(token, JWT_SECRET);
    console.log('JWT token verified successfully:', { githubId: decoded.githubId });
    return decoded;
  } catch (err) {
    console.error('JWT token verification failed:', err.message);
    return null;
  }
}

export { generateToken, verifyToken };
