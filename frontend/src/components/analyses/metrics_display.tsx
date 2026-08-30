import { Dialog, DialogTitle, DialogContent, Stack, Typography, Box } from '@mui/material';

const degToArcmin = (deg: number) => (deg * 60).toFixed(2);

function StatRow({ label, value }: { label: string, value: React.ReactNode }) {
    return (
        <Stack>
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', whiteSpace: 'nowrap' }}>{label}</Typography>
            <Typography variant='body2' sx={{ whiteSpace: 'nowrap' }}>{value}</Typography>
        </Stack>
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

export function MetricsInfoModal({ open, onClose, metrics }: { open: boolean, onClose: () => void, metrics?: Record<string, unknown> | null }) {
    const rows = metricRows(metrics ?? {});
    const splitAt = Math.ceil(rows.length / 2);
    const columns = [rows.slice(0, splitAt), rows.slice(splitAt)];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Analysis Metrics</DialogTitle>
            <DialogContent>
                <MetricsBox metrics={metrics}/>
            </DialogContent>
        </Dialog>
    )
}

const NULL_TEXT = 'null';

export function analysisMetricRows(metrics?: Record<string, unknown> | null, sky_mag?: number | null, detection_limit_mag?: number | null): [string, string][] {
    const { ra_err, dec_err, num_matched, n_fast, n_slow, mean_fwhm_px } = metrics ?? {};

    return [
        ['Astrometric Error', typeof ra_err === 'number' && typeof dec_err === 'number' ? `${degToArcmin(ra_err)}', ${degToArcmin(dec_err)}'` : NULL_TEXT],
        ['Stars Matched', num_matched !== undefined && num_matched !== null ? String(num_matched) : NULL_TEXT],
        ['Detections', n_fast !== undefined && n_slow !== undefined ? `${n_fast} Fast, ${n_slow} Slow` : NULL_TEXT],
        ['Mean FWHM (px)', typeof mean_fwhm_px === 'number' ? mean_fwhm_px.toFixed(2) : NULL_TEXT],
        ['Sky Mag', typeof sky_mag === 'number' ? sky_mag.toFixed(2) : NULL_TEXT],
        ['Detection Limit', typeof detection_limit_mag === 'number' ? detection_limit_mag.toFixed(2) : NULL_TEXT],
    ];
}

// for analysis detail page
export function MetricsBox({ metrics, sky_mag, detection_limit_mag }: { metrics?: Record<string, unknown> | null, sky_mag?: number | null, detection_limit_mag?: number | null }) {
    const rows = analysisMetricRows(metrics, sky_mag, detection_limit_mag);
    const columns = [rows.slice(0, 2), rows.slice(2, 4), rows.slice(4, 6)];

    return (
            <Box>
                <Stack direction="row" spacing={3}>
                    {columns.map((column, i) => (
                        <Stack key={i} spacing={1.5}>
                            {column.map(([label, value]) => (
                                <StatRow key={label} label={label} value={value} />
                            ))}
                        </Stack>
                    ))}
                </Stack>
            </Box>
    )
}

// for obj detail page
export function AnalysisMetricsColumn({ metrics, sky_mag, detection_limit_mag }: { metrics?: Record<string, unknown> | null, sky_mag?: number | null, detection_limit_mag?: number | null }) {
    const rows = analysisMetricRows(metrics, sky_mag, detection_limit_mag);
    const columns = [rows.slice(0, 3), rows.slice(3, 6)];

    return (
        <Stack spacing={1.5}>
            <Typography variant='subtitle1' color='text.secondary'>Analysis Metrics</Typography>
            <Stack direction="row" spacing={3}>
                {columns.map((column, i) => (
                    <Stack key={i} spacing={1.5}>
                        {column.map(([label, value]) => (
                            <StatRow key={label} label={label} value={value} />
                        ))}
                    </Stack>
                ))}
            </Stack>
        </Stack>
    );
}