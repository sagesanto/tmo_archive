import { useState, useEffect } from 'react'
import { useParams, useNavigate } from "react-router";
import { Container, Stack, Typography, Skeleton, Grid, Divider, Button, Box, Tooltip } from '@mui/material'

import { AnalysisIcon, RemoveFromCatalogIcon, EditIcon, ObjectIcon } from '@assets/icons';
import { getAnalysis } from '@api/analysis';
// import { UserChip } from '@components/users';
import { Object } from '@api/object';
import { ResultsDBChip } from '@components/results_dbs';
import { DatasetChip } from '@components/datasets';
import { StatusChip } from '@components/analyses';
import { ObjectDisplay } from '@components/objects/object_display';
// import { getInfo, getPermissionsForRecord } from '@api/meta';
// import { useSelector } from 'react-redux';
// import { AddEditCatalogPopup } from '@components/catalogs';
import { formatTimestamp } from '@utils/formatters';
import { useErrorReports, useNotifs } from '@hooks/index';
// import { UploadObjectsPopup, UploadErrorPopup } from '@components/objects';
import { ErrorMessage } from '@components/general/error';
import { AppRoutes } from '@config/routes';
import { ConfirmationPopup } from '@components/general';

import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

// import { ErrorBoundary, useErrorBoundary } from 'react-error-boundary';

function AnalysisDetail() {
    let navigate = useNavigate();
    // const { updateNotif } = useNotifs();

    // const { reportError } = useErrorReports();

    let params = useParams();
    let natural_key = params.natural_key!;

    const { data: run_record, isLoading, isError, error } = getAnalysis(natural_key);

    const [selectedObj, setSelectedObj] = useState<Object[]>([]);

    useEffect(() => {
        let title = "Analysis " + natural_key;
        document.title = title;
    }, [run_record]);


    if (isError || (!isLoading && !run_record)) {
        return (
            <ErrorMessage do_reporting={false} message={error?.message || "Analysis not found."} />
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
                    <AnalysisIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize, display: 'block' }} />
                    <Typography variant='h3' sx={{ lineHeight: 1, m: 0 }}> {run_record?.display_name}</Typography>
                </Stack>
            </Box>
            <Grid container spacing={1} alignItems={'center'} sx={{ height: 'grow' }}>
                <ResultsDBChip natural_key={run_record?.results_db_key ?? ''} />
                <DatasetChip natural_key={run_record?.dataset_key ?? ''} />
                {run_record?.status && <StatusChip status={run_record.status} />}
            </Grid>
            <Typography variant='subtitle2' sx={{ marginTop: '1em' }}>
                {`Run: ${formatTimestamp(run_record?.analysis_time)} UT | Observed: ${formatTimestamp(run_record?.obs_time)}`}
            </Typography>
            <Divider sx={{ width: '100%' }} />
            <ObjectDisplay
                analysisKey={natural_key}
                title="Objects"
                selected={selectedObj}
                setSelected={setSelectedObj}
            />
        </>
    )
}

export default AnalysisDetail
