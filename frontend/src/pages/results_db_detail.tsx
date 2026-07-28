import { useEffect } from 'react'
import { useParams } from "react-router";
import { Container, Stack, Typography, Skeleton, Box, Divider } from '@mui/material'

import { ResultsDBIcon } from '@assets/icons';
import { getResultsDB } from '@api/results_db';
import { formatTimestamp } from '@utils/formatters';
import { ErrorMessage } from '@components/general/error';
import { RunObjectTabs } from '@components/general/run_object_tabs';

function ResultsDBDetail() {
    let params = useParams();
    let natural_key = params.natural_key!;

    const { data: results_db, isLoading, isError, error } = getResultsDB(natural_key);

    useEffect(() => {
        document.title = "Results Database " + natural_key;
    }, [results_db]);

    if (isError || (!isLoading && !results_db)) {
        return (
            <ErrorMessage do_reporting={false} message={error?.message || "Results database not found."} />
        );
    }

    if (isLoading) {
        return (
            <Container sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Skeleton variant="text" sx={{ fontSize: (theme) => theme.typography.h3.fontSize }} width='100%' />
                <Stack spacing={2}>
                    <Skeleton variant="rectangular" width='100%' height={60} />
                    {[...Array(5).keys()].map((i) => (
                        <Skeleton key={i} variant="rectangular" width='100%' height={60} />
                    ))}
                </Stack>
            </Container>
        );
    }

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Stack direction="row" spacing={2} alignItems='center' sx={{ width: '100%' }}>
                    <ResultsDBIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize, display: 'block' }} />
                    <Typography variant='h3' sx={{ lineHeight: 1, m: 0 }}> {results_db?.display_name}</Typography>
                </Stack>
            </Box>
            <Typography variant='subtitle2' sx={{ marginTop: '1em' }}>
                {`Ingested: ${formatTimestamp(results_db?.date_ingested)} UT | Updated: ${formatTimestamp(results_db?.date_updated)} UT`}
            </Typography>
            <Divider sx={{ width: '100%' }} />
            <RunObjectTabs resultsDbId={results_db?.id} />
        </>
    )
}

export default ResultsDBDetail
