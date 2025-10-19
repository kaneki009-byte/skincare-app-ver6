import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EvaluationEntry, EvaluationStatus, useEvaluations } from '@/context/EvaluationContext';

const STATUS_LABELS: Record<EvaluationStatus, string> = {
  done: 'できている',
  not_done: 'できていない',
  not_applicable: '該当なし',
};

const STATUS_COLORS: Record<EvaluationStatus, string> = {
  done: '#0ea5e9',
  not_done: '#f97316',
  not_applicable: '#94a3b8',
};

const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) {
    return monthKey;
  }
  return `${year}年${month.toString().padStart(2, '0')}月`;
};

const groupByMonth = (entries: EvaluationEntry[]) => {
  const map = new Map<string, EvaluationEntry[]>();
  entries.forEach((entry) => {
    if (!map.has(entry.monthKey)) {
      map.set(entry.monthKey, []);
    }
    map.get(entry.monthKey)?.push(entry);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => (a > b ? -1 : 1))
    .map(([month, monthEntries]) => ({ month, entries: monthEntries }));
};

const DashboardPage = () => {
  const { entries } = useEvaluations();

  const months = useMemo(() => groupByMonth(entries), [entries]);
  const allMonthKeys = months.map((item) => item.month);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => allMonthKeys[0] ?? '');

  useEffect(() => {
    if (allMonthKeys.length > 0) {
      setSelectedMonth((prev) => (prev && allMonthKeys.includes(prev) ? prev : allMonthKeys[0]));
    } else {
      setSelectedMonth('');
    }
  }, [allMonthKeys]);

  const monthlyEntries = useMemo(() => {
    if (!selectedMonth) {
      return [] as EvaluationEntry[];
    }
    return months.find((item) => item.month === selectedMonth)?.entries ?? [];
  }, [months, selectedMonth]);

  const counts = useMemo(() => {
    const initial = { done: 0, not_done: 0, not_applicable: 0 } as Record<EvaluationStatus, number>;
    const adpro = { ...initial };
    const vaseline = { ...initial };

    monthlyEntries.forEach((entry) => {
      adpro[entry.statusAdpro] += 1;
      vaseline[entry.statusVaseline] += 1;
    });

    const total = {
      done: adpro.done + vaseline.done,
      not_done: adpro.not_done + vaseline.not_done,
      not_applicable: adpro.not_applicable + vaseline.not_applicable,
    };

    const targetCount = monthlyEntries.reduce((acc, entry) => {
      if (entry.statusAdpro !== 'not_applicable') {
        acc += 1;
      }
      if (entry.statusVaseline !== 'not_applicable') {
        acc += 1;
      }
      return acc;
    }, 0);

    return { adpro, vaseline, total, targetCount };
  }, [monthlyEntries]);

  const pieData = (data: Record<EvaluationStatus, number>) =>
    (Object.keys(data) as EvaluationStatus[])
      .filter((status) => data[status] > 0)
      .map((status) => ({ name: STATUS_LABELS[status], value: data[status], status }));

  const adproPieData = pieData(counts.adpro);
  const vaselinePieData = pieData(counts.vaseline);

  const barData = [
    {
      name: 'アドプロ',
      できている: counts.adpro.done,
      できていない: counts.adpro.not_done,
      該当なし: counts.adpro.not_applicable,
    },
    {
      name: 'ワセリン',
      できている: counts.vaseline.done,
      できていない: counts.vaseline.not_done,
      該当なし: counts.vaseline.not_applicable,
    },
  ];

  return (
    <div className="dashboard-page">
      <section className="card">
        <div className="card-header">
          <h2>月次サマリー</h2>
          <select
            className="input month-selector"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
          >
            {allMonthKeys.map((monthKey) => (
              <option key={monthKey} value={monthKey}>
                {formatMonth(monthKey)}
              </option>
            ))}
          </select>
        </div>
        {monthlyEntries.length === 0 ? (
          <p className="muted">記録がありません。</p>
        ) : (
          <div className="summary-grid">
            <div className="summary-card">
              <span className="summary-title">対象件数</span>
              <strong className="summary-value">{counts.targetCount}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-title">記録数</span>
              <strong className="summary-value">{monthlyEntries.length}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-title">できている</span>
              <strong className="summary-value">{counts.total.done}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-title">できていない</span>
              <strong className="summary-value">{counts.total.not_done}</strong>
            </div>
          </div>
        )}
      </section>

      {monthlyEntries.length > 0 && (
        <>
          <section className="card charts">
            <h2>実施状況（円グラフ）</h2>
            <div className="chart-grid">
              <div className="chart-panel">
                <h3>アドプロテープ</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie dataKey="value" data={adproPieData} innerRadius={45} outerRadius={80} paddingAngle={3}>
                      {adproPieData.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value}件`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-panel">
                <h3>ワセリン</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie dataKey="value" data={vaselinePieData} innerRadius={45} outerRadius={80} paddingAngle={3}>
                      {vaselinePieData.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value}件`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="card charts">
            <h2>実施状況（棒グラフ）</h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value: number, name: string) => [`${value}件`, name]} />
                <Legend />
                <Bar dataKey="できている" fill={STATUS_COLORS.done} radius={[6, 6, 0, 0]} />
                <Bar dataKey="できていない" fill={STATUS_COLORS.not_done} radius={[6, 6, 0, 0]} />
                <Bar dataKey="該当なし" fill={STATUS_COLORS.not_applicable} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="card">
            <h2>集計表</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>項目</th>
                    <th>できている</th>
                    <th>できていない</th>
                    <th>該当なし</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>アドプロテープ</td>
                    <td>{counts.adpro.done}</td>
                    <td>{counts.adpro.not_done}</td>
                    <td>{counts.adpro.not_applicable}</td>
                  </tr>
                  <tr>
                    <td>ワセリン</td>
                    <td>{counts.vaseline.done}</td>
                    <td>{counts.vaseline.not_done}</td>
                    <td>{counts.vaseline.not_applicable}</td>
                  </tr>
                  <tr>
                    <td>合計</td>
                    <td>{counts.total.done}</td>
                    <td>{counts.total.not_done}</td>
                    <td>{counts.total.not_applicable}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
