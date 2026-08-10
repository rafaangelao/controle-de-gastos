import { NextRequest, NextResponse } from "next/server";
import { pool, ensureTable } from "@/lib/db";

export async function GET() {
  try {
    await ensureTable();
    const { rows } = await pool.query(
      "SELECT id, tipo, to_char(data,'YYYY-MM-DD') as data, categoria, descricao, valor::float as valor FROM lancamentos ORDER BY data DESC, criado_em DESC"
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[api/lancamentos GET]", err);
    return NextResponse.json(
      { error: "Não foi possível conectar ao banco de dados. Confira a variável de conexão no Vercel." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const body = await req.json();
    const { tipo, data, categoria, descricao, valor } = body;

    if (!tipo || !["entrada", "gasto"].includes(tipo)) {
      return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
    }
    if (!data) {
      return NextResponse.json({ error: "data é obrigatória" }, { status: 400 });
    }
    const valorNum = Number(valor);
    if (!valorNum || valorNum <= 0) {
      return NextResponse.json({ error: "valor deve ser maior que zero" }, { status: 400 });
    }

    const id = `${tipo[0]}${Date.now()}${Math.random().toString(16).slice(2, 8)}`;

    await pool.query(
      `INSERT INTO lancamentos (id, tipo, data, categoria, descricao, valor) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, tipo, data, tipo === "gasto" ? categoria : null, descricao || null, valorNum]
    );

    return NextResponse.json({ id, tipo, data, categoria, descricao, valor: valorNum }, { status: 201 });
  } catch (err) {
    console.error("[api/lancamentos POST]", err);
    return NextResponse.json(
      { error: "Não foi possível salvar. Confira a conexão com o banco de dados." },
      { status: 500 }
    );
  }
}
