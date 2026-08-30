import { useState, useEffect } from 'react'
import { useParams, useNavigate } from "react-router";
import { Container, Stack, Typography, Skeleton, Grid, Divider, Button, Box, Tooltip, IconButton } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';

import { AnalysisIcon, RemoveFromCatalogIcon, EditIcon, ObjectIcon } from '@assets/icons';
import { getAnalysis } from '@api/analysis';
import { getMPCEncounter } from '@api/mpc_encounter';
import { MPCChip } from '@components/mpc/candidate_chip';
// import { UserChip } from '@components/users';
import { ResultsDBChip } from '@components/results_dbs';
import { ObservationChip } from '@components/observations';
import { StatusChip, MetricsInfoModal, MetricsBox } from '@components/analyses';
import { ObjectImageTabs } from '@components/general/object_image_tabs';
import { formatTimestamp } from '@utils/formatters';
import { useErrorReports, useNotifs } from '@hooks/index';
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
    const { data: mpc } = getMPCEncounter({ analysis_id: run_record?.id }, Boolean(run_record?.id));

    const [infoOpen, setInfoOpen] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);

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
            {/* <MetricsInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} metrics={run_record?.metrics} /> */}
            {fullscreen ? (
                <Box
                    onClick={() => setFullscreen(false)}
                    sx={{
                        width: '100%', py: 0.25, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: 'action.hover',
                        '&:hover': { backgroundColor: 'action.selected' },
                    }}
                >
                    <UnfoldMoreIcon fontSize="small" />
                    <Typography variant='caption' sx={{ ml: 0.5 }}>Expand</Typography>
                </Box>
            ) : (
                <Stack direction="column" spacing={2} alignItems='flex-start' sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Stack direction="row" spacing={2} alignItems='center' sx={{ width: '100%' }}>
                            <AnalysisIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize, display: 'block' }} />
                            <Typography variant='h3' sx={{ lineHeight: 1, m: 0 }}> {run_record?.display_name}</Typography>
                            {run_record?.status && (
                                <Box sx={{ display: 'flex', alignItems: 'center', alignSelf: 'stretch' }}>
                                    <StatusChip status={run_record.status} />
                                </Box>
                            )}

                            {/* <Box sx={{ flexGrow: 1 }} />
                            <Tooltip title="Analysis metrics">
                                <IconButton onClick={() => setInfoOpen(true)}>
                                    <InfoOutlinedIcon />
                                </IconButton>
                            </Tooltip> */}
                        </Stack>
                    </Box>
                    <Box sx={{ position: 'relative', width: '100%' }}>
                        <Grid container spacing={1} alignItems={'center'} sx={{ height: 'grow' }}>
                            {mpc && (<MPCChip designation={mpc.designation} />)}
                            <ResultsDBChip natural_key={run_record?.results_db_key ?? ''} />
                            <ObservationChip natural_key={run_record?.observation_key ?? ''} />
                        </Grid>
                        <Typography variant='subtitle2' sx={{ marginTop: '1em' }}>
                            {`Run: ${formatTimestamp(run_record?.analysis_time)} UT | Observed: ${formatTimestamp(run_record?.obs_time)}`}
                        </Typography>
                        <Box sx={{ position: 'absolute', right: 0, bottom: 0 }}>
                            <MetricsBox metrics={run_record?.metrics} sky_mag={run_record?.sky_mag} detection_limit_mag={run_record?.detection_limit_mag} />
                        </Box>
                    </Box>
                </Stack>
            )}
            {!fullscreen && <Divider sx={{ width: '100%' }} />}
            <ObjectImageTabs analysisKey={natural_key} fullscreen={fullscreen} onToggleFullscreen={() => setFullscreen((f) => !f)} />
        </>
    )
}

export default AnalysisDetail
