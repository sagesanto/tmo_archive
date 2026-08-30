import { Chip, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router';
import { Tag } from '@api/tag';
import { AppRoutes } from '@config/routes';

// resolves a dotted mui palette path (ex. 'error.light'); falls back to the raw value for a literal CSS color (ex. '#3A3335')
function paletteColor(palette: any, path: string): string {
    const resolved = path.split('.').reduce((node, key) => node?.[key], palette);
    return typeof resolved === 'string' ? resolved : path;
}

// tags are attached automatically during ingest, not user-editable, so this chip is static by default.
// pass toFilter to make it navigate to the observations list filtered to this tag instead.
export function TagChip({ tag, toFilter }: { tag: Tag, toFilter?: boolean }) {
    let navigate = useNavigate();
    const color = (theme: any) => paletteColor(theme.palette, tag.color);

    return (
        <Tooltip title={tag.description}>
            <Chip
                label={tag.name}
                onClick={toFilter ? (event) => {
                    event.stopPropagation();
                    event.nativeEvent.stopImmediatePropagation();
                    navigate(`${AppRoutes.observations}?tags=${tag.id}:include`);
                } : undefined}
                sx={{
                    border: "2px solid",
                    borderColor: color,
                    backgroundColor: color,
                    color: (theme) => theme.palette.getContrastText(color(theme)),
                    cursor: toFilter ? 'pointer' : 'default',
                }}
            />
        </Tooltip>
    );
}
