import { getObservation } from '@api/observation';
import { Chip } from '@mui/material';
import { ObservationIcon } from '@assets/icons';
import { useNavigate } from 'react-router';
import { AppRoutes } from "@config/routes"
import { DisplayChip } from '@components/general';

export function ObservationChip({ natural_key }: { natural_key: string }) {
    const { data: observation, isLoading, isError } = getObservation(natural_key);

    let navigate = useNavigate();

    if (isLoading) {
        return (
            <Chip
                icon={<ObservationIcon />}
                label="Loading..."
            />
        );
    }

    if (isError || (!isLoading && !observation)) {
        return (
            <Chip
                icon={<ObservationIcon />}
                label="Error :("
            />
        );
    }

    return (
        <DisplayChip
            icon={<ObservationIcon />}
            label={observation?.name ? `${observation?.name}` : `${observation?.display_name}`}
            onClick={() => navigate(`${AppRoutes.observations}/${natural_key}`)}
            color='secondary'
        />
    );
}
