import { Typography, Stack, Box } from '@mui/material';
import { CardContainer } from '@components/general';

const degToArcmin = (deg: number) => (deg * 60).toFixed(2);

function StatRow({ label, value }: { label: string, value: React.ReactNode }) {
    return (
        <>
            <Typography variant='body2' color='text.secondary'>{label}</Typography>
            <Typography variant='body1' sx={{ fontWeight: 'bold' }}>{value}</Typography>
        </>
    );
}

function metricRows(metrics: Record<string, unknown>): [string, string][] {
    const rows: [string, string][] = [];
    const { ra_err, dec_err, num_matched, n_fast, n_slow, mean_fwhm_px, ...rest } = metrics;

    if (typeof ra_err === 'number' && typeof dec_err === 'number') {
        rows.push(['Astrometric Error', `${degToArcmin(ra_err)}', ${degToArcmin(dec_err)}'`]);
    }
    if (num_matched !== undefined) {
        rows.push(['Stars Matched', String(num_matched)]);
    }
    if (n_fast !== undefined && n_slow !== undefined) {
        rows.push(['Detections', `${n_fast} Fast, ${n_slow} Slow`]);
    }
    if (typeof mean_fwhm_px === 'number') {
        rows.push(['Mean FWHM (px)', mean_fwhm_px.toFixed(2)]);
    }
    for (const name of Object.keys(rest)) {
        rows.push([name, String(rest[name])]);
    }
    return rows;
}

export function MetricsDisplay({ metrics }: { metrics?: Record<string, unknown> | null }) {
    if (!metrics || Object.keys(metrics).length === 0) {
        return null;
    }
    return (
        <CardContainer sx={{ flexShrink: 0, }}>
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'auto auto',
                columnGap: 3,
                rowGap: 1,
                justifyContent: 'start',
                alignItems: 'baseline',
            }}>
                {metricRows(metrics).map(([label, value]) => (
                    <StatRow label={label} value={value}/>
                ))}
            </Box>
        </CardContainer>
    )
}