import { getDataset } from '@api/dataset';
import { Chip } from '@mui/material';
import { DatasetIcon } from '@assets/icons';
import { useNavigate } from 'react-router';
import { AppRoutes } from "@config/routes"
import { DisplayChip } from '@components/general';

export function DatasetChip({ natural_key }: { natural_key: string }) {
    const { data: dataset, isLoading, isError } = getDataset(natural_key);

    let navigate = useNavigate();

    if (isLoading) {
        return (
            <Chip
                icon={<DatasetIcon />}
                label="Loading..."
            />
        );
    }

    if (isError || (!isLoading && !dataset)) {
        return (
            <Chip
                icon={<DatasetIcon />}
                label="Error :("
            />
        );
    }

    return (
        <DisplayChip
            icon={<DatasetIcon />}
            label={`${dataset?.display_name}`}
            onClick={() => navigate(`${AppRoutes.datasets}/${natural_key}`)}
            color='secondary'
        />
    );
}
