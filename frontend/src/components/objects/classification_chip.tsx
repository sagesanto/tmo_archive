import { Chip } from '@mui/material';
import { useNavigate } from 'react-router';
import { AppRoutes } from "@config/routes";

export function ClassificationChip({ classification }: { classification: string }) {
    let navigate = useNavigate();
    return (
        <Chip
            label={classification}
            variant="outlined"
            onClick={(event) => { event.stopPropagation(); event.nativeEvent.stopImmediatePropagation(); navigate(`${AppRoutes.objects}?classification=${classification}`); }}
        />
    );
}
