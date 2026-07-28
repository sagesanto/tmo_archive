import { Chip, Tooltip } from '@mui/material';

export function CollectionLengthChip({ length, tooltip = "Count", sx = {} }: { length: number, tooltip?: string, sx?: object }) {
    return (
        <Tooltip title={tooltip}>
            <Chip label={length} sx={sx} />
        </Tooltip>
    )
}
