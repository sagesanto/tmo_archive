import { Dialog, DialogTitle, DialogContent, Grid, Stack, Typography } from '@mui/material';
import { Observation } from '@api/observation';
import { capDecimals } from '@utils/formatters';

type FieldEntry = [label: string, value: string | number | null | undefined];

function displayValue(value: string | number | null | undefined) {
    if (value === null || value === undefined) return '—';
    return typeof value === 'number' ? capDecimals(value) : value;
}

function Field({ label, value }: { label: string, value: string | number | null | undefined }) {
    return (
        <Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
            <Typography variant="body2">{displayValue(value)}</Typography>
        </Stack>
    );
}

export function ObservationInfoModal({ open, onClose, observation }: { open: boolean, onClose: () => void, observation: Observation }) {
    const entries: FieldEntry[] = [
        ['Exposure Time (s)', observation.exptime],
        ['Frames', observation.frames],
        ['Filter', observation.filter],
        ['Telescope RA', observation.tele_ra],
        ['Telescope DEC', observation.tele_dec],
        ['Camera', observation.camera_name],
        ['Gain', observation.gain],
        ['Binning Mode', observation.binning_mode],
        ['Operation Mode', observation.operation_mode],
        ['Binning Size', observation.binning_size],
        ['ROI Start X', observation.roi_start_x],
        ['ROI Start Y', observation.roi_start_y],
        ['ROI Width', observation.roi_width],
        ['ROI Height', observation.roi_height],
        ['Cooler On', observation.cooler_on === null ? null : observation.cooler_on ? 'Yes' : 'No'],
        ['Target Temp (°C)', observation.target_temp],
        ['Front Housing Temp (°C)', observation.front_housing_temp],
        ['Rear Housing Temp (°C)', observation.rear_housing_temp],
        ['Camera Temp (°C)', observation.camera_temp],
    ];

    const splitAt = Math.ceil(entries.length / 2);
    const columns = [entries.slice(0, splitAt), entries.slice(splitAt)];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Observation Details</DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    {columns.map((column, i) => (
                        <Grid size={6} key={i}>
                            <Stack spacing={1.5}>
                                {column.map(([label, value]) => (
                                    <Field key={label} label={label} value={value} />
                                ))}
                            </Stack>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>
        </Dialog>
    );
}
