import { Chip, Tooltip } from '@mui/material';
import { Flag, useAddFlagToObject, useRemoveFlagFromObject } from '@api/flag';
import { formatTimestamp } from '@utils/formatters';

// resolves a dotted mui palette path, ex. 'error.light'
function paletteColor(palette: any, path: string): string {
    return path.split('.').reduce((node, key) => node?.[key], palette);
}

// objectKey is optional - pass it to make the chip toggle the flag on/off that object.
// omit it (ex. when the chip appears in a summary card) to render a static, non-clickable chip.
// flag.attached present -> chip is filled. absent -> outlined.
export function FlagChip({ flag, objectKey }: { flag: Flag, objectKey?: string }) {
    const addFlag = useAddFlagToObject();
    const removeFlag = useRemoveFlagFromObject();
    const attached = Boolean(flag.attached);

    const tooltip = attached
        ? `${flag.description} | Attached ${formatTimestamp(flag.attached)} UT`
        : flag.description;

    const color = (theme: any) => paletteColor(theme.palette, flag.color);

    const toggle = objectKey
        ? () => attached
            ? removeFlag.mutate({ object_key: objectKey, flag_id: flag.id })
            : addFlag.mutate({ object_key: objectKey, flag_id: flag.id })
        : undefined;

    return (
        <Tooltip title={tooltip}>
            <Chip
                label={flag.name}
                onClick={toggle}
                sx={{
                    border: "2px solid",
                    borderColor: color,
                    backgroundColor: attached ? color : "transparent",
                    color: attached ? (theme) => theme.palette.getContrastText(color(theme)) : color,
                    cursor: toggle ? "pointer" : "default",
                    "&:hover": toggle ? {
                        backgroundColor: color,
                        color: (theme) => theme.palette.getContrastText(color(theme)),
                        borderColor: color,
                    } : undefined,
                }}
            />
        </Tooltip>
    );
}
