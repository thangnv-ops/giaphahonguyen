/**
 * @project AncestorTree
 * @file src/app/(main)/stats/stats-charts.tsx
 * @description Recharts chart components for stats dashboard (client-only)
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { DetailedStats } from '@/lib/stats-calculator';

const BLUE = '#3b82f6';
const PINK = '#ec4899';
const GREEN = '#22c55e';
const GRAY = '#6b7280';
const AMBER = '#f59e0b';

const GENDER_COLORS = [BLUE, PINK];
const LIVING_COLORS = [GREEN, GRAY];

interface StatsChartsProps {
  stats: DetailedStats;
}

export default function StatsCharts({ stats }: StatsChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Generation distribution */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Phân bố theo đời</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.generationStats} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={BLUE} name="Số người" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Chi distribution */}
      {stats.chiStats.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Phân bố theo chi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.chiStats} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill={AMBER} name="Số người" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gender pie chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tỷ lệ giới tính</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={stats.genderStats}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {stats.genderStats.map((_, idx) => (
                  <Cell key={idx} fill={GENDER_COLORS[idx % GENDER_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Living/deceased pie chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tỷ lệ còn sống / đã mất</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={stats.livingStats}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {stats.livingStats.map((_, idx) => (
                  <Cell key={idx} fill={LIVING_COLORS[idx % LIVING_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
