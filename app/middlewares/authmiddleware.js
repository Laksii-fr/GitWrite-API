import { verifyToken } from '../utils/jwt_utils.js';

export const authMiddleware = (req, res, next) => {
  console.log('Auth middleware called for:', req.method, req.path);
  
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Invalid or missing Authorization header');
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing or invalid format. Expected: Bearer <token>',
        error: 'MISSING_AUTH_HEADER'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Token extracted, length:', token.length);
    
    // Verify the token
    const decoded = verifyToken(token);
    console.log('Token verification result:', decoded ? 'SUCCESS' : 'FAILED');
    
    if (!decoded) {
      console.log('Token verification failed - returning 401');
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'INVALID_TOKEN'
      });
    }

    // Add githubId to req.user
    req.user = {
      githubId: decoded.githubId
    };
    
    console.log('Auth middleware successful, githubId:', decoded.githubId);
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: 'AUTH_ERROR'
    });
  }
}; 