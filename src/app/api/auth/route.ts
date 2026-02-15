export async function POST(request: Request) {
  const { password } = await request.json();
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword) {
    // No password configured — allow access
    return Response.json({ ok: true });
  }

  if (password === sitePassword) {
    return Response.json({ ok: true });
  }

  return Response.json({ ok: false, error: 'Wrong password' }, { status: 401 });
}
