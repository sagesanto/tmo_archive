import { Chip, Tooltip } from '@mui/material';

export function CollectionLengthChip({ length, tooltip = "Count", sx = {} }: { length: number, tooltip?: string, sx?: object }) {
    return (
        <Tooltip title={tooltip}>
            <Chip label={length} sx={sx} />
        </Tooltip>
    )
}

export function FilteredCollectionLengthChip({ matching, total, tooltip = "Matching / Total", sx = {} }: { matching: number, total: number, tooltip?: string, sx?: object }) {
    return (
        <Tooltip title={tooltip}>
            <Chip label={`${matching} / ${total}`} sx={sx} />
        </Tooltip>
    )
}
