import { useEffect, useState } from 'react'
import { useParams } from "react-router";
import { Container, Stack, Typography, Skeleton, Box, Divider, IconButton, Tooltip } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ObsTypeChip, ObservationInfoModal } from '@components/observations';

import { ObservationIcon } from '@assets/icons';
import { getObservation } from '@api/observation';
import { formatTimestamp } from '@utils/formatters';
import { ErrorMessage } from '@components/general/error';
import { RunObjectTabs } from '@components/general/run_object_tabs';

function ObservationDetail() {
    let params = useParams();
    let natural_key = params.natural_key!;

    const [infoOpen, setInfoOpen] = useState(false);

    const { data: observation, isLoading, isError, error } = getObservation(natural_key);

    useEffect(() => {
        document.title = "Observation " + natural_key;
    }, [observation]);

    if (isError || (!isLoading && !observation)) {
        return (
            <ErrorMessage do_reporting={false} message={error?.message || "Observation not found."} />
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
                    <ObservationIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize, display: 'block' }} />
                   {observation?.name ? <Typography variant='h3' sx={{ lineHeight: 1, m: 0 }}> {observation?.name}</Typography> : <Typography variant='h3' sx={{ lineHeight: 1, m: 0 }}> {observation?.display_name}</Typography>}
                    <Box sx={{ display: 'flex', alignItems: 'center', alignSelf: 'stretch' }}>
                        {observation?.obs_type && <ObsTypeChip obs_type={observation?.obs_type} />}
                    </Box>
                   <Box sx={{ flexGrow: 1 }} />
                   <Tooltip title="Observation info">
                       <IconButton onClick={() => setInfoOpen(true)}>
                           <InfoOutlinedIcon />
                       </IconButton>
                   </Tooltip>
                </Stack>
            </Box>
            {observation && <ObservationInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} observation={observation} />}
            {observation?.description &&<Typography variant='subtitle1' >
                {observation?.description}
            </Typography>}
            <Typography variant='subtitle2' sx={{ marginTop: '1em' }}>
                {`Observed: ${formatTimestamp(new Date((observation?.acq_timestamp ?? 0) * 1000).toISOString())} UT`}
            </Typography>
            <Divider sx={{ width: '100%' }} />
            <RunObjectTabs observationId={observation?.id} />
        </>
    )
}

export default ObservationDetail
