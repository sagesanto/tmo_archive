import { AnalysisIcon } from '@assets/icons';
import { Analysis, getAnalysis } from '@api/analysis';
import { Typography, Stack, IconButton } from '@mui/material';
import { PageviewOutlined } from "@mui/icons-material"
import { Link, useNavigate } from 'react-router';
import { CardContainer, CollectionLengthChip, MediumLoadingCard } from '@components/general';
import { AppRoutes } from '@config/routes';
import { formatTimestamp } from '@utils/formatters';
import { StatusChip } from './status_chip';

export function AnalysisCard({ natural_key }: { natural_key: string }) {
    const { data: analysis, isLoading, isError } = getAnalysis(natural_key);

    if (isError || (!isLoading && !analysis)) {
        return (
            <CardContainer>
                <Typography> Error loading analysis :( </Typography>
            </CardContainer>
        );
    }

    if (isLoading) {
        return (
            <MediumLoadingCard />
        );
    }

    return (
        <Link to={`${AppRoutes.analyses}/${natural_key}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <CardContainer>
                <AnalysisCardContent analysis={analysis} />
            </CardContainer>
        </Link>
    );
}


export function AnalysisCardContent({ analysis }: { analysis: Analysis }) {
    let navigate = useNavigate();
    return (
        <Stack direction="column" spacing={2} padding={0.5} alignItems={'flex-start'} justifyContent={"center"} sx={{ width: '100%' }}>
            <Stack direction="row" spacing={2} alignItems={'space-between'} sx={{ width: '100%' }}>
                <Stack direction="row" spacing={2} alignItems={'center'} sx={{ width: '100%' }}>
                    <AnalysisIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize, display: 'block' }} />
                    <Stack direction="column" spacing={2} padding={0.5} alignItems={'flex-start'} justifyContent={"center"} sx={{ width: '100%' }}>
                        <Stack direction="row" spacing={1} alignItems={'center'}>
                            <Typography variant='h5' sx={{ whiteSpace: "nowrap", flexShrink: 0 }}> {analysis.display_name} </Typography>
                            <CollectionLengthChip length={analysis.n_objects ?? 0} tooltip="Objects detected" />
                            <StatusChip status={analysis.status} />
                        </Stack>
                        <Typography variant='subtitle1'>Analyzed {formatTimestamp(analysis.analysis_time)} | Observed {formatTimestamp(analysis.obs_time)}</Typography>
                    </Stack>
                </Stack>
                <IconButton className='hover-child' sx={{ opacity: 0 }} onClick={(event) => { event.stopPropagation(); navigate(`${AppRoutes.analyses}/${analysis.natural_key}`) }}>
                    <PageviewOutlined sx={{ fontSize: (theme) => theme.typography.h4.fontSize, color: 'primary.main' }} />
                </IconButton>
            </Stack>
        </Stack>
    );
}
