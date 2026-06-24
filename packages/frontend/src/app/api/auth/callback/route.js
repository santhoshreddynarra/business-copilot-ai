import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    const url = new URL('/', request.url);
    url.searchParams.set('error', 'no_code_provided');
    return NextResponse.redirect(url);
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const url = new URL('/', request.url);
    url.searchParams.set('error', 'missing_oauth_config');
    return NextResponse.redirect(url);
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      const url = new URL('/', request.url);
      url.searchParams.set('error', tokenData.error_description || tokenData.error);
      return NextResponse.redirect(url);
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      const url = new URL('/', request.url);
      url.searchParams.set('error', 'no_access_token');
      return NextResponse.redirect(url);
    }

    // Set the token in secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'github_oauth_token',
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    const url = new URL('/', request.url);
    url.searchParams.set('error', 'token_exchange_failed');
    return NextResponse.redirect(url);
  }
}
