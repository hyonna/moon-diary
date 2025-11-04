'use client';

import { useEffect, useState } from 'react';
import { DiaryEntry, MoonPhase, MOOD_MAPPINGS } from '@/types/diary';
import { diaryService } from '@/lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function StatisticsChart() {
  const [moodCounts, setMoodCounts] = useState<Record<MoonPhase, number>>({
    new: 0,
    waxing: 0,
    full: 0,
    waning: 0,
  });

  useEffect(() => {
    diaryService.getAllEntries().then((entries) => {
      const counts: Record<MoonPhase, number> = {
        new: 0,
        waxing: 0,
        full: 0,
        waning: 0,
      };

      entries.forEach((entry) => {
        counts[entry.mood]++;
      });

      setMoodCounts(counts);
    });
  }, []);

  const chartData = Object.entries(MOOD_MAPPINGS).map(([phase, mapping]) => ({
    name: mapping.name,
    value: moodCounts[phase as MoonPhase],
    emoji: mapping.emoji,
    fill: getColorForPhase(phase as MoonPhase),
  }));

  const COLORS = {
    new: '#fbbf24', // 옐로우 계열 - 연한 노란색
    waxing: '#fcd34d', // 옐로우 계열 - 중간 노란색
    full: '#ffd700', // 옐로우 계열 - 골드
    waning: '#facc15', // 옐로우 계열 - 진한 노란색
  };

  function getColorForPhase(phase: MoonPhase): string {
    return COLORS[phase];
  }

  return (
    <div className="ig-card p-6">
      <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-[var(--border-color)]">
        감정 통계
      </h2>
      {chartData.some((d) => d.value > 0) ? (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, emoji }) => `${emoji} ${name}: ${value}일`}
              outerRadius={90}
              fill="#8884d8"
              dataKey="value"
              style={{ fontSize: '12px', fill: 'var(--text-primary)' }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '14px', color: 'var(--text-primary)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center text-[var(--text-secondary)] py-16">
          아직 기록된 감정이 없습니다.
        </div>
      )}
    </div>
  );
}

