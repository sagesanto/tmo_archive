import { AnalysisIcon, FlagIcon, GridIcon, ListIcon, ObjectIcon } from "@assets/icons";
import { Box, Button, ButtonGroup, Checkbox, Chip, Breadcrumbs, Container, Divider, Grid, IconButton, MenuItem, Select, Skeleton, Stack, TextField, Tooltip, Typography, darken } from "@mui/material";
import { forwardRef, useEffect, useMemo, useState } from "react";
import { ObjectTable } from "./object_table";
import { getObjects, getObjectsCount, Object, ObjectsParams } from "@api/object";
import { getFlags } from "@api/flag";
import { FilteredCollectionLengthChip, DisplayChip, SelectableCardContainer, SortSelect } from "@components/general";
import { FlagFilterState, FlagFilterTray, NO_FLAGS_KEY } from "./flag_filter_tray";
import { useDispatch, useSelector } from "react-redux";
import { useInView } from 'react-intersection-observer'

const SORT_LABELS = ["Highest SNR", "Lowest SNR", "Brightest", "Most Frames", "Newest Analyzed", "Oldest Analyzed"];
const SORT_PARAMS = ["snr_desc", "snr_asc", "magnitude_asc", "num_frames_desc", "analysis_time_desc", "analysis_time_asc"];

export function ObjectDisplay({ analysisKey, observationId, resultsDbId, designation, selected, setSelected, title = "Objects", classificationFilter = null, onClassificationFilterChange, flagFilters: externalFlagFilters, onFlagFiltersChange }: { analysisKey?: string, observationId?: number, resultsDbId?: number, designation?: string, selected: Array<Object>, setSelected: React.Dispatch<React.SetStateAction<Object[]>>, title: String, classificationFilter?: string | null, onClassificationFilterChange?: (classification: string | null) => void, flagFilters?: FlagFilterState | null, onFlagFiltersChange?: (state: FlagFilterState) => void }) {
    const { ref, inView } = useInView()

    const [sortIndex, setSortIndex] = useState(0);
    const [internalClassification, setInternalClassification] = useState<string | null>(null);
    const [minSnr, setMinSnr] = useState("");
    const [internalFlagFilters, setInternalFlagFilters] = useState<FlagFilterState | null>(null);

    const flagFilters = onFlagFiltersChange ? (externalFlagFilters ?? null) : internalFlagFilters;
    const setFlagFilters = onFlagFiltersChange ?? setInternalFlagFilters;

    const { data: flags } = getFlags();

    // default filter: include everything but "bad"-category flags, plus no-flag objects.
    // set once, as soon as flags load, so the object query never fires with an empty filter first
    useEffect(() => {
        if (flagFilters === null && flags) {
            const defaults: FlagFilterState = {};
            for (const flag of flags) {
                if (flag.category === 'bad') {
                    defaults[flag.id] = 'exclude';
                }
            }
            setFlagFilters(defaults);
        }
    }, [flags, flagFilters]);

    const classification = onClassificationFilterChange ? classificationFilter : internalClassification;
    const setClassification = onClassificationFilterChange ?? setInternalClassification;

    const params: ObjectsParams = useMemo(() => {
        const has_flags: number[] = [];
        const excludes_flags: number[] = [];
        for (const key in flagFilters ?? {}) {
            if (key === NO_FLAGS_KEY) continue;
            (flagFilters![key] === 'include' ? has_flags : excludes_flags).push(Number(key));
        }
        const noFlagsState = flagFilters?.[NO_FLAGS_KEY];
        return {
            analysis_key: analysisKey,
            observation_id: observationId,
            results_db_id: resultsDbId,
            designation,
            classification: classification || null,
            min_snr: minSnr ? Number(minSnr) : null,
            has_flags,
            excludes_flags,
            no_flags: noFlagsState === 'include' ? true : noFlagsState === 'exclude' ? false : null,
            sort: SORT_PARAMS[sortIndex],
        };
    }, [analysisKey, observationId, resultsDbId, designation, classification, minSnr, flagFilters, sortIndex]);

    const scopeParams: ObjectsParams = useMemo(() => ({
        analysis_key: analysisKey,
        observation_id: observationId,
        results_db_id: resultsDbId,
        designation,
    }), [analysisKey, observationId, resultsDbId, designation]);

    // wait for the default flag filters to be computed so we don't fetch once unfiltered then refetch
    const ready = flagFilters !== null;
    const objQuery = getObjects(params, ready);
    const { data: matchingCount } = getObjectsCount(params, ready);
    const { data: totalCount } = getObjectsCount(scopeParams, ready);

    const { data: pages, isLoading: objectsLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isError, error } = objQuery;
    const isLoading = !ready || objectsLoading;

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
                <Typography variant='h3' sx={{ lineHeight: 1, m: 0 }}> {title} </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', alignSelf: 'stretch' }}>
                <FilteredCollectionLengthChip matching={matchingCount ?? 0} total={totalCount ?? 0} tooltip="Objects matching filter / total objects" />
            </Box>
            </Stack>
            <Box sx={{ flexGrow: 1 }} />
            {controls}
        </Box>
    );

    const flagTray = <FlagFilterTray state={flagFilters ?? {}} onChange={setFlagFilters} />;

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
                {flagTray}
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
                {flagTray}
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
            {flagTray}
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', flexGrow: 1, minHeight: 0 }}>
                <ObjectTable key={JSON.stringify(params)} objects={objects} hasNextPage={hasNextPage} loadNextPage={loadNextPage} nObj={nObj} selected={selected} setSelected={setSelected} />
            </Box>
        </Container>
    )
}
