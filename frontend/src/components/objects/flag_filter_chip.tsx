import { Chip, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';

export type FilterState = 'none' | 'include' | 'exclude';

// resolves a dotted mui palette path (ex. 'error.light'); falls back to the raw value for a literal CSS color (ex. '#3A3335')
function paletteColor(palette: any, path: string): string {
    const resolved = path.split('.').reduce((node, key) => node?.[key], palette);
    return typeof resolved === 'string' ? resolved : path;
}

export function FlagFilterChip({ label, description, colorPath, state, onClick }: { label: string, description?: string, colorPath: string, state: FilterState, onClick: () => void }) {
    const color = (theme: any) => paletteColor(theme.palette, colorPath);

    return (
        <Tooltip title={description ?? label}>
            <Chip
                label={label}
                onClick={onClick}
                sx={{
                    border: "2px solid",
                    borderColor: color,
                    backgroundColor: state === 'include' ? color : 'transparent',
                    backgroundImage: state === 'exclude'
                        ? (theme: any) => `repeating-linear-gradient(45deg, ${alpha(color(theme), 0.4)}, ${alpha(color(theme), 0.1)} 4px, transparent 4px, transparent 8px)`
                        : undefined,
                    color: state === 'include' ? (theme) => theme.palette.getContrastText(color(theme)) : color,
                    "&:hover": {
                        backgroundColor: state === 'include' ? color : undefined,
                    },
                }}
            />
        </Tooltip>
    );
}
