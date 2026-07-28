import { MenuItem, Select, SelectChangeEvent } from '@mui/material';

export function SortSelect({ labels, value, onChange }: { labels: string[], value: number, onChange: (index: number) => void }) {
    return (
        <Select size="small" value={value} onChange={(event: SelectChangeEvent<number>) => onChange(Number(event.target.value))} sx={{ minWidth: 180 }}>
            {labels.map((label, i) => (
                <MenuItem key={label} value={i}>{label}</MenuItem>
            ))}
        </Select>
    );
}
