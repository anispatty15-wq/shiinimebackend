import type { NextFunction, Request, Response } from 'express';
import { firebaseAdmin } from '../config/firebase';
import { sendError } from './error';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string | null;
    firebaseToken?: string;
  };
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authorization header is required');
    }

    const token = authHeader.replace('Bearer ', '').trim();

    if (process.env.USE_MOCK_AUTH === 'true') {
      const mockUid = req.headers['x-user-uid'] as string | undefined;
      if (!mockUid) {
        return sendError(res, 401, 'UNAUTHORIZED', 'Mock auth requires x-user-uid header');
      }

      req.user = { uid: mockUid, email: `${mockUid}@mock.local`, firebaseToken: token };
      return next();
    }

    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      firebaseToken: token,
    };
    return next();
  } catch (error) {
    return sendError(res, 401, 'INVALID_TOKEN', 'Invalid or expired Firebase token');
  }
};
