import { AnalysisIcon, FlagIcon, GridIcon, ListIcon, ObjectIcon } from "@assets/icons";
import { Box, Button, ButtonGroup, Checkbox, Chip, Breadcrumbs, Container, Divider, Grid, IconButton, MenuItem, Select, Skeleton, Stack, TextField, Tooltip, Typography, darken } from "@mui/material";
import { forwardRef, useEffect, useMemo, useState } from "react";
import { ObjectTable } from "./object_table";
import { getObjects, Object, ObjectsParams } from "@api/object";
import { CollectionLengthChip, DisplayChip, SelectableCardContainer, SortSelect } from "@components/general";
import { useDispatch, useSelector } from "react-redux";
import { useInView } from 'react-intersection-observer'

const SORT_LABELS = ["Highest SNR", "Lowest SNR", "Brightest", "Most Frames", "Newest Analyzed", "Oldest Analyzed"];
const SORT_PARAMS = ["snr_desc", "snr_asc", "magnitude_asc", "num_frames_desc", "analysis_time_desc", "analysis_time_asc"];

export function ObjectDisplay({ analysisKey, datasetId, resultsDbId, selected, setSelected, title = "Objects", classificationFilter = null, onClassificationFilterChange }: { analysisKey?: string, datasetId?: number, resultsDbId?: number, selected: Array<Object>, setSelected: React.Dispatch<React.SetStateAction<Object[]>>, title: String, classificationFilter?: string | null, onClassificationFilterChange?: (classification: string | null) => void }) {
    const { ref, inView } = useInView()

    const [sortIndex, setSortIndex] = useState(0);
    const [internalClassification, setInternalClassification] = useState<string | null>(null);
    const [minSnr, setMinSnr] = useState("");

    const classification = onClassificationFilterChange ? classificationFilter : internalClassification;
    const setClassification = onClassificationFilterChange ?? setInternalClassification;

    const params: ObjectsParams = useMemo(() => ({
        analysis_key: analysisKey,
        dataset_id: datasetId,
        results_db_id: resultsDbId,
        classification: classification || null,
        min_snr: minSnr ? Number(minSnr) : null,
        sort: SORT_PARAMS[sortIndex],
    }), [analysisKey, datasetId, resultsDbId, classification, minSnr, sortIndex]);

    const objQuery = getObjects(params);

    const { data: pages, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isError, error } = objQuery;

    function loadNextPage() {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }

    useEffect(() => {
        if (inView) {
            loadNextPage()
        }
    }, [fetchNextPage, inView])

    let objects = pages ? pages.pages.flatMap((page) => page.records) : [];
    let nObj = hasNextPage ? objects.length + 1 : objects.length;

    const controls = (
        <Stack direction="row" spacing={2} alignItems={'center'}>
            <Select size="small" value={classification ?? ""} displayEmpty onChange={(event) => setClassification(event.target.value || null)} sx={{ minWidth: 180 }}>
                <MenuItem value="">All Classifications</MenuItem>
                <MenuItem value="FastMoving">FastMoving</MenuItem>
                <MenuItem value="SlowMoving">SlowMoving</MenuItem>
            </Select>
            <TextField size="small" type="number" placeholder="Min SNR" value={minSnr} onChange={(event) => setMinSnr(event.target.value)} sx={{ width: 100 }} />
            <SortSelect labels={SORT_LABELS} value={sortIndex} onChange={setSortIndex} />
        </Stack>
    );

    const header = (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Stack direction="row" spacing={2} alignItems={'center'}>
                <ObjectIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize }} />
                <Typography variant='h4'> {title} </Typography>
                <CollectionLengthChip length={objects.length} tooltip="Objects loaded" />
            </Stack>
            <Box sx={{ flexGrow: 1 }} />
            {controls}
        </Box>
    );

    if (isLoading) {
        return (
            <Container sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                gap: '1em',
            }}>
                {header}
                <Stack direction="row" spacing={2} alignItems={'center'} sx={{ width: '100%' }} justifyContent={'center'}>
                    <Typography variant='h4'> Loading... </Typography>
                </Stack>
            </Container>
        )
    }

    if (objects.length == 0) {
        return (
            <Container sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                gap: '1em',
            }}>
                {header}
                <Stack direction="row" spacing={2} alignItems={'center'} sx={{ width: '100%' }} justifyContent={'center'}>
                    <Typography variant='h4'> No objects to display </Typography>
                </Stack>
            </Container>
        )
    }

    return (
        <Container sx={{
            width: '100%',
            height: '100%',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: '1em',
        }}>
            {header}
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', flexGrow: 1, minHeight: 0 }}>
                <ObjectTable key={JSON.stringify(params)} objects={objects} hasNextPage={hasNextPage} loadNextPage={loadNextPage} nObj={nObj} selected={selected} setSelected={setSelected} />
            </Box>
        </Container>
    )
}
