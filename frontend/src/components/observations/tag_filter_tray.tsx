import { Box, Button, Stack } from '@mui/material';
import { getTags } from '@api/tag';
import { FilterState, FlagFilterChip } from '@components/objects/flag_filter_chip';

export const NO_TAGS_KEY = 'no_tags';

export type TagFilterState = Record<string, 'include' | 'exclude'>;

// url-safe serialization so filter state can live in search params
export function encodeTagFilters(state: TagFilterState): string {
    return Object.entries(state).map(([key, val]) => `${key}:${val}`).join(',');
}

export function decodeTagFilters(raw: string | null): TagFilterState | null {
    if (raw === null) return null; // not present in url yet, distinct from "cleared" ({})
    if (raw === '') return {};
    const state: TagFilterState = {};
    for (const pair of raw.split(',')) {
        const [key, val] = pair.split(':');
        if (key && (val === 'include' || val === 'exclude')) state[key] = val;
    }
    return state;
}

export function TagFilterTray({ state, onChange }: { state: TagFilterState, onChange: (state: TagFilterState) => void }) {
    const { data: tags } = getTags();

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
            {tags?.map((tag) => (
                <FlagFilterChip
                    key={tag.id}
                    label={tag.name}
                    description={tag.description}
                    colorPath={tag.color}
                    state={(state[tag.id] as FilterState) ?? 'none'}
                    onClick={() => cycle(String(tag.id))}
                />
            ))}
            <FlagFilterChip
                label="Untagged"
                description="Observations with no tags attached"
                colorPath="grey.500"
                state={(state[NO_TAGS_KEY] as FilterState) ?? 'none'}
                onClick={() => cycle(NO_TAGS_KEY)}
            />
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" variant="outlined" onClick={() => onChange({})}>
                Clear
            </Button>
        </Stack>
    );
}
