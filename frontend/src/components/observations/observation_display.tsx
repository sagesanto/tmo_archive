import { ObservationIcon } from "@assets/icons";
import { Box, Chip, Container, Divider, Stack, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { getObservations } from "@api/observation";
import { CollectionLengthChip, SortSelect } from "@components/general";
import { ObservationTable } from "./observation_table";

const SORT_LABELS = ["Most Recently Acquired", "Least Recently Acquired", "Name", "Most Runs"];
const SORT_PARAMS = ["acq_timestamp_desc", "acq_timestamp_asc", "name", "n_runs_desc"];
const OBS_TYPES = ["Science", "Dark", "Flat", "Bias", "Other", "Unclassified"];

export function ObservationDisplay({ title = "Observations", obsTypesFilter, onObsTypesFilterChange }: { title?: string, obsTypesFilter?: string[] | null, onObsTypesFilterChange?: (types: string[]) => void }) {
    const [sortIndex, setSortIndex] = useState(0);
    const [search, setSearch] = useState("");
    const [internalObsTypes, setInternalObsTypes] = useState<string[]>([]);
    const [hasRunsOnly, setHasRunsOnly] = useState(true);

    const obsTypes = onObsTypesFilterChange ? (obsTypesFilter ?? []) : internalObsTypes;
    const setObsTypes = onObsTypesFilterChange ?? setInternalObsTypes;

    function toggleObsType(type: string) {
        setObsTypes(obsTypes.includes(type) ? obsTypes.filter((t) => t !== type) : [...obsTypes, type]);
    }

    const params = useMemo(() => ({
        search: search || undefined,
        obs_types: obsTypes.length ? obsTypes.join(",") : undefined,
        has_runs: hasRunsOnly || undefined,
        sort: SORT_PARAMS[sortIndex],
    }), [search, obsTypes, hasRunsOnly, sortIndex]);

    const { data: pages, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = getObservations(params);

    let observations = pages ? pages.pages.flatMap((page) => page.records) : [];
    let nObj = hasNextPage ? observations.length + 1 : observations.length;

    function loadNextPage() {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }

    const controls = (
        <Stack direction="row" spacing={2} alignItems={'center'}>
            <TextField size="small" placeholder="Search name..." value={search} onChange={(event) => setSearch(event.target.value)} sx={{ width: 200 }} />
            <SortSelect labels={SORT_LABELS} value={sortIndex} onChange={setSortIndex} />
        </Stack>
    );

    const filterChips = (
        <Stack direction="row" spacing={1} alignItems={'center'} sx={{ flexWrap: 'wrap' }}>
            <Chip
                label="Analyzed"
                size="medium"
                color="secondary"
                variant={hasRunsOnly ? "filled" : "outlined"}
                onClick={() => setHasRunsOnly((current) => !current)}
            />
            <Divider orientation="vertical" flexItem />
            {OBS_TYPES.map((type) => (
                <Chip
                    key={type}
                    label={type}
                    size="medium"
                    color="primary"
                    variant={obsTypes.includes(type) ? "filled" : "outlined"}
                    onClick={() => toggleObsType(type)}
                />
            ))}
        </Stack>
    );

    const header = (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Stack direction="row" spacing={2} alignItems={'center'}>
                <ObservationIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize }} />
                <Typography variant='h3'  sx={{ lineHeight: 1, m: 0 }}> {title} </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', alignSelf: 'stretch' }}>
                    <CollectionLengthChip length={observations.length} tooltip="Observations loaded" />
                </Box>
            </Stack>
            <Box sx={{ flexGrow: 1 }} />
            {controls}
        </Box>
    );

    if (isLoading) {
        return (
            <Container sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '1em' }}>
                {header}
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
            {filterChips}
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', flexGrow: 1, minHeight: 0 }}>
                <ObservationTable key={JSON.stringify(params)} observations={observations} hasNextPage={hasNextPage} loadNextPage={loadNextPage} nObj={nObj} />
            </Box>
        </Container>
    )
}
