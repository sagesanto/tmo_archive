import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Container, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { AdminIcon } from '@assets/icons';
import { getConfig, useSetConfig } from '@api/config';
import { getIngestJobs, IngestJob, useTriggerIngest } from '@api/ingest';

const THRESHOLD_FIELDS = [
    { key: 'mpc_ra_deviation_tolerance', label: 'MPC RA Deviation Tolerance ("/s)' },
    { key: 'mpc_dec_deviation_tolerance', label: 'MPC DEC Deviation Tolerance ("/s)' },
    { key: 'detection_mag_excess_tolerance', label: 'Detection Mag Excess Tolerance' },
    { key: 'ingest_interval_minutes', label: 'Ingest Interval (minutes)' },
];

const STATUS_COLOR: Record<string, string> = {
    success: 'success.main',
    error: 'error.main',
    running: 'info.main',
    pending: 'text.secondary',
};

function ConfigField({ configKey, label, value }: { configKey: string, label: string, value: any }) {
    const [draft, setDraft] = useState(String(value ?? ''));
    const setConfig = useSetConfig();

    useEffect(() => { setDraft(String(value ?? '')); }, [value]);

    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <TextField size="small" type="number" label={label} value={draft} onChange={(event) => setDraft(event.target.value)} sx={{ width: 300 }} />
            <Button size="small" variant="outlined" onClick={() => setConfig.mutate({ key: configKey, value: Number(draft) })}>
                Save
            </Button>
        </Stack>
    );
}

function SearchPathsField({ value }: { value: any }) {
    const [draft, setDraft] = useState(JSON.stringify(value ?? {}, null, 2));
    const [error, setError] = useState<string | null>(null);
    const setConfig = useSetConfig();

    useEffect(() => { setDraft(JSON.stringify(value ?? {}, null, 2)); }, [value]);

    function save() {
        try {
            const parsed = JSON.parse(draft);
            setError(null);
            setConfig.mutate({ key: 'ingest_search_paths', value: parsed });
        } catch (e) {
            setError('Invalid JSON: ' + (e as Error).message);
        }
    }

    return (
        <Stack spacing={1} sx={{ width: '100%', maxWidth: 600 }}>
            <TextField size="small" label="Ingest Search Paths (JSON)" value={draft} onChange={(event) => setDraft(event.target.value)}
                multiline rows={8} slotProps={{ htmlInput: { style: { fontFamily: 'monospace' } } }} />
            {error && <Alert severity="error">{error}</Alert>}
            <Button size="small" variant="outlined" onClick={save} sx={{ alignSelf: 'flex-start' }}>
                Save
            </Button>
        </Stack>
    );
}

function JobRow({ job }: { job: IngestJob }) {
    return (
        <TableRow>
            <TableCell>
                <Typography component="span" sx={{ fontWeight: 'bold', color: STATUS_COLOR[job.status] ?? 'text.primary' }}>
                    {job.status}
                </Typography>
            </TableCell>
            <TableCell>{job.trigger}</TableCell>
            <TableCell>{new Date(job.requested_at).toLocaleString()}</TableCell>
            <TableCell>{job.finished_at ? new Date(job.finished_at).toLocaleString() : '-'}</TableCell>
            <TableCell>{job.error ?? '-'}</TableCell>
        </TableRow>
    );
}

export default function Admin() {
    const { data: config } = getConfig();
    const { data: jobs } = getIngestJobs();
    const triggerIngest = useTriggerIngest();

    useEffect(() => {
        document.title = "Admin";
    }, []);

    const byKey = useMemo(() => {
        const map: Record<string, any> = {};
        (config ?? []).forEach((entry) => { map[entry.key] = entry.value; });
        return map;
    }, [config]);

    const latestJob = jobs?.[0];
    const ingestBusy = latestJob ? ['pending', 'running'].includes(latestJob.status) : false;

    return (
        <Container sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1.5em' }}>
            <Stack direction="row" spacing={2} alignItems={'center'}>
                <AdminIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize }} />
                <Typography variant='h3' sx={{ lineHeight: 1, m: 0 }}>Admin</Typography>
            </Stack>

            <Stack spacing={1} sx={{ width: '100%' }}>
                <Typography variant="h5">Ingest</Typography>
                <Button variant="contained" disabled={ingestBusy} onClick={() => triggerIngest.mutate()} sx={{ alignSelf: 'flex-start' }}>
                    {ingestBusy ? 'Ingest Running...' : 'Run Ingest Now'}
                </Button>
                <Table size="small" sx={{ maxWidth: 900 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Status</TableCell>
                            <TableCell>Trigger</TableCell>
                            <TableCell>Requested</TableCell>
                            <TableCell>Finished</TableCell>
                            <TableCell>Error</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(jobs ?? []).map((job) => <JobRow key={job.id} job={job} />)}
                    </TableBody>
                </Table>
            </Stack>

            <Stack spacing={2} sx={{ width: '100%' }}>
                <Typography variant="h5">Configuration</Typography>
                {THRESHOLD_FIELDS.map((field) => (
                    <ConfigField key={field.key} configKey={field.key} label={field.label} value={byKey[field.key]} />
                ))}
                <SearchPathsField value={byKey['ingest_search_paths']} />
            </Stack>
        </Container>
    );
}
