import { Chip, Tooltip } from '@mui/material';
import { EntityTarget, Flag, useAddFlagToObject, useRemoveFlagFromObject, useAddFlagToEntity, useRemoveFlagFromEntity } from '@api/flag';
import { formatTimestamp } from '@utils/formatters';

// resolves a dotted mui palette path, ex. 'error.light'
function paletteColor(palette: any, path: string): string {
    return path.split('.').reduce((node, key) => node?.[key], palette);
}

// what to call each scope in a tooltip, matching the flag names ("Bad Dataset", "Bad Analysis")
const SCOPE_LABELS: Record<string, string> = {
    observation: 'dataset',
    run: 'analysis',
    mpc: 'MPC object',
};

// objectKey is optional - pass it to make the chip toggle the flag on/off that object.
// a non-object flag shown here is inherited from an ancestor: it keeps the flag's color but gets a
// dashed outline and no click, since it has to be toggled on the ancestor (see EntityFlagToggle).
// flag.attached present -> chip is filled. absent -> outlined.
export function FlagChip({ flag, objectKey }: { flag: Flag, objectKey?: string }) {
    const addFlag = useAddFlagToObject();
    const removeFlag = useRemoveFlagFromObject();

    const attached = Boolean(flag.attached);
    const inherited = flag.scope !== 'object';

    const toggle = objectKey && !inherited
        ? () => attached
            ? removeFlag.mutate({ object_key: objectKey, flag_id: flag.id })
            : addFlag.mutate({ object_key: objectKey, flag_id: flag.id })
        : undefined;

    let tooltip = flag.description;
    if (attached) tooltip += ` | Attached ${formatTimestamp(flag.attached)} UT`;
    if (inherited) tooltip += ` | Set on the ${SCOPE_LABELS[flag.scope] ?? 'parent'}`;

    const color = (theme: any) => paletteColor(theme.palette, flag.color);

    return (
        <Tooltip title={tooltip}>
            <Chip
                label={flag.name}
                onClick={toggle}
                sx={{
                    border: "2px",
                    borderStyle: inherited ? "dashed" : "solid",
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

// how the un-set state reads on the parent's own page. the off state is a neutral "this is fine"
// rather than an empty outline of the bad flag, which looked like it was already set
const OFF_STATE: Record<string, { label: string, tooltip: string }> = {
    'Bad Dataset': { label: 'Valid Data', tooltip: 'Click to mark as bad data' },
    'Bad Analysis': { label: 'Valid Analysis', tooltip: 'Click to mark as a bad analysis' },
};

// the toggle for an entity-scoped flag, shown on the page of the thing it is attached to.
// every object under that parent inherits the flag, so this is the only place it can be set.
export function EntityFlagToggle({ flag, entity }: { flag: Flag, entity: EntityTarget }) {
    const addFlag = useAddFlagToEntity();
    const removeFlag = useRemoveFlagFromEntity();

    const attached = Boolean(flag.attached);
    const off = OFF_STATE[flag.name] ?? { label: flag.name, tooltip: flag.description };

    const toggle = () => attached
        ? removeFlag.mutate({ ...entity, flag_id: flag.id })
        : addFlag.mutate({ ...entity, flag_id: flag.id });

    const tooltip = attached
        ? `${flag.description} | Attached ${formatTimestamp(flag.attached)} UT | Click to remove`
        : off.tooltip;

    const color = (theme: any) => attached ? paletteColor(theme.palette, flag.color) : theme.palette.text.secondary;

    return (
        <Tooltip title={tooltip}>
            <Chip
                label={attached ? flag.name : off.label}
                onClick={toggle}
                sx={{
                    border: "2px solid",
                    borderColor: color,
                    backgroundColor: attached ? color : "transparent",
                    color: attached ? (theme) => theme.palette.getContrastText(color(theme)) : color,
                    cursor: "pointer",
                    "&:hover": {
                        backgroundColor: color,
                        color: (theme) => theme.palette.getContrastText(color(theme)),
                        borderColor: color,
                    },
                }}
            />
        </Tooltip>
    );
}
