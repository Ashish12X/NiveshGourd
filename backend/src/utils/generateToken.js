// backend/src/utils/generateToken.js
import jwt from 'jsonwebtoken';

/**
 * Generates a signed JWT and sets an HTTP-only cookie on the response.
 * Also returns the token string.
 */
export const generateTokenAndSetCookie = (res, userId) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_change_immediately';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  const token = jwt.sign({ id: userId }, secret, {
    expiresIn,
  });

  const isProduction = process.env.NODE_ENV === 'production';

  // 7 days in milliseconds
  const cookieMaxAge = 7 * 24 * 60 * 60 * 1000;

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction, // HTTPS in production
    sameSite: isProduction ? 'none' : 'lax', // Allow cross-origin cookie if prod or lax if dev
    maxAge: cookieMaxAge,
    path: '/',
  });

  return token;
};

/**
 * Clears the auth cookie on logout
 */
export const clearAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0),
    path: '/',
  });
};
