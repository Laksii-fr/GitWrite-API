import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;

const JWT_SECRET = process.env.JWT_SECRET; // use .env in real apps
const JWT_EXPIRES_IN = '1h'; // adjust as needed

function generateToken(payload) {
  console.log('JWT_SECRET:', process.env.JWT_SECRET);
  return sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  try {
    return verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export { generateToken, verifyToken };
