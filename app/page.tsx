'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import StatCard from '@/components/StatCard';
import { supabase, supabaseConfigured } from '@/lib/supabaseClient';

type AbstinenceRecord = {
  day: string;
  success: boolean;
  recorded_at: string;
};

const formatLocalDate = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60_000);
  return adjusted.toISOString().slice(0, 10);
};

const parseUtcDate = (day: string) => {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date));
};

const formatElapsed = (ms: number) => {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}日 ${hours}時間`;
  }
  if (hours > 0) {
    return `${hours}時間 ${minutes}分`;
  }
  return `${minutes}分`;
};

const getMonthDays = (year: number, monthIndex: number) => {
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  return {
    totalDays: lastDay.getDate(),
    startWeekday: firstDay.getDay()
  };
};

export default function HomePage() {
  const [records, setRecords] = useState<AbstinenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayKey = useMemo(() => formatLocalDate(new Date()), []);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!supabaseConfigured) {
      setError('Supabase の環境変数が設定されていません。');
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('abstinence_days')
        .select('day, success, recorded_at')
        .order('day', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setRecords(data ?? []);
      setLoading(false);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : 'Supabase への接続に失敗しました。';
      setError(message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleRegister = useCallback(
    async (success: boolean) => {
      setSaving(true);
      setError(null);

      const { error: upsertError } = await supabase
        .from('abstinence_days')
        .upsert(
          {
            day: todayKey,
            success,
            recorded_at: new Date().toISOString()
          },
          { onConflict: 'day' }
        );

      if (upsertError) {
        setError(upsertError.message);
        setSaving(false);
        return;
      }

      await loadRecords();
      setSaving(false);
    },
    [loadRecords, todayKey]
  );

  const recordMap = useMemo(() => {
    return new Map(records.map((record) => [record.day, record]));
  }, [records]);

  const todayRecord = recordMap.get(todayKey);

  const { monthLabel, monthDays } = useMemo(() => {
    const now = new Date();
    const monthLabel = now.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long'
    });
    const monthDays = getMonthDays(now.getFullYear(), now.getMonth());
    return { monthLabel, monthDays };
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthStartKey = formatLocalDate(monthStart);
    const monthEndKey = formatLocalDate(monthEnd);

    const monthRecords = records.filter(
      (record) => record.day >= monthStartKey && record.day <= monthEndKey
    );
    const monthSuccess = monthRecords.filter((record) => record.success).length;
    const monthTotal = monthRecords.length;
    const successRate = monthTotal > 0 ? Math.round((monthSuccess / monthTotal) * 100) : 0;

    let currentStreak = 0;
    if (todayRecord?.success) {
      for (let i = records.length - 1; i >= 0; i -= 1) {
        const record = records[i];
        if (!record.success) {
          break;
        }
        if (i < records.length - 1) {
          const prev = records[i + 1];
          const diff =
            (parseUtcDate(prev.day).getTime() - parseUtcDate(record.day).getTime()) /
            86_400_000;
          if (diff !== 1) {
            break;
          }
        }
        currentStreak += 1;
      }
    }

    let bestStreak = 0;
    let running = 0;
    for (let i = 0; i < records.length; i += 1) {
      const record = records[i];
      if (record.success) {
        if (i > 0) {
          const prev = records[i - 1];
          const diff =
            (parseUtcDate(record.day).getTime() - parseUtcDate(prev.day).getTime()) /
            86_400_000;
          if (diff !== 1 || !prev.success) {
            running = 0;
          }
        } else {
          running = 0;
        }
        running += 1;
        bestStreak = Math.max(bestStreak, running);
      } else {
        running = 0;
      }
    }

    const lastFailure = [...records].reverse().find((record) => !record.success);
    const elapsed = lastFailure
      ? formatElapsed(Date.now() - new Date(lastFailure.recorded_at).getTime())
      : '失敗なし';

    return {
      currentStreak,
      successRate,
      monthSuccess,
      monthTotal,
      bestStreak,
      elapsed
    };
  }, [records, todayRecord]);

  const calendarCells = useMemo(() => {
    const cells: Array<{ key: string; label: string; success?: boolean }> = [];
    for (let i = 0; i < monthDays.startWeekday; i += 1) {
      cells.push({ key: `empty-${i}`, label: '' });
    }
    const now = new Date();
    for (let day = 1; day <= monthDays.totalDays; day += 1) {
      const dateKey = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), day));
      const record = recordMap.get(dateKey);
      cells.push({ key: dateKey, label: String(day), success: record?.success });
    }
    return cells;
  }, [monthDays, recordMap]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f7f3ec 0%, #f3efe6 45%, #e6efe8 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -120,
          right: -80,
          width: { xs: 240, md: 320 },
          height: { xs: 240, md: 320 },
          bgcolor: '#2f6b4f',
          opacity: 0.12,
          filter: 'blur(40px)',
          borderRadius: '50%'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -160,
          left: -120,
          width: { xs: 300, md: 380 },
          height: { xs: 300, md: 380 },
          bgcolor: '#f3b25b',
          opacity: 0.16,
          filter: 'blur(60px)',
          borderRadius: '50%'
        }}
      />
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 }, position: 'relative', zIndex: 1 }}>
        <Stack spacing={{ xs: 6, md: 8 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                label="Dashboard"
                size="small"
                sx={{
                  bgcolor: '#0b1d16',
                  color: 'white',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  px: 1
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {monthLabel}
              </Typography>
            </Stack>
            <Typography variant="h2">禁欲ダッシュボード</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
              連続日数や月間成功率をカードで把握し、カレンダーで達成状況を振り返る。
            </Typography>
          </Stack>

          {error ? (
            <Paper sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.9)', borderRadius: 3 }}>
              <Typography color="error">{error}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Supabase の接続やテーブル設定を確認してください。
              </Typography>
            </Paper>
          ) : null}

          {loading ? (
            <Paper sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.9)', borderRadius: 3 }}>
              <Typography>データを読み込み中...</Typography>
            </Paper>
          ) : !todayRecord ? (
            <Paper
              elevation={0}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 4,
                p: { xs: 3, md: 4 },
                border: '1px solid rgba(255, 255, 255, 0.7)',
                boxShadow: '0 14px 36px rgba(15, 30, 24, 0.1)'
              }}
            >
              <Stack spacing={2}>
                <Typography variant="h5">今日の記録</Typography>
                <Typography variant="body1" color="text.secondary">
                  今日の禁欲は達成できましたか？
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={saving}
                    onClick={() => handleRegister(true)}
                  >
                    できた
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    disabled={saving}
                    onClick={() => handleRegister(false)}
                  >
                    できなかった
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  gap: { xs: 2, md: 3 }
                }}
              >
                <StatCard
                  title="連続日数"
                  value={`${stats.currentStreak}日`}
                  description="今日も継続中"
                  tag="現在"
                  accent="#2f6b4f"
                />
                <StatCard
                  title="今月の成功率"
                  value={`${stats.successRate}%`}
                  description={`今月の達成 ${stats.monthSuccess} / ${stats.monthTotal}日`}
                  tag="今月"
                  accent="#3f7d5b"
                />
                <StatCard
                  title="今月の達成日数"
                  value={`${stats.monthSuccess}日`}
                  description="記録がある日の合計"
                  tag="今月"
                  accent="#ea9a3f"
                />
                <StatCard
                  title="最長連続記録"
                  value={`${stats.bestStreak}日`}
                  description="これまでのベスト"
                  tag="通算"
                  accent="#152722"
                />
                <Box sx={{ gridColumn: { xs: 'auto', md: '1 / -1' } }}>
                  <StatCard
                    title="最後の失敗からの経過"
                    value={stats.elapsed}
                    description="次の24時間が勝負"
                    tag="経過"
                    accent="#f3b25b"
                  />
                </Box>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.85)',
                  borderRadius: 4,
                  p: { xs: 3, md: 4 },
                  border: '1px solid rgba(255, 255, 255, 0.7)',
                  boxShadow: '0 14px 36px rgba(15, 30, 24, 0.1)',
                  backdropFilter: 'blur(16px)'
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    カレンダー
                  </Typography>
                  <Chip label="今月" size="small" variant="outlined" />
                </Stack>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                    gap: { xs: 1.5, md: 2 },
                    mt: 3
                  }}
                >
                  {calendarCells.map((cell) => (
                    <Box
                      key={cell.key}
                      sx={{
                        height: { xs: 36, md: 42 },
                        borderRadius: 2,
                        bgcolor: cell.success ? '#2f6b4f' : 'rgba(255, 255, 255, 0.8)',
                        color: cell.success ? 'white' : 'text.secondary',
                        border: `1px solid ${
                          cell.success ? '#2f6b4f' : 'rgba(255, 255, 255, 0.7)'
                        }`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: cell.success ? 600 : 500
                      }}
                    >
                      {cell.label}
                    </Box>
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  達成日は緑、未達成日は白で表示。
                </Typography>
              </Paper>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
