import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Painel Financeiro do Casal",
  description: "Livro-caixa compartilhado de entradas e gastos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
