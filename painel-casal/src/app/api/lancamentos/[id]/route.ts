import { NextRequest, NextResponse } from "next/server";
import { pool, ensureTable } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTable();
    const { id } = await params;
    await pool.query("DELETE FROM lancamentos WHERE id = $1", [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/lancamentos/[id] DELETE]", err);
    return NextResponse.json({ error: "Não foi possível remover." }, { status: 500 });
  }
}
