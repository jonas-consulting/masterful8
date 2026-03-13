const PASSWORD = 'masterful8';
const COOKIE_NAME = 'm8_auth';
const COOKIE_VALUE = '1a2b3c4d5e6f';

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((c) => {
    const [key, ...rest] = c.trim().split('=');
    cookies[key] = rest.join('=');
  });
  return cookies;
}

const LOGIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Login | The Masterful 8\u2122</title>
  <link rel="icon" type="image/svg+xml" href="/images/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;font-family:'Inter','Helvetica Neue',sans-serif;color:#f5f5f3}
    .login-wrap{width:100%;max-width:400px;padding:0 24px}
    .login-logo{text-align:center;margin-bottom:48px}
    .login-logo svg{height:48px;width:auto;opacity:.85}
    .login-title{font-family:'Playfair Display',Georgia,serif;font-size:1.75rem;font-weight:400;text-align:center;margin-bottom:8px;letter-spacing:-.01em}
    .login-sub{text-align:center;color:#6b6b6b;font-size:.875rem;margin-bottom:40px}
    .field{position:relative;margin-bottom:24px}
    .field input{width:100%;padding:14px 16px;background:#1a1a1a;border:1px solid #2d2d2d;color:#f5f5f3;font-size:1rem;font-family:inherit;outline:none;transition:border-color .2s}
    .field input:focus{border-color:#c9a962}
    .field input::placeholder{color:#6b6b6b}
    .login-btn{width:100%;padding:14px;background:#c9a962;color:#0a0a0a;border:none;font-size:.9rem;font-weight:600;font-family:inherit;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;transition:background .2s}
    .login-btn:hover{background:#d4bc7e}
    .error-msg{color:#a63344;font-size:.8rem;text-align:center;margin-top:16px;min-height:20px}
    .brand-line{position:fixed;bottom:32px;left:0;right:0;text-align:center;color:#2d2d2d;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase}
  </style>
</head>
<body>
  <div class="login-wrap">
    <div class="login-logo">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 48" height="48">
        <text x="0" y="36" font-family="'Playfair Display',Georgia,serif" font-size="32" font-weight="400" fill="#f5f5f3" letter-spacing="-0.02em">The Masterful</text>
        <text x="168" y="36" font-family="'Playfair Display',Georgia,serif" font-size="32" font-weight="500" fill="#c9a962"> 8</text>
        <text x="188" y="22" font-family="'Inter',sans-serif" font-size="10" fill="#c9a962">\u2122</text>
      </svg>
    </div>
    <h1 class="login-title">Welcome</h1>
    <p class="login-sub">Enter the password to continue</p>
    <form method="POST" action="/login">
      <div class="field">
        <input type="password" name="password" placeholder="Password" autofocus autocomplete="current-password">
      </div>
      <button type="submit" class="login-btn">Enter</button>
      <p class="error-msg" id="err">ERRORMSG</p>
    </form>
  </div>
  <p class="brand-line">The Masterful 8\u2122</p>
</body>
</html>`;

export default async function middleware(request) {
  const url = new URL(request.url);

  // Allow static assets through without auth
  if (
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/css/') ||
    url.pathname.startsWith('/js/') ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/robots.txt'
  ) {
    return undefined;
  }

  // Handle POST /login
  if (url.pathname === '/login' && request.method === 'POST') {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const pw = params.get('password');

    if (pw === PASSWORD) {
      const redirect = url.searchParams.get('redirect') || '/';
      return new Response(null, {
        status: 302,
        headers: {
          Location: redirect,
          'Set-Cookie': `${COOKIE_NAME}=${COOKIE_VALUE}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`,
        },
      });
    }

    // Wrong password — show login page with error
    const html = LOGIN_HTML.replace('ERRORMSG', 'Incorrect password').replace(
      'action="/login"',
      `action="/login?redirect=${encodeURIComponent(url.searchParams.get('redirect') || '/')}"`
    );
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Check auth cookie
  const cookies = parseCookies(request.headers.get('cookie'));
  if (cookies[COOKIE_NAME] === COOKIE_VALUE) {
    return undefined;
  }

  // Show login page (GET)
  if (url.pathname === '/login') {
    const html = LOGIN_HTML.replace('ERRORMSG', '').replace(
      'action="/login"',
      `action="/login?redirect=${encodeURIComponent(url.searchParams.get('redirect') || '/')}"`
    );
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Redirect to login
  return new Response(null, {
    status: 302,
    headers: {
      Location: `/login?redirect=${encodeURIComponent(url.pathname + url.search)}`,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
