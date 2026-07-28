import { useEffect } from 'react'
import { useParams } from "react-router";
import { Container, Stack, Typography, Skeleton, Box, Divider } from '@mui/material'

import { DatasetIcon } from '@assets/icons';
import { getDataset } from '@api/dataset';
import { formatTimestamp } from '@utils/formatters';
import { ErrorMessage } from '@components/general/error';
import { RunObjectTabs } from '@components/general/run_object_tabs';

function DatasetDetail() {
    let params = useParams();
    let natural_key = params.natural_key!;

    const { data: dataset, isLoading, isError, error } = getDataset(natural_key);

    useEffect(() => {
        document.title = "Dataset " + natural_key;
    }, [dataset]);

    if (isError || (!isLoading && !dataset)) {
        return (
            <ErrorMessage do_reporting={false} message={error?.message || "Dataset not found."} />
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
                    <DatasetIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize, display: 'block' }} />
                    <Typography variant='h3' sx={{ lineHeight: 1, m: 0 }}> {dataset?.display_name}</Typography>
                </Stack>
            </Box>
            <Typography variant='subtitle2' sx={{ marginTop: '1em' }}>
                {`Observed: ${formatTimestamp(new Date((dataset?.acq_timestamp ?? 0) * 1000).toISOString())} UT`}
            </Typography>
            <Divider sx={{ width: '100%' }} />
            <RunObjectTabs datasetId={dataset?.id} />
        </>
    )
}

export default DatasetDetail
