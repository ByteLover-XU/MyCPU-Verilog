import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyCPU · HDLBits 学习计划",
  description: "循序渐进完成 HDLBits 专题训练，为 Verilog RTL 与简易 CPU 设计打基础。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
