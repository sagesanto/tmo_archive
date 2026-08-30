import { ObservationIcon } from "@assets/icons";
import { Box, Chip, Container, Divider, Stack, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { getObservations, getObservationsCount } from "@api/observation";
import { FilteredCollectionLengthChip, SortSelect } from "@components/general";
import { ObservationTable } from "./observation_table";
import { NO_TAGS_KEY, TagFilterState, TagFilterTray } from "./tag_filter_tray";

const SORT_LABELS = ["Most Recently Acquired", "Least Recently Acquired", "Name", "Most Runs"];
const SORT_PARAMS = ["acq_timestamp_desc", "acq_timestamp_asc", "name", "n_runs_desc"];

export function ObservationDisplay({ title = "Observations", tagFilters: externalTagFilters, onTagFiltersChange, designation }: { title?: string, tagFilters?: TagFilterState | null, onTagFiltersChange?: (state: TagFilterState) => void, designation?: string }) {
    const [sortIndex, setSortIndex] = useState(0);
    const [search, setSearch] = useState("");
    const [acqAfter, setAcqAfter] = useState("");
    const [acqBefore, setAcqBefore] = useState("");
    const [internalTagFilters, setInternalTagFilters] = useState<TagFilterState>({});
    const [hasRunsOnly, setHasRunsOnly] = useState(true);

    const tagFilters = onTagFiltersChange ? (externalTagFilters ?? {}) : internalTagFilters;
    const setTagFilters = onTagFiltersChange ?? setInternalTagFilters;

    const params = useMemo(() => {
        const has_tags: number[] = [];
        const excludes_tags: number[] = [];
        for (const key in tagFilters) {
            if (key === NO_TAGS_KEY) continue;
            (tagFilters[key] === 'include' ? has_tags : excludes_tags).push(Number(key));
        }
        const noTagsState = tagFilters[NO_TAGS_KEY];
        return {
            search: search || undefined,
            has_tags,
            excludes_tags,
            no_tags: noTagsState === 'include' ? true : noTagsState === 'exclude' ? false : null,
            has_runs: hasRunsOnly || undefined,
            designation,
            acq_after: acqAfter || undefined,
            acq_before: acqBefore || undefined,
            sort: SORT_PARAMS[sortIndex],
        };
    }, [search, tagFilters, hasRunsOnly, designation, acqAfter, acqBefore, sortIndex]);

    const scopeParams = useMemo(() => ({ designation }), [designation]);

    const { data: pages, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = getObservations(params);
    const { data: matchingCount } = getObservationsCount(params);
    const { data: totalCount } = getObservationsCount(scopeParams);

    let observations = pages ? pages.pages.flatMap((page) => page.records) : [];
    let nObj = hasNextPage ? observations.length + 1 : observations.length;

    function loadNextPage() {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }

    const controls = (
        <Stack direction="row" spacing={2} alignItems={'center'} sx={{ width: '100%', flexWrap: 'wrap' }}>
            <TextField size="small" placeholder="Search name..." value={search} onChange={(event) => setSearch(event.target.value)} sx={{ width: 200 }} />
            <TextField size="small" label="From" type="date" slotProps={{ inputLabel: { shrink: true } }} value={acqAfter} onChange={(event) => setAcqAfter(event.target.value)} sx={{ width: 160 }} />
            <TextField size="small" label="To" type="date" slotProps={{ inputLabel: { shrink: true } }} value={acqBefore} onChange={(event) => setAcqBefore(event.target.value)} sx={{ width: 160 }} />
            <Box sx={{ flexGrow: 1 }} />
            <SortSelect labels={SORT_LABELS} value={sortIndex} onChange={setSortIndex} />
        </Stack>
    );

    const filterChips = (
        <Stack direction="row" spacing={1} alignItems={'center'} sx={{ flexWrap: 'wrap', width: '100%' }}>
            <Chip
                label="Analyzed"
                size="medium"
                color="secondary"
                variant={hasRunsOnly ? "filled" : "outlined"}
                onClick={() => setHasRunsOnly((current) => !current)}
            />
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <TagFilterTray state={tagFilters} onChange={setTagFilters} />
            </Box>
        </Stack>
    );

    const header = (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Stack direction="row" spacing={2} alignItems={'center'}>
                <ObservationIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize }} />
                <Typography variant='h3'  sx={{ lineHeight: 1, m: 0 }}> {title} </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', alignSelf: 'stretch' }}>
                    <FilteredCollectionLengthChip matching={matchingCount ?? 0} total={totalCount ?? 0} tooltip="Observations matching filter / total observations" />
                </Box>
            </Stack>
        </Box>
    );

    if (isLoading) {
        return (
            <Container sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '1em' }}>
                {header}
                {controls}
                {filterChips}
                <Stack direction="row" spacing={2} alignItems={'center'} sx={{ width: '100%' }} justifyContent={'center'}>
                    <Typography variant='h4'> Loading... </Typography>
                </Stack>
            </Container>
        )
    }

    if (observations.length == 0) {
        return (
            <Container sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '1em' }}>
                {header}
                {controls}
                {filterChips}
                <Stack direction="row" spacing={2} alignItems={'center'} sx={{ width: '100%' }} justifyContent={'center'}>
                    <Typography variant='h4'> No observations match this filter </Typography>
                </Stack>
            </Container>
        )
    }

    return (
        <Container sx={{ width: '100%', height: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '1em' }}>
            {header}
            {controls}
            {filterChips}
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', flexGrow: 1, minHeight: 0 }}>
                <ObservationTable key={JSON.stringify(params)} observations={observations} hasNextPage={hasNextPage} loadNextPage={loadNextPage} nObj={nObj} />
            </Box>
        </Container>
    )
}
