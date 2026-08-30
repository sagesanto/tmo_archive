import { ObservationIcon } from '@assets/icons';
import { Observation, getObservation } from '@api/observation';
import { Typography, Stack, IconButton } from '@mui/material';
import { PageviewOutlined } from "@mui/icons-material"
import { Link, useNavigate } from 'react-router';
import { CardContainer, CollectionLengthChip, MediumLoadingCard } from '@components/general';
import { AppRoutes } from '@config/routes';
import { formatTimestamp } from '@utils/formatters';
import { TagChip } from './tag_chip';

export function ObservationCard({ natural_key }: { natural_key: string }) {
    const { data: observation, isLoading, isError } = getObservation(natural_key);

    if (isError || (!isLoading && !observation)) {
        return (
            <CardContainer>
                <Typography> Error loading observation :( </Typography>
            </CardContainer>
        );
    }

    if (isLoading) {
        return (
            <MediumLoadingCard />
        );
    }

    return (
        <Link to={`${AppRoutes.observations}/${natural_key}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <CardContainer>
                <ObservationCardContent observation={observation} />
            </CardContainer>
        </Link>
    );
}


export function ObservationCardContent({ observation }: { observation: Observation }) {
    let navigate = useNavigate();
    return (
        <Stack direction="column" spacing={2} padding={0.5} alignItems={'flex-start'} justifyContent={"center"} sx={{ width: '100%' }}>
            <Stack direction="row" spacing={2} alignItems={'space-between'} sx={{ width: '100%' }}>
                <Stack direction="row" spacing={2} alignItems={'center'} sx={{ width: '100%' }}>
                    <ObservationIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize, display: 'block' }} />
                    <Stack direction="column" spacing={2} padding={0.5} alignItems={'flex-start'} justifyContent={"center"} sx={{ width: '100%' }}>
                        <Stack direction="row" spacing={1} alignItems={'center'}>
                            {observation.name ? <Typography variant='h5' sx={{ whiteSpace: "nowrap", flexShrink: 0 }}> {observation.name} </Typography> :  <Typography variant='h5' sx={{ whiteSpace: "nowrap", flexShrink: 0 }}> {observation.display_name} </Typography> }
                            <CollectionLengthChip length={observation.n_runs} tooltip="Analysis Runs" />
                            {observation.tags?.map((tag) => (
                                <TagChip key={tag.id} tag={tag} />
                            ))}
                        </Stack>
                        <Typography variant='subtitle1'>Observed {formatTimestamp(new Date(observation.acq_timestamp * 1000).toISOString())}</Typography>
                    </Stack>
                </Stack>
                <IconButton className='hover-child' sx={{ opacity: 0 }} onClick={(event) => { event.stopPropagation(); navigate(`${AppRoutes.observations}/${observation.natural_key}`) }}>
                    <PageviewOutlined sx={{ fontSize: (theme) => theme.typography.h4.fontSize, color: 'primary.main' }} />
                </IconButton>
            </Stack>
        </Stack>
    );
}
