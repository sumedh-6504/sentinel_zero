import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

export const verifySupabaseToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Allow browser preflight requests to pass through
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization;
  console.log('Auth Header present:', !!authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Missing or invalid Bearer token');
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log('Supabase Auth verification failed:', error?.message);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};
