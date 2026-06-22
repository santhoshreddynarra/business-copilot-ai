import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  // 1. Check Authorization header for Personal Access Token (PAT)
  const authHeader = request.headers.get('Authorization');
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const headerToken = authHeader.substring(7).trim();
    // Only accept it if it's not the string "undefined" or empty
    if (headerToken && headerToken !== 'undefined' && headerToken !== 'null') {
      token = headerToken;
    }
  }

  // 2. Fallback to session OAuth cookie
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get('github_oauth_token')?.value;
  }

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  try {
    // Append other query parameters to the GitHub URL
    const githubUrl = new URL(`https://api.github.com/${path}`);
    
    // Copy all query params except "path" to the target github URL
    searchParams.forEach((value, key) => {
      if (key !== 'path') {
        githubUrl.searchParams.set(key, value);
      }
    });

    const githubResponse = await fetch(githubUrl.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Business-Copilot-AI',
      },
    });

    if (!githubResponse.ok) {
      const errorData = await githubResponse.text();
      return NextResponse.json(
        { error: `GitHub API error: ${githubResponse.statusText}`, details: errorData },
        { status: githubResponse.status }
      );
    }

    const data = await githubResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Proxy request failed', details: error.message }, { status: 500 });
  }
}
