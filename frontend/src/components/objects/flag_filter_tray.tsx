import { Box, Button, Stack } from '@mui/material';
import { getFlags } from '@api/flag';
import { FilterState, FlagFilterChip } from './flag_filter_chip';

export const NO_FLAGS_KEY = 'no_flags';

export type FlagFilterState = Record<string, 'include' | 'exclude'>;

export function FlagFilterTray({ state, onChange }: { state: FlagFilterState, onChange: (state: FlagFilterState) => void }) {
    const { data: flags } = getFlags();

    function cycle(key: string) {
        const next = { ...state };
        if (!(key in next)) {
            next[key] = 'include';
        } else if (next[key] === 'include') {
            next[key] = 'exclude';
        } else {
            delete next[key];
        }
        onChange(next);
    }

    return (
        <Stack direction="row" spacing={1} useFlexGap alignItems={'center'} sx={{ width: '100%', flexWrap: 'wrap' }}>
            {flags?.map((flag) => (
                <FlagFilterChip
                    key={flag.id}
                    label={flag.name}
                    description={flag.description}
                    colorPath={flag.color}
                    state={(state[flag.id] as FilterState) ?? 'none'}
                    onClick={() => cycle(String(flag.id))}
                />
            ))}
            <FlagFilterChip
                label="No Flags"
                description="Objects with no flags attached"
                colorPath="grey.500"
                state={(state[NO_FLAGS_KEY] as FilterState) ?? 'none'}
                onClick={() => cycle(NO_FLAGS_KEY)}
            />
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" variant="outlined" onClick={() => onChange({})}>
                Clear
            </Button>
        </Stack>
    );
}
