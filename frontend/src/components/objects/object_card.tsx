import { ObjectIcon } from '@assets/icons';
import { Object, getObject } from '@api/object';
import { Card, CardContent, Typography, Skeleton, Stack, Grid, IconButton, Box, CardActionArea } from '@mui/material';
import { useState } from 'react';
import { ExpandMore, Pageview, PageviewOutlined } from "@mui/icons-material"
import { Link, useNavigate } from 'react-router';
import { CardContainer, CollectionLengthChip, MediumLoadingCard } from '@components/general';
import { AppRoutes } from '@config/routes';
import { formatTimestamp, formatRA, formatDec } from '@utils/formatters';

export function ObjectCard({ natural_key }: { natural_key: string }) {
    const { data: obj, isLoading, isError } = getObject(natural_key);

    if (isError || (!isLoading && !obj)) {
        return (
            <CardContainer>
                <Typography> Error loading object :( </Typography>
            </CardContainer>
        );
    }

    if (isLoading) {
        return (
            <MediumLoadingCard />
        );
    }

    return (
        <Link to={`${AppRoutes.objects}/${natural_key}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <CardContainer>
                <ObjectCardContent obj={obj} />
            </CardContainer>
        </Link>
    );
}


export function ObjectCardContent({ obj }: { obj: Object }) {
    let navigate = useNavigate();
    return (
        <Stack direction="column" spacing={2} padding={0.5} alignItems={'flex-start'} justifyContent={"center"} sx={{ width: '100%' }}>
            <Stack direction="row" spacing={2} alignItems={'space-between'} sx={{ width: '100%'  }}>
                <Stack direction="row" spacing={2} alignItems={'center'} sx={{ width: '100%' }}>
                    <ObjectIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize, display: 'block' }} />
                    <Stack direction="column" spacing={2} padding={0.5} alignItems={'flex-start'} justifyContent={"center"} sx={{ width: '100%' }}>
                        <Typography variant='h5' sx={{ whiteSpace: "nowrap", flexShrink: 0 }}> {obj.display_name} </Typography>
                        <Typography variant='subtitle1'>{obj?.classification} | SNR {obj?.snr.toFixed(2)} | {obj?.cluster_children} Children | Analyzed {formatTimestamp(obj?.analysis_time)} | Observed {formatTimestamp(obj?.obs_time)}</Typography>
                        {/* <Typography variant='subtitle1'>Analyzed {formatTimestamp(obj?.analysis_time)} | Observed {formatTimestamp(obj?.obs_time)} </Typography> */}
                    </Stack>
                    {/* <Typography variant='subtitle1'>RA {formatRA(obj?.ra)}  |   DEC {formatDec(obj?.dec)}</Typography> */}
                </Stack>
                <IconButton className='hover-child' sx={{opacity: 0}} onClick={(event) => {event.stopPropagation(); navigate(`${AppRoutes.objects}/${obj.natural_key}`)}}>
                    <PageviewOutlined sx={{ fontSize: (theme) => theme.typography.h4.fontSize, color: 'primary.main' }} />
                </IconButton>
            </Stack>
        </Stack>
    );
}
