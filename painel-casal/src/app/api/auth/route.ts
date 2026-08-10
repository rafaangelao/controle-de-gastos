import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  const expected = process.env.PAINEL_PIN;

  if (!expected) {
    return NextResponse.json(
      { error: "PAINEL_PIN não configurado no servidor." },
      { status: 500 }
    );
  }
  if (pin !== expected) {
    return NextResponse.json({ error: "PIN incorreto." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("painel_auth", expected, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 ano
    path: "/",
  });
  return res;
}
