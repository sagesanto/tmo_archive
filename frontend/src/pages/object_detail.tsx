import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from "react-router";
import { Card, Container, Box, Stack, Typography, Divider, Button } from '@mui/material'
import { OpenInNew } from '@mui/icons-material'
import image_defaults from '@config/image_defaults';
import { ObjectIcon, HomeIcon, AnalysisIcon, CutoutIcon, ProposalIcon, FlagIcon } from '@assets/icons';
import { getObject, Object } from '@api/object';
import { AnalysisChip } from '@components/analyses';
import { ResultsDBChip } from '@components/results_dbs';
import { DatasetChip } from '@components/datasets';
import { ClassificationChip } from '@components/objects/classification_chip';
import { formatTimestamp, formatRA, formatDec } from '@utils/formatters';
import { ErrorMessage } from '@components/general/error';
import { ObjectSyntheticImage } from '@components/images';
// import { useDispatch, useSelector } from 'react-redux';
// import cutout_defaults from '@config/cutout_defaults';
// import { removeDetailCutoutGroup, setDetailCutoutGroup } from '@state/uiSlice';

function StatRow({ label, value }: { label: string, value: React.ReactNode }) {
    return (
        <>
            <Typography variant='body2' color='text.secondary'>{label}</Typography>
            <Typography variant='body1' sx={{ fontWeight: 'bold' }}>{value}</Typography>
        </>
    );
}

export function ObjectDetailPage() {
    let params = useParams();
    let natural_key = params.natural_key;
    // const groups = useSelector((state) => state.detailCutouts.groups)
    // let dispatch = useDispatch()

    let navigate = useNavigate();

    const { data: object, isLoading, isError, error } = getObject(natural_key);

    // const { data: flags, flagLoading, flagError } = getFlagsByObject(oid);

    useEffect(() => {
        document.title = "Object " + natural_key;
    }, []);

    if (isError || (!isLoading && !object)) {
        return (
            <ErrorMessage do_reporting={false} message={error?.message || "Unknown error while loading object"} />
        );
    }

    if (isLoading) {
        return (
            <> </>
        )
    }

    if (isError) {
        document.title = "Object not found";
        return (
            <Container>
            <Stack direction="column" spacing={2} alignItems={'start'} sx={{ width: '100%' }}>
                <Typography variant='h3'>  Something's Afoot :( </Typography>
                <Typography variant='h4'> {`Error loading object`} </Typography>
            </Stack>
            </Container>
        )
    }

    return (
        <Stack spacing={3} sx={{ width: '100%', padding: 3 }}>
            <Stack direction="row" spacing={2} alignItems='center' sx={{ width: '100%' }}>
                <ObjectIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize, display: 'block' }} />
                <Typography variant='h3' sx={{ lineHeight: 1, m: 0 }}>{object?.display_name}</Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems={'center'}>
                {object?.classification && <ClassificationChip classification={object.classification} />}
                <AnalysisChip natural_key={object.analysis_run_key ?? ''} />
                <ResultsDBChip natural_key={object.results_db_key ?? ''} />
                <DatasetChip natural_key={object?.dataset_key ?? ''} />
            </Stack>

            <Card elevation={3} sx={{ width: '100%', padding: 3, borderRadius: 2 }}>
                <Stack direction="row" spacing={4} alignItems="flex-start">
                    <Box sx={{ width: image_defaults.thumbnail_size, flexShrink: 0, borderRadius: 1, overflow: 'hidden', border: (theme) => `1px solid ${theme.palette.divider}` }}>
                        <ObjectSyntheticImage object_key={object?.natural_key} />
                    </Box>
                    <Stack direction="column" spacing={2} sx={{ height: '100%' }} justifyContent="space-between">
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: 'auto auto',
                            columnGap: 3,
                            rowGap: 1,
                            justifyContent: 'start',
                            alignItems: 'baseline',
                        }}>
                            <StatRow label="SNR" value={object?.snr.toFixed(2)} />
                            <StatRow label="Magnitude" value={object?.magnitude?.toFixed(2) ?? "None"} />
                            <StatRow label="Velocity (RA / DEC)" value={`${object?.v_ra ? object.v_ra.toFixed(4) : "None"}"/s | ${object?.v_dec ? object.v_dec.toFixed(4) : "None"}"/s`} />
                            <StatRow label="Position (RA / DEC)" value={`${formatRA(object?.ra ?? 0)} | ${formatDec(object?.dec ?? 0)}`} />
                            <StatRow label="Frames / Children" value={`${object?.num_frames} / ${object?.cluster_children}`} />
                        </Box>
                        <Button
                            variant="outlined"
                            size="small"
                            endIcon={<OpenInNew fontSize="small" />}
                            href={`https://aladin.cds.unistra.fr/AladinLite/?target=${object.ra} ${object.dec}&fov=0.0833333333&survey=P/DSS2/color`}
                            target="_blank"
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            View in Aladin
                        </Button>
                    </Stack>
                </Stack>
            </Card>



            <Divider sx={{ width: '100%' }} />
            <Typography variant='subtitle2' color='text.secondary'>
                {`Analyzed: ${formatTimestamp(object?.analysis_time)} UT | Observed: ${formatTimestamp(object?.obs_time)}`}
            </Typography>
        </Stack>
    )
}

export default ObjectDetailPage;
