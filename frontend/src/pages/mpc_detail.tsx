import { useEffect, useState } from 'react';
import { useParams } from "react-router";
import { Stack, Typography, CircularProgress, Table, TableBody, TableRow, TableCell, Tabs, Tab, Box, Link as MuiLink } from '@mui/material';
import { MPCIcon } from '@assets/icons';
import { getMPCIdentification } from '@api/mpc';
import { getObservationsCount } from '@api/observation';
import { getAnalysesCount } from '@api/analysis';
import { FilteredCollectionLengthChip } from '@components/general';
import { AnalysisDisplay } from '@components/analyses';
import { ObservationDisplay } from '@components/observations';
import { ObjectDisplay } from '@components/objects/object_display';
import { Object } from '@api/object';

function MPCDetail() {
    let params = useParams();
    let designation = params.designation!;

    const [tab, setTab] = useState(0);
    const [selectedObj, setSelectedObj] = useState<Object[]>([]);

    const { data: info, isLoading, isError } = getMPCIdentification(designation);
    const { data: nObservations } = getObservationsCount({ designation });
    const { data: nAnalyses } = getAnalysesCount({ designation });

    useEffect(() => {
        document.title = "MPC " + designation;
    }, [designation]);

    return (
        <Stack spacing={2} sx={{ width: '100%', height: '100%', flexGrow: 1, minHeight: 0 }}>
            <Stack direction="row" spacing={2} alignItems="center">
                <MPCIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize }} />
                <Typography variant='h3' sx={{ lineHeight: 1, m: 0 }}>{designation}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', alignSelf: 'stretch' }}>
                    <FilteredCollectionLengthChip matching={nObservations ?? 0} total={nAnalyses ?? 0} tooltip="Observations / Analyses" />
                </Box>
            </Stack>

            {isLoading && <CircularProgress />}

            {!isLoading && isError && (
                <Typography variant='body1'>No MPC record found for this designation.</Typography>
            )}

            {!isLoading && info && (
                <Table size="small" sx={{ maxWidth: 500 }}>
                    <TableBody>
                        <TableRow>
                            <TableCell>IAU Designation</TableCell>
                            <TableCell>
                                {info.desig_page
                                    ? <MuiLink href={info.desig_page} target="_blank" rel="noopener noreferrer">{info.iau_desig}</MuiLink>
                                    : info.iau_desig}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Status</TableCell>
                            <TableCell>
                                <Typography component="span" sx={{ fontWeight: 'bold', color: info.status_name === 'Confirmed' ? 'success.main' : 'error.main' }}>
                                    {info.status_name}
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Reference</TableCell>
                            <TableCell>
                                {info.reference_page
                                    ? <MuiLink href={info.reference_page} target="_blank" rel="noopener noreferrer">{info.reference}</MuiLink>
                                    : info.reference}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            )}

            <Box sx={{ width: '100%', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <Tabs value={tab} onChange={(_, value) => setTab(value)}>
                    <Tab label="Analyses" />
                    <Tab label="Observations" />
                    <Tab label="Objects" />
                </Tabs>
                <Box sx={{ width: '100%', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingTop: '1em' }}>
                    {tab === 0 && <AnalysisDisplay title="Analyses" designation={designation} />}
                    {tab === 1 && <ObservationDisplay title="Observations" designation={designation} />}
                    {tab === 2 && <ObjectDisplay title="Objects" designation={designation} selected={selectedObj} setSelected={setSelectedObj} />}
                </Box>
            </Box>
        </Stack>
    );
}

export default MPCDetail;
