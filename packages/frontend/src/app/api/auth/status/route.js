import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
  const cookieStore = await cookies();
  const oauthToken = cookieStore.get('github_oauth_token')?.value;

  if (!oauthToken) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${oauthToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Business-Copilot-AI',
      },
      next: { revalidate: 300 } // Cache profile for 5 mins
    });

    if (!userResponse.ok) {
      // Token expired or revoked
      cookieStore.delete('github_oauth_token');
      return NextResponse.json({ authenticated: false, error: 'invalid_token' });
    }

    const userData = await userResponse.json();
    return NextResponse.json({
      authenticated: true,
      authMethod: 'oauth',
      user: {
        login: userData.login,
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url,
        bio: userData.bio,
        public_repos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
      },
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false, error: 'verification_failed' });
  }
}

export async function POST(request) {
  const cookieStore = await cookies();
  cookieStore.delete('github_oauth_token');
  return NextResponse.json({ success: true, authenticated: false });
}
