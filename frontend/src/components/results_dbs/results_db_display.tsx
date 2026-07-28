import { ResultsDBIcon } from "@assets/icons";
import { Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { getResultsDBs } from "@api/results_db";
import { CardContainer, CardList, CollectionLengthChip, SortSelect } from "@components/general";
import { ResultsDBCardContent } from "./results_db_card";
import { useInView } from 'react-intersection-observer'
import { Link } from 'react-router';
import { AppRoutes } from "@config/routes";

const SORT_LABELS = ["Recently Updated", "Name", "Most Runs"];
const SORT_PARAMS = ["date_updated_desc", "name", "n_runs_desc"];

export function ResultsDBDisplay({ title = "Results Databases" }: { title?: string }) {
    const { ref, inView } = useInView()

    const [sortIndex, setSortIndex] = useState(0);
    const [search, setSearch] = useState("");

    const params = useMemo(() => ({
        search: search || undefined,
        sort: SORT_PARAMS[sortIndex],
    }), [search, sortIndex]);

    const { data: pages, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = getResultsDBs(params);

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [fetchNextPage, inView])

    let results_dbs = pages ? pages.pages.flatMap((page) => page.records) : [];

    const controls = (
        <Stack direction="row" spacing={2} alignItems={'center'}>
            <TextField size="small" placeholder="Search name..." value={search} onChange={(event) => setSearch(event.target.value)} sx={{ width: 200 }} />
            <SortSelect labels={SORT_LABELS} value={sortIndex} onChange={setSortIndex} />
        </Stack>
    );

    const header = (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Stack direction="row" spacing={2} alignItems={'center'} flexGrow={14}>
                <ResultsDBIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize }} />
                <Typography variant='h4'> {title} </Typography>
                <CollectionLengthChip length={results_dbs.length} tooltip="Results databases loaded" />
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
            {results_dbs.length == 0 ? (
                <Typography variant='h5'> No results databases match this filter </Typography>
            ) : (
                <CardList>
                    {results_dbs.map((results_db) => (
                        <Link key={results_db.natural_key} to={`${AppRoutes.results_dbs}/${results_db.natural_key}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <CardContainer>
                                <ResultsDBCardContent results_db={results_db} />
                            </CardContainer>
                        </Link>
                    ))}
                </CardList>
            )}
            <Button ref={ref} onClick={() => fetchNextPage()} disabled={!hasNextPage || isFetchingNextPage} sx={{ opacity: hasNextPage ? 1 : 0 }}>
                {isFetchingNextPage ? 'Loading more...' : hasNextPage ? 'Load More' : 'All Databases Loaded'}
            </Button>
        </Container>
    )
}
