import { AnalysisIcon } from "@assets/icons";
import { Box, Button, Container, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { getAnalyses } from "@api/analysis";
import { CardContainer, CardList, CollectionLengthChip, SortSelect } from "@components/general";
import { AnalysisCardContent } from "./analysis_card";
import { Link } from 'react-router';
import { AppRoutes } from "@config/routes";
import { useInView } from 'react-intersection-observer'

const STATUSES = ["Idle", "Waiting", "Running", "Complete", "Aborted", "Error"];
const SORT_LABELS = ["Newest Analyzed", "Oldest Analyzed", "Newest Observed", "Oldest Observed", "Name"];
const SORT_PARAMS = ["analysis_time_desc", "analysis_time_asc", "obs_time_desc", "obs_time_asc", "name"];

export function AnalysisDisplay({ title = "Analyses", statusFilter = null, onStatusFilterChange, observationId, resultsDbId, designation }: { title?: string, statusFilter?: string | null, onStatusFilterChange?: (status: string | null) => void, observationId?: number, resultsDbId?: number, designation?: string }) {
    const { ref, inView } = useInView()

    const [sortIndex, setSortIndex] = useState(0);
    const [internalStatusFilter, setInternalStatusFilter] = useState<string | null>(null);
    const activeStatusFilter = onStatusFilterChange ? statusFilter : internalStatusFilter;
    const setActiveStatusFilter = onStatusFilterChange ?? setInternalStatusFilter;

    const params = useMemo(() => ({
        status: activeStatusFilter,
        observation_id: observationId,
        results_db_id: resultsDbId,
        designation,
        sort: SORT_PARAMS[sortIndex],
    }), [activeStatusFilter, observationId, resultsDbId, designation, sortIndex]);

    const { data: pages, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = getAnalyses(params);

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [fetchNextPage, inView])

    let analyses = pages ? pages.pages.flatMap((page) => page.records) : [];

    const controls = (
        <Stack direction="row" spacing={2} alignItems={'center'}>
            <Select size="small" value={activeStatusFilter ?? ""} displayEmpty onChange={(event) => setActiveStatusFilter(event.target.value || null)} sx={{ minWidth: 180 }}>
                <MenuItem value="">All Statuses</MenuItem>
                {STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
            </Select>
            <SortSelect labels={SORT_LABELS} value={sortIndex} onChange={setSortIndex} />
        </Stack>
    );

    const header = (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Stack direction="row" spacing={2} alignItems={'center'} justifyContent={"center"} flexGrow={14}>
                <AnalysisIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize, display: 'block' }} />
                <Typography variant='h3' sx={{ lineHeight: 1, m: 0 }}> {title} </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', alignSelf: 'stretch' }}>
                    <CollectionLengthChip length={analyses.length} tooltip="Analyses loaded" />
                </Box>
            </Stack>
            {controls}
        </Box>
    );

    if (isLoading) {
        return (
            <Container sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '1em' }}>
                {header}
                <Typography variant='h4'> Loading... </Typography>
            </Container>
        )
    }

    return (
        <Container sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '1em' }}>
            {header}
            {analyses.length == 0 ? (
                <Typography variant='h5'> No analyses match this filter </Typography>
            ) : (
                <CardList>
                    {analyses.map((analysis) => (
                        <Link key={analysis.natural_key} to={`${AppRoutes.analyses}/${analysis.natural_key}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <CardContainer>
                                <AnalysisCardContent analysis={analysis} />
                            </CardContainer>
                        </Link>
                    ))}
                </CardList>
            )}
            <Button ref={ref} onClick={() => fetchNextPage()} disabled={!hasNextPage || isFetchingNextPage} sx={{ opacity: hasNextPage ? 1 : 0 }}>
                {isFetchingNextPage ? 'Loading more...' : hasNextPage ? 'Load More' : 'All Analyses Loaded'}
            </Button>
        </Container>
    )
}
