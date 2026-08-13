import { Chip } from '@mui/material';
import { useNavigate } from 'react-router';
import { AppRoutes } from "@config/routes";

const OBS_TYPE_COLORS: Record<string, string> = {
    Science: '#c8e6c9',
    Dark: '#cfd8dc',
    Flat: '#fff9c4',
    Bias: '#bbdefb',
    Other: '#eeeeee',
    Unclassified: '#f0daf4',
};

export function ObsTypeChip({ obs_type }: { obs_type: string }) {
    let navigate = useNavigate();
    return (
        <Chip
            label={obs_type}
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); event.nativeEvent.stopImmediatePropagation(); navigate(`${AppRoutes.observations}?obs_types=${obs_type}`); }}
            sx={{ backgroundColor: OBS_TYPE_COLORS[obs_type] ?? 'grey.300', color: 'black' }}
        />
    );
}
