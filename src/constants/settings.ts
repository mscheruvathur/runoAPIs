import path from 'path';

export const CORS_ALLOWED_ORIGINS = ['http://localhost:3000', 'https://antmascot.com', 'https://antmascot.in'];
export const CORS_ALLOWED_HEADERS = [
    'x-real-ip',
    'x-forwarded-for',
    'host',
    'x-nginx-proxy',
    'connection',
    'sec-ch-ua',
    'accept',
    'authorization',
    'sec-ch-ua-mobile',
    'user-agent',
    'sec-ch-ua-platform',
    'origin',
    'sec-fetch-site',
    'sec-fetch-mode',
    'sec-fetch-dest',
    'referer',
    'accept-encoding',
    'accept-language',
    'refresh',
    'content-type'
];
export const CORS_ALLOWED_METHODS = [];

const JWT_PUBLIC_KEY_PATH = path.join(__dirname, '../', '../', 'keys', 'public.pem');
const JWT_PRIVATE_KEY_PATH = path.join(__dirname, '../', '../', 'keys', 'private.pem');

const JWT_ALGORITHM = 'RS256';

export { JWT_PUBLIC_KEY_PATH, JWT_PRIVATE_KEY_PATH, JWT_ALGORITHM };
