"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function RevenueLine({ data }: Readonly<{ data: { day: string; amount: number }[] }>) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="day" stroke="var(--muted)" fontSize={12} />
        <YAxis stroke="var(--muted)" fontSize={12} />
        <Tooltip />
        <Line type="monotone" dataKey="amount" stroke="var(--accent)" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ClinicBars({ data }: Readonly<{ data: { name: string; revenue: number }[] }>) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} />
        <YAxis stroke="var(--muted)" fontSize={12} />
        <Tooltip />
        <Bar dataKey="revenue" fill="var(--accent)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data }: Readonly<{ data: { name: string; value: number }[] }>) {
  const colors = ["#0f766e", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6"];
  const slices = data.map((item, index) => ({
    ...item,
    fill: colors[index % colors.length],
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={slices} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
