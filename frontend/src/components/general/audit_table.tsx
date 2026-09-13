import { useEffect, useMemo, useState } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TextField, Typography } from '@mui/material';
import { AuditEvent, getAuditEvents, useUpdateAuditNote, USER_ACTOR } from '@api/audit';
import { formatTimestamp } from '@utils/formatters';

type SortKey = 'created_at' | 'action' | 'actor' | 'note';

const ACTIONS: Record<string, string> = { flag_added: 'Added', flag_removed: 'Removed' };
const ACTORS: Record<string, string> = {
    user: 'User',
    mpc_status: 'MPC status check',
    mpc_velocity: 'MPC velocity check',
    detection_threshold: 'Detection threshold',
};
// an object's history includes its ancestors', so say where an event actually happened
const SCOPES: Record<string, string> = { observation: 'dataset', run: 'analysis', mpc: 'MPC object' };

function actionVerb(event: AuditEvent): string {
    return ACTIONS[event.action] ?? event.action;
}

function scopeLabel(event: AuditEvent, target_type: string): string | null {
    if (event.target_type === target_type) return null;
    return SCOPES[event.target_type] ?? event.target_type;
}

// a person can annotate their own actions. what a classifier recorded stays as written
function NoteCell({ record }: { record: AuditEvent }) {
    const updateNote = useUpdateAuditNote();
    const [draft, setDraft] = useState(record.note ?? '');

    useEffect(() => { setDraft(record.note ?? ''); }, [record.note]);

    if (record.actor !== USER_ACTOR) {
        return <Typography variant="body2" color="text.secondary">{record.note ?? ''}</Typography>;
    }

    function commit() {
        const next = draft.trim();
        if (next !== (record.note ?? '')) updateNote.mutate({ id: record.id, note: next || null });
    }

    return (
        <TextField
            variant="standard"
            fullWidth
            multiline
            placeholder="Add a note"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); (event.target as HTMLElement).blur(); } }}
            sx={{
                // underline only on hover/focus, so a row of empty notes stays quiet
                '& .MuiInput-root:before': { borderBottomColor: 'transparent' },
                '&:hover .MuiInput-root:not(.Mui-focused):before': { borderBottomColor: 'action.disabled' },
                '& .MuiInputBase-input': (theme) => ({ ...theme.typography.body2, color: theme.palette.text.secondary }),
            }}
        />
    );
}

// fills its parent, so give it a bounded height
export function AuditTable({ target_type, target_key }: { target_type: string, target_key: string }) {
    const { data: events, isLoading } = getAuditEvents(target_type, target_key, Boolean(target_key));
    const [sortKey, setSortKey] = useState<SortKey>('created_at');
    const [descending, setDescending] = useState(true);

    const sorted = useMemo(() => {
        // created_at is iso, so it sorts correctly as a string like the other columns
        const rows = [...(events ?? [])];
        rows.sort((a, b) => String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? '')));
        return descending ? rows.reverse() : rows;
    }, [events, sortKey, descending]);

    function sortHeader(key: SortKey, label: string, width?: number) {
        const active = sortKey === key;
        return (
            <TableCell sortDirection={active ? (descending ? 'desc' : 'asc') : false} sx={{ width, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                    active={active}
                    direction={active && !descending ? 'asc' : 'desc'}
                    onClick={() => { active ? setDescending(!descending) : (setSortKey(key), setDescending(true)); }}
                >
                    {label}
                </TableSortLabel>
            </TableCell>
        );
    }

    if (!isLoading && sorted.length === 0) {
        return (
            <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">No recorded activity</Typography>
            </Box>
        );
    }

    return (
        <TableContainer sx={{ height: '100%', flexGrow: 1, minHeight: 0 }}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        {sortHeader('created_at', 'Date (UT)', 190)}
                        {sortHeader('action', 'Action', 240)}
                        {sortHeader('actor', 'Author', 190)}
                        {sortHeader('note', 'Note')}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sorted.map((event) => {
                        const scope = scopeLabel(event, target_type);
                        return (
                            <TableRow key={event.id} hover>
                                <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                                    {formatTimestamp(event.created_at)}
                                </TableCell>
                                <TableCell>
                                    {actionVerb(event)}{' '}
                                    {event.flag_name && <Box component="span" sx={{ fontStyle: 'italic' }}>{event.flag_name}</Box>}
                                    {scope && (
                                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                                            on the {scope}
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell sx={{ color: 'text.secondary' }}>{ACTORS[event.actor] ?? event.actor}</TableCell>
                                <TableCell>
                                    <NoteCell record={event} />
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
