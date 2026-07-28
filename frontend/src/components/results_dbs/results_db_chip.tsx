import { getResultsDB } from '@api/results_db';
import { Chip } from '@mui/material';
import { ResultsDBIcon } from '@assets/icons';
import { useNavigate } from 'react-router';
import { AppRoutes } from "@config/routes"
import { DisplayChip } from '@components/general';

export function ResultsDBChip({ natural_key }: { natural_key: string }) {
    const { data: results_db, isLoading, isError } = getResultsDB(natural_key);

    let navigate = useNavigate();

    if (isLoading) {
        return (
            <Chip
                icon={<ResultsDBIcon />}
                label="Loading..."
            />
        );
    }

    if (isError || (!isLoading && !results_db)) {
        return (
            <Chip
                icon={<ResultsDBIcon />}
                label="Error :("
            />
        );
    }

    return (
        <DisplayChip
            icon={<ResultsDBIcon />}
            label={`${results_db?.display_name}`}
            onClick={() => navigate(`${AppRoutes.results_dbs}/${natural_key}`)}
            color='secondary'
        />
    );
}
