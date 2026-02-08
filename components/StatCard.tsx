import { Box, Chip, Paper, Stack, Typography } from '@mui/material';

export type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  tag?: string;
  accent?: string;
};

export default function StatCard({
  title,
  value,
  description,
  tag,
  accent = '#2f6b4f'
}: StatCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderTop: `4px solid ${accent}`,
        bgcolor: 'rgba(255, 255, 255, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.7)',
        boxShadow: '0 12px 30px rgba(15, 30, 24, 0.12)',
        backdropFilter: 'blur(14px)',
        p: { xs: 3, md: 3.5 },
        minHeight: { xs: 140, md: 170 }
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -46,
          right: -46,
          width: 140,
          height: 140,
          bgcolor: accent,
          opacity: 0.08,
          borderRadius: '50%'
        }}
      />
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Stack spacing={1} sx={{ maxWidth: '70%' }}>
          <Typography
            variant="caption"
            sx={{ letterSpacing: '0.2em', textTransform: 'uppercase', color: 'text.secondary' }}
          >
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {value}
          </Typography>
        </Stack>
        {tag ? (
          <Chip
            label={tag}
            size="small"
            sx={{ bgcolor: accent, color: 'white', fontWeight: 600 }}
          />
        ) : null}
      </Stack>
      {description ? (
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          {description}
        </Typography>
      ) : null}
    </Paper>
  );
}
