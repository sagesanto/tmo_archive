import { ResultsDBIcon } from '@assets/icons';
import { ResultsDB, getResultsDB } from '@api/results_db';
import { Typography, Stack, IconButton } from '@mui/material';
import { PageviewOutlined } from "@mui/icons-material"
import { Link, useNavigate } from 'react-router';
import { CardContainer, CollectionLengthChip, MediumLoadingCard } from '@components/general';
import { AppRoutes } from '@config/routes';
import { formatTimestamp } from '@utils/formatters';

export function ResultsDBCard({ natural_key }: { natural_key: string }) {
    const { data: results_db, isLoading, isError } = getResultsDB(natural_key);

    if (isError || (!isLoading && !results_db)) {
        return (
            <CardContainer>
                <Typography> Error loading results db :( </Typography>
            </CardContainer>
        );
    }

    if (isLoading) {
        return (
            <MediumLoadingCard />
        );
    }

    return (
        <Link to={`${AppRoutes.results_dbs}/${natural_key}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <CardContainer>
                <ResultsDBCardContent results_db={results_db} />
            </CardContainer>
        </Link>
    );
}


export function ResultsDBCardContent({ results_db }: { results_db: ResultsDB }) {
    let navigate = useNavigate();
    return (
        <Stack direction="column" spacing={2} padding={0.5} alignItems={'flex-start'} justifyContent={"center"} sx={{ width: '100%' }}>
            <Stack direction="row" spacing={2} alignItems={'space-between'} sx={{ width: '100%' }}>
                <Stack direction="row" spacing={2} alignItems={'center'} sx={{ width: '100%' }}>
                    <ResultsDBIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize, display: 'block' }} />
                    <Stack direction="column" spacing={2} padding={0.5} alignItems={'flex-start'} justifyContent={"center"} sx={{ width: '100%' }}>
                        <Stack direction="row" spacing={1} alignItems={'center'}>
                            <Typography variant='h5' sx={{ whiteSpace: "nowrap", flexShrink: 0 }}> {results_db.display_name} </Typography>
                            <CollectionLengthChip length={results_db.n_runs} tooltip="Analysis Runs" />
                        </Stack>
                        <Typography variant='subtitle1'>Last Updated {formatTimestamp(results_db.date_updated)}</Typography>
                    </Stack>
                </Stack>
                <IconButton className='hover-child' sx={{ opacity: 0 }} onClick={(event) => { event.stopPropagation(); navigate(`${AppRoutes.results_dbs}/${results_db.natural_key}`) }}>
                    <PageviewOutlined sx={{ fontSize: (theme) => theme.typography.h4.fontSize, color: 'primary.main' }} />
                </IconButton>
            </Stack>
        </Stack>
    );
}
