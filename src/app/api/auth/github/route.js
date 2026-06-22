import { NextResponse } from 'next/server';

export async function GET(request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    const url = new URL('/', request.url);
    url.searchParams.set('error', 'missing_oauth_config');
    return NextResponse.redirect(url);
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user%20repo`;

  return NextResponse.redirect(githubAuthUrl);
}
