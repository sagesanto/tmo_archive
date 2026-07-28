import { Chip } from '@mui/material';
import { useNavigate } from 'react-router';
import { AppRoutes } from "@config/routes";

const STATUS_COLORS: Record<string, string> = {
    Idle: '#fff9c4',
    Waiting: '#fff9c4',
    Running: '#bbdefb',
    Complete: '#c8e6c9',
    Aborted: '#ffcdd2',
    Error: '#ffcdd2',
};

export function StatusChip({ status }: { status: string }) {
    let navigate = useNavigate();
    return (
        <Chip
            label={status}
            onClick={(event) => { event.stopPropagation(); event.nativeEvent.stopImmediatePropagation(); navigate(`${AppRoutes.analyses}?status=${status}`); }}
            sx={{ backgroundColor: STATUS_COLORS[status] ?? 'grey.300', color: 'black' }}
        />
    );
}
