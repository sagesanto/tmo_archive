import { DatasetIcon } from '@assets/icons';
import { Dataset, getDataset } from '@api/dataset';
import { Typography, Stack, IconButton } from '@mui/material';
import { PageviewOutlined } from "@mui/icons-material"
import { Link, useNavigate } from 'react-router';
import { CardContainer, CollectionLengthChip, MediumLoadingCard } from '@components/general';
import { AppRoutes } from '@config/routes';
import { formatTimestamp } from '@utils/formatters';

export function DatasetCard({ natural_key }: { natural_key: string }) {
    const { data: dataset, isLoading, isError } = getDataset(natural_key);

    if (isError || (!isLoading && !dataset)) {
        return (
            <CardContainer>
                <Typography> Error loading dataset :( </Typography>
            </CardContainer>
        );
    }

    if (isLoading) {
        return (
            <MediumLoadingCard />
        );
    }

    return (
        <Link to={`${AppRoutes.datasets}/${natural_key}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <CardContainer>
                <DatasetCardContent dataset={dataset} />
            </CardContainer>
        </Link>
    );
}


export function DatasetCardContent({ dataset }: { dataset: Dataset }) {
    let navigate = useNavigate();
    return (
        <Stack direction="column" spacing={2} padding={0.5} alignItems={'flex-start'} justifyContent={"center"} sx={{ width: '100%' }}>
            <Stack direction="row" spacing={2} alignItems={'space-between'} sx={{ width: '100%' }}>
                <Stack direction="row" spacing={2} alignItems={'center'} sx={{ width: '100%' }}>
                    <DatasetIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize, display: 'block' }} />
                    <Stack direction="column" spacing={2} padding={0.5} alignItems={'flex-start'} justifyContent={"center"} sx={{ width: '100%' }}>
                        <Stack direction="row" spacing={1} alignItems={'center'}>
                            <Typography variant='h5' sx={{ whiteSpace: "nowrap", flexShrink: 0 }}> {dataset.display_name} </Typography>
                            <CollectionLengthChip length={dataset.n_runs} tooltip="Analysis Runs" />
                        </Stack>
                        <Typography variant='subtitle1'>Observed {formatTimestamp(new Date(dataset.acq_timestamp * 1000).toISOString())}</Typography>
                    </Stack>
                </Stack>
                <IconButton className='hover-child' sx={{ opacity: 0 }} onClick={(event) => { event.stopPropagation(); navigate(`${AppRoutes.datasets}/${dataset.natural_key}`) }}>
                    <PageviewOutlined sx={{ fontSize: (theme) => theme.typography.h4.fontSize, color: 'primary.main' }} />
                </IconButton>
            </Stack>
        </Stack>
    );
}
