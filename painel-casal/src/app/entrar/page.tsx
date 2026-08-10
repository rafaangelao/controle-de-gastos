"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function EntrarForm() {
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(params.get("redirect") || "/");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setErro(body.error || "Não foi possível entrar.");
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#10192B", fontFamily: "Inter, sans-serif", padding: 16,
    }}>
      <form onSubmit={handleSubmit} style={{
        background: "#FAF6EC", padding: "32px 28px", borderRadius: 18, width: 320,
        boxShadow: "0 18px 40px -20px rgba(16,25,43,0.6)",
      }}>
        <p style={{
          fontFamily: "monospace", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase",
          color: "#C99A3B", margin: "0 0 6px",
        }}>Livro-caixa do casal</p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 24, margin: "0 0 18px", color: "#1F2A24" }}>
          Entrar no painel
        </h1>
        <input
          type="password"
          inputMode="numeric"
          placeholder="PIN de acesso"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          style={{
            width: "100%", padding: "11px 12px", borderRadius: 9, border: "1px solid #DCD4C0",
            fontSize: 15, marginBottom: 12, boxSizing: "border-box",
          }}
          autoFocus
        />
        {erro && <p style={{ color: "#AB4027", fontSize: 13, marginTop: -4, marginBottom: 12 }}>{erro}</p>}
        <button type="submit" disabled={loading} style={{
          width: "100%", padding: "11px", borderRadius: 9, border: "none", background: "#1F6F5C",
          color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
        }}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

export default function EntrarPage() {
  return (
    <Suspense>
      <EntrarForm />
    </Suspense>
  );
}
