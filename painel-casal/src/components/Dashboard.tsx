"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Lancamento = {
  id: string;
  tipo: "entrada" | "gasto";
  data: string; // YYYY-MM-DD
  categoria?: string | null;
  descricao?: string | null;
  valor: number;
};

const CATEGORIAS = [
  { nome: "Igreja", cor: "#C99A3B" },
  { nome: "Comida/Fast Food", cor: "#AB4027" },
  { nome: "Transporte", cor: "#4C6A8C" },
  { nome: "Lazer", cor: "#1F6F5C" },
  { nome: "Presentes", cor: "#8B5A8C" },
  { nome: "Coisas pra mim", cor: "#7C8A3C" },
  { nome: "Contas fixas", cor: "#10192B" },
  { nome: "Saúde", cor: "#2E8B6E" },
  { nome: "Guardar dinheiro", cor: "#1B4F6E" },
  { nome: "Outros", cor: "#8492AC" },
];
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const fmtMoney = (v: number) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number) => (isFinite(v) ? (v * 100).toFixed(0) + "%" : "0%");

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<Lancamento[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [selYear, setSelYear] = useState<number | null>(null);
  const [selMonth, setSelMonth] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"gasto" | "entrada">("gasto");
  const [form, setForm] = useState({ data: "", valor: "", categoria: CATEGORIAS[0].nome, descricao: "" });
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState("");

  function carregar() {
    setLoadError("");
    setData(null);
    fetch("/api/lancamentos")
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || `Erro ${r.status} ao carregar os lançamentos.`);
        }
        return r.json();
      })
      .then((rows: Lancamento[]) => {
        setData(rows);
        const now = new Date();
        const keys = new Set(rows.map((r) => r.data.slice(0, 7)));
        keys.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
        const latest = Array.from(keys).sort().pop()!;
        setSelYear(parseInt(latest.split("-")[0]));
        setSelMonth(parseInt(latest.split("-")[1]));
        setForm((f) => ({ ...f, data: `${latest}-${String(now.getDate()).padStart(2, "0")}` }));
      })
      .catch((err: Error) => {
        setLoadError(err.message || "Não foi possível carregar o painel.");
      });
  }

  useEffect(() => {
    carregar();
  }, []);

  if (loadError) {
    return (
      <div className="wrap">
        <div className="card" style={{ marginTop: 60, textAlign: "center" }}>
          <h2 style={{ justifyContent: "center" }}>Não deu pra carregar o painel</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: 14, marginBottom: 18 }}>{loadError}</p>
          <p style={{ color: "var(--ink-soft)", fontSize: 13, marginBottom: 18 }}>
            Verifique nos logs do Vercel (aba <b>Runtime Logs</b>) se a variável de conexão com o
            banco (<code>POSTGRES_URL</code> ou <code>DATABASE_URL</code>) está configurada.
          </p>
          <button className="submit-btn entrada" style={{ display: "inline-block", padding: "10px 22px" }} onClick={carregar}>
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  const monthsAvailable = useMemo(() => {
    if (!data) return [];
    const now = new Date();
    const set = new Set(data.map((d) => d.data.slice(0, 7)));
    set.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    return Array.from(set).sort();
  }, [data]);

  const yearOptions = useMemo(
    () => Array.from(new Set(monthsAvailable.map((k) => parseInt(k.split("-")[0])))).sort(),
    [monthsAvailable]
  );

  if (!data || selYear === null || selMonth === null) {
    return <div className="wrap"><div className="loading">carregando seu painel…</div></div>;
  }

  const prefix = `${selYear}-${String(selMonth).padStart(2, "0")}`;
  const monthEntries = data.filter((d) => d.data.startsWith(prefix));
  const entradas = monthEntries.filter((d) => d.tipo === "entrada");
  const gastos = monthEntries.filter((d) => d.tipo === "gasto");
  const totalEntradas = entradas.reduce((s, d) => s + d.valor, 0);
  const totalGastos = gastos.reduce((s, d) => s + d.valor, 0);
  const saldo = totalEntradas - totalGastos;
  const totalEntradasGeral = data.filter((d) => d.tipo === "entrada").reduce((s, d) => s + d.valor, 0);
  const totalGastosGeral = data.filter((d) => d.tipo === "gasto").reduce((s, d) => s + d.valor, 0);

  let statusMsg: string, statusColor: string;
  if (totalEntradas === 0) {
    statusMsg = "Preencha as entradas do mês selecionado para ver o status 👆";
    statusColor = "var(--ink-soft)";
  } else {
    const ratio = totalGastos / totalEntradas;
    if (ratio > 1) { statusMsg = "🚨 Vocês já gastaram mais do que entrou neste mês."; statusColor = "var(--rust)"; }
    else if (ratio > 0.85) { statusMsg = `⚠️ Atenção: ${fmtPct(ratio)} das entradas já foi comprometido.`; statusColor = "var(--rust)"; }
    else if (ratio > 0.6) { statusMsg = `👍 Vai bem: ${fmtPct(ratio)} das entradas gasto.`; statusColor = "#8A6413"; }
    else { statusMsg = `✅ Tudo tranquilo! Só ${fmtPct(ratio)} das entradas gasto.`; statusColor = "var(--forest)"; }
  }

  const catTotals = CATEGORIAS.map((c) => ({
    ...c,
    val: gastos.filter((g) => g.categoria === c.nome).reduce((s, d) => s + d.valor, 0),
  })).filter((c) => c.val > 0).sort((a, b) => b.val - a.val);
  const maxCat = catTotals.length ? Math.max(...catTotals.map((c) => c.val)) : 0;

  const txSorted = [...monthEntries].sort((a, b) => b.data.localeCompare(a.data));

  async function submitEntry(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const valorNum = parseFloat(form.valor);
    if (!form.data || !valorNum || valorNum <= 0) {
      setErro("Preencha a data e um valor válido.");
      return;
    }
    setSubmitting(true);
    const payload = {
      tipo: activeTab,
      data: form.data,
      valor: valorNum,
      descricao: form.descricao,
      categoria: activeTab === "gasto" ? form.categoria : undefined,
    };
    const res = await fetch("/api/lancamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);
    if (res.ok) {
      const novo = await res.json();
      setData((prev) => [novo, ...(prev || [])]);
      setSelYear(parseInt(form.data.slice(0, 4)));
      setSelMonth(parseInt(form.data.slice(5, 7)));
      setForm((f) => ({ ...f, valor: "", descricao: "" }));
    } else {
      const body = await res.json().catch(() => ({}));
      setErro(body.error || "Não foi possível salvar.");
    }
  }

  async function deleteEntry(id: string) {
    setData((prev) => (prev || []).filter((d) => d.id !== id));
    await fetch(`/api/lancamentos/${id}`, { method: "DELETE" });
  }

  async function logout() {
    document.cookie = "painel_auth=; Max-Age=0; path=/";
    router.push("/entrar");
  }

  return (
    <div className="wrap">
      <div className="masthead">
        <div>
          <p className="eyebrow">Livro-caixa do casal</p>
          <h1>Painel Financeiro</h1>
          <p className="sub">Registrem entradas e gastos juntos — os dados ficam salvos no mesmo lugar para os dois.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="stamp">{monthEntries.length} lançamento{monthEntries.length === 1 ? "" : "s"} em <b>{MESES[selMonth - 1]}/{selYear}</b></div>
          <button className="logout-btn" onClick={logout}>Sair</button>
        </div>
      </div>

      <div className="selector-row">
        <div className="field-tab">
          <label>Mês</label>
          <select value={selMonth} onChange={(e) => setSelMonth(parseInt(e.target.value))}>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="field-tab">
          <label>Ano</label>
          <select value={selYear} onChange={(e) => setSelYear(parseInt(e.target.value))}>
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="spacer" />
      </div>

      <div className="ledger">
        <div className="ledger-grid">
          <div className="led-col">
            <div className="led-label entrada">Total entradas</div>
            <div className="led-value entrada">{fmtMoney(totalEntradas)}</div>
            <div className="led-caption">soma das entradas do mês</div>
          </div>
          <div className="led-col">
            <div className="led-label gasto">Total gasto</div>
            <div className="led-value gasto">{fmtMoney(totalGastos)}</div>
            <div className="led-caption">soma dos gastos do mês</div>
          </div>
          <div className="led-col">
            <div className="led-label saldo">Sobrou / faltou</div>
            <div className="led-value saldo">{fmtMoney(saldo)}</div>
            <div className="led-caption">entradas − gastos</div>
          </div>
        </div>
        <div className="status-strip" style={{ color: statusColor }}>{statusMsg}</div>
      </div>

      <div className="cols">
        <div className="card">
          <h2>Novo lançamento</h2>
          <div className="tabs">
            <button className={`tab-btn gasto ${activeTab === "gasto" ? "active" : ""}`} onClick={() => setActiveTab("gasto")} type="button">− Gasto</button>
            <button className={`tab-btn entrada ${activeTab === "entrada" ? "active" : ""}`} onClick={() => setActiveTab("entrada")} type="button">+ Entrada</button>
          </div>
          <form className="form-grid" onSubmit={submitEntry}>
            <div className="form-row">
              <div className="form-field">
                <label>Data</label>
                <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Valor (R$)</label>
                <input type="number" step="0.01" min="0" placeholder="0,00" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
              </div>
            </div>
            {activeTab === "gasto" && (
              <div className="form-field">
                <label>Categoria</label>
                <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                  {CATEGORIAS.map((c) => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
                </select>
              </div>
            )}
            <div className="form-field">
              <label>Descrição</label>
              <input type="text" placeholder={activeTab === "gasto" ? "Ex: almoço, uber…" : "Ex: salário, freela…"} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            {erro && <p style={{ color: "var(--rust)", fontSize: 13, margin: 0 }}>{erro}</p>}
            <button className={`submit-btn ${activeTab}`} type="submit" disabled={submitting}>
              {submitting ? "Salvando…" : activeTab === "gasto" ? "Registrar gasto" : "Registrar entrada"}
            </button>
          </form>
        </div>

        <div className="card">
          <h2>Para onde foi o dinheiro <span className="n">{MESES[selMonth - 1].toLowerCase()}</span></h2>
          {catTotals.length ? catTotals.map((c) => (
            <div className="cat-row" key={c.nome}>
              <div className="dot" style={{ background: c.cor }} />
              <div className="cat-name">{c.nome}</div>
              <div className="cat-value">{fmtMoney(c.val)}</div>
              <div className="cat-pct">{fmtPct(totalGastos ? c.val / totalGastos : 0)}</div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${maxCat ? (c.val / maxCat) * 100 : 0}%`, background: c.cor }} /></div>
            </div>
          )) : <div className="cat-empty">Nenhum gasto lançado neste mês ainda.</div>}
        </div>
      </div>

      <div className="card tx-card">
        <h2>Lançamentos de {MESES[selMonth - 1]}/{selYear}</h2>
        <div className="tx-list">
          {txSorted.length ? txSorted.map((tx) => (
            <div className="tx-item" key={tx.id}>
              <div className="tx-date">{tx.data.slice(8, 10)}/{tx.data.slice(5, 7)}</div>
              <div>
                <div className="tx-desc">{tx.descricao || "—"}</div>
                <div className="tx-cat">{tx.tipo === "gasto" ? tx.categoria : "Entrada"}</div>
              </div>
              <div className={`tx-value ${tx.tipo}`}>{tx.tipo === "gasto" ? "−" : "+"} {fmtMoney(tx.valor)}</div>
              <button className="tx-del" title="Remover" onClick={() => deleteEntry(tx.id)}>✕</button>
            </div>
          )) : <div className="tx-empty">Nenhum lançamento neste mês.</div>}
        </div>
      </div>

      <div className="overview">
        <div className="ov-box"><div className="ov-label">Entradas (geral)</div><div className="ov-value">{fmtMoney(totalEntradasGeral)}</div></div>
        <div className="ov-box"><div className="ov-label">Gastos (geral)</div><div className="ov-value">{fmtMoney(totalGastosGeral)}</div></div>
        <div className="ov-box"><div className="ov-label">Saldo (geral)</div><div className="ov-value">{fmtMoney(totalEntradasGeral - totalGastosGeral)}</div></div>
      </div>
      <p className="tip">Os dados são compartilhados — o que um lançar, o outro vê ao atualizar a página.</p>
    </div>
  );
}
