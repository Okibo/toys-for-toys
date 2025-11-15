import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  status: string;
  timestamp?: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error' });
  }

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
