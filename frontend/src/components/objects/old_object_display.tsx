import { AnalysisIcon, FlagIcon, GridIcon, ListIcon, ObjectIcon } from "@assets/icons";
import { Box, Button, ButtonGroup, Checkbox, Chip, Breadcrumbs, Container, Divider, Grid, IconButton, Skeleton, Stack, Tooltip, Typography, darken } from "@mui/material";
import { forwardRef, useEffect, useState } from "react";
import { ObjectTable } from "./object_table";
import { Object } from "@api/object";
import { CutoutCard, CutoutCardContent, LoadingCutoutImage } from './cutout';
import { LoadingCutoutCard } from './cutout';
import { AddFlagButton, CollectionLengthChip, DisplayChip, ErrorMessage, SelectableCardContainer } from "@components/general";
import { ChevronLeft, ChevronRight, PageviewOutlined, ViewCarousel, NavigateNext, Close } from "@mui/icons-material";
import { getFlagsByObject } from "@api/flag";
import { FlagLoadingChip, FlagObjChip } from "@components/flags";
import theme from "@config/theme";
import { CutoutImage, PreloadCutoutsForObject } from "./cutout";
import { useDispatch, useSelector } from "react-redux";
import { setObjectDisplayMode, setCutoutGroup, addDetailCutoutGroup, setDetailCutoutGroup } from "@state/uiSlice";
import { getCutout } from "@api/cutout";
import { AddToCatalogAction, AddToProposalAction, AttachFlagAction, DownloadSelectedAction, SelectionActionButton } from "@components/general/selection_actions";
import { Paginated } from "@api/pagination";
import { UseInfiniteQueryResult, InfiniteData } from "@tanstack/react-query";
import objects from "pages/objects";
import { useInView } from 'react-intersection-observer'
import pagination_config from '@config/pagination';
import { FixedSizeGrid } from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";
import debounce from 'lodash.debounce';
import cutout_defaults from "@config/cutout_defaults";
import InfiniteLoader from 'react-window-infinite-loader';
import { useNavigate } from "react-router";
import { AppRoutes } from "@config/routes";
import { getCutoutSchema } from '@api/cutout';
import { SchemaSelector } from "@components/cutouts";
import { current } from "@reduxjs/toolkit";
import { T } from "react-router/dist/development/fog-of-war-oa9CGk10";


export enum ObjectDispMode {
    TABLE = 'table',
    CARDS = 'cards',
    SLIDESHOW = 'slideshow',
}

export class SelectionAction {
    action: (selected: Object[]) => void;
    ariaLabel: string;
    disabled: boolean;
    sx: object;
    title?: string;
    icon?: React.ReactNode;

    constructor({
        action,
        ariaLabel,
        disabled = false,
        sx = {},
        name,
        icon,
    }: {
        action: (selected: Object[]) => void;
        ariaLabel: string;
        disabled?: boolean;
        sx?: object;
        name?: string;
        icon?: React.ReactNode;
    }) {
        this.action = action;
        this.ariaLabel = ariaLabel;
        this.disabled = disabled;
        this.sx = sx;
        this.title = name;
        this.icon = icon;
    }
}

export function ObjectDisplay({ objQuery, selected, setSelected, title = "Objects", selectionActions = [] }: { objQuery: UseInfiniteQueryResult<InfiniteData<Paginated<Object[]>, unknown>, Error>, selected: Array<Object>, setSelected: React.Dispatch<React.SetStateAction<Object[]>>, title: String, selectionActions?: SelectionAction[] }) {
    let dispatch = useDispatch()
    const { ref, inView } = useInView()
    const { ref: refTop, inView: inViewTop } = useInView()

    const { data: pages, isLoading, isFetchingNextPage, isFetchingPreviousPage, hasPreviousPage, fetchNextPage, fetchPreviousPage, hasNextPage, isError, error } = objQuery;

    function loadNextPage() {
        // console.log("next page load triggered, hasNextPage:", hasNextPage, "isFetchingNextPage:", isFetchingNextPage);
        if (hasNextPage && !isFetchingNextPage) {
            // console.log("Loading next page");
            fetchNextPage()
        }
    }

    useEffect(() => {
        if (inView) {
            loadNextPage()
        }
    }, [fetchNextPage, inView])

    useEffect(() => {
        if (inViewTop && hasPreviousPage && !isFetchingPreviousPage) {
            fetchPreviousPage()
        }
    }, [fetchPreviousPage, inViewTop])

    let objects = pages ? pages.pages.flatMap((page) => page.records) : [];

    const displayMode = useSelector((state: any) => state.objectDisplayMode.mode);
    const setDisplayMode = (mode: ObjectDispMode) => {
        if (displayMode == ObjectDispMode.SLIDESHOW) {
            // the slideshow selects the current object (to allow the buttons to work)
            setSelected([]); // we clear the selected state when switching out of slideshow mode
        }
        dispatch(setObjectDisplayMode({ mode: mode }))
    }
    // const [displayMode, setDisplayMode] = useState(ObjectDispMode.TABLE);

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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', height: '100%' }}>
                    <Stack direction="row" spacing={2} alignItems={'center'} flexGrow={14}>
                        <ObjectIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize }} />
                        <Typography variant='h4'> {title} </Typography>
                    </Stack>
                </Box>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Stack direction="row" spacing={2} alignItems={'center'} flexGrow={14}>
                        <ObjectIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize }} />
                        <Typography variant='h4'> {title} </Typography>
                        <CollectionLengthChip length={objects.length} />
                    </Stack>
                </Box>
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Stack direction="row" spacing={2} alignItems={'center'} flexGrow={14}>
                    <ObjectIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize }} />
                    <Typography variant='h4'> {title} </Typography>
                    <CollectionLengthChip length={pages && pages.pages && pages.pages[0] ? pages.pages[0].total_records : objects.length} />
                </Stack>
                <Button
                    ref={refTop}
                    onClick={() => fetchNextPage()}
                    disabled={!hasPreviousPage || isFetchingPreviousPage}
                    sx={{ opacity: hasPreviousPage ? 1 : 0 }}
                >
                    {isFetchingNextPage
                        ? 'Loading more...'
                        : hasNextPage
                            ? 'Load More'
                            : 'All Objects Loaded'}
                </Button>
                <Stack direction="row" justifyContent={"space-between"} alignItems={'center'} flexGrow={1} >
                    <ButtonGroup variant="outlined">
                        {selectionActions.map((action, index) => (
                            <SelectionActionButton
                                action={() => action.action(selected)}
                                selected={selected}
                                title={action.title}
                                ariaLabel={action.ariaLabel}
                                disabled={action.disabled}
                                sx={{ ...action.sx }}
                                icon={action.icon}
                            />))}
                    </ButtonGroup>
                    <ButtonGroup variant="outlined">
                        <DownloadSelectedAction selected={selected} setSelected={setSelected} />
                        <AddToCatalogAction selected={selected} setSelected={setSelected} />
                        <AddToProposalAction selected={selected} setSelected={setSelected} />
                        <AttachFlagAction selected={selected} setSelected={setSelected} />
                    </ButtonGroup>
                    <ButtonGroup variant="contained">
                        <Button onClick={() => { setDisplayMode(ObjectDispMode.TABLE); }} color={displayMode == ObjectDispMode.TABLE ? "selected" : "inherit"}><ListIcon /></Button>
                        <Button onClick={() => { setDisplayMode(ObjectDispMode.CARDS); }} color={displayMode == ObjectDispMode.CARDS ? "selected" : "inherit"}><GridIcon /></Button>
                        <Button onClick={() => { setDisplayMode(ObjectDispMode.SLIDESHOW); }} color={displayMode == ObjectDispMode.SLIDESHOW ? "selected" : "inherit"}><ViewCarousel /></Button>
                    </ButtonGroup>
                </Stack>

            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', height: '100%' }}>
                {(displayMode == ObjectDispMode.SLIDESHOW && <ObjCarouselDisplay objects={objects} hasNextPage={hasNextPage} loadNextPage={loadNextPage} nObj={pages && pages.pages && pages.pages[0] ? pages.pages[0].total_records : objects.length} selected={selected} setSelected={setSelected} />)}
                {(displayMode == ObjectDispMode.TABLE && <ObjectTable objects={objects} hasNextPage={hasNextPage} loadNextPage={loadNextPage} nObj={pages && pages.pages && pages.pages[0] ? pages.pages[0].total_records : objects.length} selected={selected} setSelected={setSelected} />)}
                {(displayMode == ObjectDispMode.CARDS && <ObjCardDisplay objects={objects} hasNextPage={hasNextPage} loadNextPage={loadNextPage} nObj={pages && pages.pages && pages.pages[0] ? pages.pages[0].total_records : objects.length} selected={selected} setSelected={setSelected} />)}
            </Box>
        </Container>
    )
}
function ObjCarouselDisplay({ objects, hasNextPage, loadNextPage, nObj, selected, setSelected }: { objects: Array<Object>, hasNextPage: boolean, loadNextPage: () => void, nObj: number, selected: Array<Object>, setSelected: React.Dispatch<React.SetStateAction<Object[]>> }) {
    const [currentIndex, setCurrentIndex] = useState(0);


    const LOOKAHEAD = 10;
    const FETCHAHEAD = 3;

    useEffect(() => {
        setSelected([objects[currentIndex]]);
        if (hasNextPage && currentIndex + LOOKAHEAD >= objects.length) {
            console.log("Loading next page in carousel display");
            loadNextPage();
        }
        debounce(() => {
            for (let i = 1; i < FETCHAHEAD; i++) {
                const nextIndex = (currentIndex + i) % objects.length;
                // PreloadCutoutsForObject(objects[nextIndex].id);
            }
        }, 1000)();
    }, [currentIndex]);

    return (
        <Stack direction="row" spacing={2} alignItems={'center'} sx={{ width: '100%' }}>
            <Button variant="contained"
                onClick={() => { setCurrentIndex((prevIndex) => (prevIndex + objects.length - 1) % objects.length) }}
                disabled={objects.length == 1}
            >
                <ChevronLeft sx={{ fontSize: (theme) => theme.typography.h4.fontSize }} />
            </Button>
            {ObjCarouselSingle({ object: objects[currentIndex] })}
            <Button variant="contained"
                onClick={() => { setCurrentIndex((prevIndex) => (prevIndex + 1) % objects.length) }}
                disabled={objects.length == 1}
            >
                <ChevronRight sx={{ fontSize: (theme) => theme.typography.h4.fontSize }} />
            </Button>
        </Stack>
    );
}

export function ObjCarouselSingle({ object }: { object: Object }) {
    const oid = object.id;
    let dispatch = useDispatch()
    let navigate = useNavigate()

    const { data: flags, flagLoading, flagError } = getFlagsByObject(oid);
    const { data: schema, isLoading: schemaLoading, isError: schemaHasError, error: schemaError } = getCutoutSchema();
    const { service, tree_path } = useSelector((state) => state.cutoutGroup.groups.carousel_0)
    const [current_service, setCurrentService] = useState(service)
    const [current_tree_path, setCurrentTreePath] = useState(tree_path)

    function changeSelectedCutouts(selected: string[]) {
        setCurrentService(selected[0]);
        setCurrentTreePath(selected.slice(1));
        // change the selected cutouts in the redux store
        console.log("Changing selected cutouts for carousel_0 to:", selected[0], selected.slice(1));
        dispatch(setCutoutGroup({ index: 'carousel_0', service: selected[0], tree_path: selected.slice(1) }));
    }

    function getBreadcrumbs(service, tree_path) {
        let crumbs = []
        crumbs.push(<Typography variant='h5' key={0} color="text.primary">{schema[service].display_name}</Typography>);
        let s_schema = schema[service]["children"]

        for (const sel of tree_path) {
            crumbs.push(<Typography variant='h6' key={crumbs.length} color="text.primary">{s_schema[sel].display_name}</Typography>);
            s_schema = s_schema[sel]["children"]
        }
        return crumbs;

    }

    const [paths, setPaths] = useState(null);

    useEffect(() => {
        console.log("path selected for carousel_0:", current_service, current_tree_path);
        if (schemaLoading || schemaHasError) {
            return
        }
        let s_schema = schema[current_service]["children"]
        console.log("schema:", s_schema);

        for (const sel of current_tree_path) {
            console.log("navigating to", sel);
            s_schema = s_schema[sel]["children"]
            console.log("got to:", s_schema);
        }

        s_schema = globalThis.Object.keys(s_schema)

        console.log(s_schema)
        setPaths(s_schema.map((childname) => [...current_tree_path, childname]))
        console.log("paths:", paths)
    }, [schema, schemaHasError, current_service, current_tree_path]);

    if (schemaHasError) {
        return (
            <ErrorMessage do_reporting={false} title="Failed to load cutout service schema" message={schemaError?.message || "Error communicating with backend: failed to load cutout schema."} />
        )
    }

    // const {service, tree_path} = group
    if (schemaLoading || !paths) {
        return (
            <Stack spacing={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'start', width: '100%' }}>
                    <Typography variant='h4'>  Object {object.id} </Typography>
                </Stack>
                <Grid container spacing={1} alignItems={'center'} sx={{ width: '100%', height: 'grow', minHeight: cutout_defaults.cutout_card_size }}>
                    {Array.from({length:4}).map(() =>
                        <Grid size={3} sx={{ height: "100%" }}>
                            <LoadingCutoutImage />
                        </Grid>)}
                </Grid>
            </Stack>
        )
    }

    // the cutouts should link to the object detail page!!
    return (
        <Stack spacing={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <Stack spacing={1} direction="row" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <Typography variant='h4'>  Object {object.id} </Typography>
                <IconButton onClick={(event) => {event.stopPropagation(); navigate(`${AppRoutes.objects}/${object.id}`)}}>
                    <PageviewOutlined sx={{ fontSize: (theme) => theme.typography.h4.fontSize, color: 'primary.main' }} />
                </IconButton>
            </Stack>
            <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'start', width: '100%' }}>
                <Breadcrumbs
                    separator={<NavigateNext fontSize="small" />}
                    aria-label="breadcrumb"
                >
                    {getBreadcrumbs(current_service, current_tree_path)}
                </Breadcrumbs>
                <SchemaSelector data={schema} dialog_title={"Select Cutout Group"} button_title={"Change"} current_path={[current_service, ...current_tree_path]} onSelectionChange={(path) => { console.log("selected path:", path); changeSelectedCutouts(path) }} target_child_depth={1} />
            </Stack>
            <Grid container spacing={1} alignItems={'center'} sx={{ width: '100%', height: 'grow', minHeight: cutout_defaults.cutout_card_size }}>
                {paths.map((t_path) =>
                    <Grid size={3} sx={{ height: "100%" }} id={t_path.join("_")} >
                        <CutoutImage obj_id={oid} service={current_service} tree_selector={t_path} />
                    </Grid>
                )}
            </Grid>
            <Stack direction="row" spacing={2} alignItems={'center'} justifyContent={"space-evenly"} sx={{ width: '100%' }}>
                <AddFlagButton obj_id={oid} buttonIndex={0} flagsOnObject={flags ? flags : []} />
                <AddFlagButton obj_id={oid} buttonIndex={1} flagsOnObject={flags ? flags : []} />
                <AddFlagButton obj_id={oid} buttonIndex={2} flagsOnObject={flags ? flags : []} />
                <AddFlagButton obj_id={oid} buttonIndex={3} flagsOnObject={flags ? flags : []} />
                <AddFlagButton obj_id={oid} buttonIndex={4} flagsOnObject={flags ? flags : []} />
                {/* <AddFlagButton obj_id={oid} buttonIndex={3} flagsOnObject={flags ? flags : []} /> */}
            </Stack>
            <Stack direction="row" spacing={2} alignItems={'center'} sx={{ width: '100%', justifyContent: 'center', }}>
                {/* <Typography variant='h6'>  MER ID: {object.mer_id ? object.mer_id : "None"} </Typography> */}
                {/* <Divider orientation="vertical" flexItem />
                <Typography>RA {object.ra.toPrecision(7)}</Typography>
                <Divider orientation="vertical" flexItem />
                <Typography>DEC {object.dec.toPrecision(7)}</Typography>
                <Divider orientation="vertical" flexItem />
                <Typography>Created {object.created_ts}</Typography> */}
            </Stack>
            <Stack direction="row" spacing={2} alignItems={'center'} sx={{ width: '100%', justifyContent: 'center' }}>
                {(!flagLoading && flags) && flags.map((flag) => (<Grid key={flag.id} size="auto"><FlagObjChip key={flag.id} flag_id={flag.id} obj_id={oid} /> </Grid>))}
                {(flagLoading || !flags) && <FlagLoadingChip />}
                {(!flagLoading && flags?.length == 0) && <Chip sx={{ opacity: 0 }} />}
            </Stack>
        </Stack>
    )

}

function ObjCardDisplay({ objects, hasNextPage, loadNextPage, nObj, selected, setSelected }: { objects: Array<Object>, hasNextPage: boolean, loadNextPage: () => void, nObj: number, selected: Array<Object>, setSelected: React.Dispatch<React.SetStateAction<Object[]>> }) {

    // const { ref, inView } = useInView()
    let dispatch = useDispatch()
    let navigate = useNavigate();

    const { data: schema, isLoading: schemaLoading, isError: schemaHasError, error: schemaError } = getCutoutSchema();
    const { service, tree_path } = useSelector((state) => state.cutoutGroup.groups.tile)
    const [current_service, setCurrentService] = useState(service)
    const [current_tree_path, setCurrentTreePath] = useState(tree_path)

    if (schemaHasError) {
        return (
            <ErrorMessage do_reporting={false} title="Failed to load cutout service schema" message={schemaError?.message || "Error communicating with backend: failed to load cutout schema."} />
        )
    }

    if (schemaLoading || !schema) {
        return (
            <Stack spacing={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <Grid container spacing={1} alignItems={'center'} sx={{ width: '100%', height: 'grow', minHeight: cutout_defaults.cutout_card_size }}>
                    {Array(4).map(() =>
                        <Grid size={3} sx={{ height: "100%" }}>
                            <LoadingCutoutImage />
                        </Grid>)}
                </Grid>
            </Stack>
        )
    }

    const COLUMN_COUNT = 4;
    const GUTTER_SIZE = 10;


    const handleSelect = (clickedObj: Object) => {
        if (selected.some((item) => item.id === clickedObj.id)) {
            setSelected((prevSelected) => prevSelected.filter((item) => item.id !== clickedObj.id));
        } else {
            setSelected((prevSelected) => [...prevSelected, clickedObj]);
        }
    };

    function changeSelectedCutouts(selected: string[]) {
        setCurrentService(selected[0]);
        setCurrentTreePath(selected.slice(1));
        // change the selected cutouts in the redux store
        console.log("Changing selected cutouts for tile to:", selected[0], selected.slice(1));
        dispatch(setCutoutGroup({ index: 'tile', service: selected[0], tree_path: selected.slice(1) }));
    }

    
    function getBreadcrumbs(service, tree_path) {
        let crumbs = []
        crumbs.push(<Typography variant='h5' key={0} color="text.primary">{schema[service].display_name}</Typography>);
        let s_schema = schema[service]["children"]

        for (const sel of tree_path) {
            crumbs.push(<Typography variant='h6' key={crumbs.length} color="text.primary">{s_schema[sel].display_name}</Typography>);
            s_schema = s_schema[sel]["children"]
        }
        return crumbs;

    }


    function isItemLoaded(index: number) {
        let isLoaded = !hasNextPage || index * COLUMN_COUNT < objects.length;
        // console.log("isItemLoaded index:", index, "hasNextPage:", hasNextPage, "objects.length:", objects.length, "itemCount:",itemCount, "isLoaded:", isLoaded);
        return isLoaded;
    }
    const itemCount = hasNextPage ? objects.length + 1 : objects.length;


    const ObjRenderer = ({ columnIndex, rowIndex, style }) => {
        const index = rowIndex * COLUMN_COUNT + columnIndex;

        // if (index == objects.length) {
        //     return (
        //         <div style={style}>
        //             {/* <div ref={ref} style={style}> */}
        //             <LoadingObjectCard />
        //         </div>
        //     );
        // }

        const fullStyle = {
            ...style,
            left: style.left + GUTTER_SIZE,
            top: style.top + GUTTER_SIZE,
            width: style.width - GUTTER_SIZE,
            height: style.height - GUTTER_SIZE
        }

        if (index >= objects.length) {
            if (index >= nObj) {
                console.log("out of bounds draw: index:", index, "objects.length:", objects.length);
                return <div style={fullStyle}></div>;
            }
            return (
                <div style={fullStyle}>
                    <LoadingCutoutCard />
                </div>
            );
        }
        const obj = objects[index];
        const isItemSelected = selected.includes(obj);
        return (
            <div style={fullStyle}>
                <Box sx={{ position: 'relative', alignItems: 'center', justifyContent: 'center', '&:hover .hover-child': { opacity: 100 } }}>
                    <SelectableCardContainer sx={{ width: cutout_defaults.cutout_card_size, height: cutout_defaults.cutout_card_size }} inner_sx={{ padding: 0, height: '100%', width: '100%' }} isChecked={isItemSelected} payload={obj} onSelectionChange={handleSelect}>
                        <CutoutCardContent obj={obj} service={current_service} tree_path={current_tree_path} isLoading={false} />
                    </SelectableCardContainer>

                    {/* <CutoutCard id={obj.id} cardsx={{ border: isItemSelected ? `2px solid ${theme.palette.secondary.main}` : '2px solid transparent' }} /> */}
                    <Box sx={{
                        position: 'relative',
                        bottom: cutout_defaults.cutout_card_size + (GUTTER_SIZE),
                        right: 80 + GUTTER_SIZE / 2,
                        width: 'auto',
                        height: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <IconButton className='hover-child' sx={{ opacity: 0 }} onClick={(event) => { event.stopPropagation(); navigate(`${AppRoutes.objects}/${obj.id}`) }}>
                            <PageviewOutlined sx={{ fontSize: (theme) => theme.typography.h4.fontSize, color: 'primary.contrastText' }} />
                        </IconButton>
                        {/* <Checkbox color="secondary" sx={{ color: theme.palette.primary.contrastText, border: "2px" }} checked={isItemSelected} onClick={(event) => { event.stopPropagation(); }} onChange={(event: React.ChangeEvent<HTMLInputElement>) => { handleSelect(event, obj) }} /> */}
                    </Box>
                </Box>
            </div>
        );
    }

    const innerElementType = forwardRef(({ style, ...rest }, ref) => (
        <div
            style={{
                ...style,
                // paddingLeft: GUTTER_SIZE,
                paddingTop: GUTTER_SIZE
            }}
            ref={ref}
            {...rest}
        />
    ));


    return (
        // https://spin.atomicobject.com/scrollable-grid-jit-data-loading/
        <Box sx={{ width: "100%", flexGrow: 1, alignItems: "center" }}>
            {/* <Container sx={{ width: "100%", height: "100%", backgroundColor: "red" }}> */}
            <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'start', width: '100%' }}>
                <Breadcrumbs
                    separator={<NavigateNext fontSize="small" />}
                    aria-label="breadcrumb"
                >
                    {getBreadcrumbs(current_service, current_tree_path)}
                </Breadcrumbs>
                <SchemaSelector data={schema} dialog_title={"Select Cutout Group"} button_title={"Change"} current_path={[current_service, ...current_tree_path]} onSelectionChange={(path) => { console.log("selected path:", path); changeSelectedCutouts(path) }} target_child_depth={0} />
            </Stack>
            <AutoSizer disableWidth>
                {({ height, }) => (
                    // {({ height, width }) => (
                    <InfiniteLoader
                        isItemLoaded={isItemLoaded}
                        loadMoreItems={loadNextPage}
                        itemCount={itemCount}
                    >
                        {({ onItemsRendered, ref }) => (
                            <FixedSizeGrid
                                onItemsRendered={({
                                    visibleRowStartIndex,
                                    visibleColumnStartIndex,
                                    visibleRowStopIndex,
                                    overscanRowStopIndex,
                                    overscanRowStartIndex,
                                }) => {
                                    onItemsRendered({
                                        overscanStartIndex: overscanRowStartIndex,
                                        overscanStopIndex: overscanRowStopIndex,
                                        visibleStartIndex: visibleRowStartIndex,
                                        visibleStopIndex: visibleRowStopIndex,
                                    });
                                }}
                                ref={ref}
                                height={height}
                                width={COLUMN_COUNT * (cutout_defaults.cutout_card_size + 2 * GUTTER_SIZE)}
                                // width={Math.min(width, COLUMN_COUNT * (cutout_defaults.cutout_card_size + 2 * GUTTER_SIZE))}
                                columnWidth={cutout_defaults.cutout_card_size + 2 * GUTTER_SIZE}
                                rowHeight={cutout_defaults.cutout_card_size + 2 * GUTTER_SIZE}
                                columnCount={COLUMN_COUNT}
                                overscanRowCount={5}
                                rowCount={Math.ceil(nObj / COLUMN_COUNT)}
                                innerElementType={innerElementType}
                            >
                                {ObjRenderer}
                            </FixedSizeGrid>
                        )}
                    </InfiniteLoader>
                )}
            </AutoSizer>
            {/* </Container> */}
        </Box>
    )
}



export function GeneralObjCarouselSingle({ object, idx, onRemove, showRemove=false }: { object: Object, idx: number, onRemove?: (idx: number) => void, showRemove?: boolean }) {
    const oid = object.id;
    let dispatch = useDispatch()

    const { data: flags, flagLoading, flagError } = getFlagsByObject(oid);
    const { data: schema, isLoading: schemaLoading, isError: schemaHasError, error: schemaError } = getCutoutSchema();
    const group = useSelector((state) => state.detailCutouts.groups[idx])
    if (!group) {
        console.warn(`Cutout group ${idx} not found in state, setting to default`);
        dispatch(setDetailCutoutGroup({index:idx, service: cutout_defaults.default_cutout_service, tree_path: cutout_defaults.default_cutout_tree_path }));
    }
    const { service, tree_path } = useSelector((state) => state.detailCutouts.groups[idx])  // need to get the index from props and then use that
    // need to handle the case where the group doesn't exist yet and set to some default
    if (!service || !tree_path) {
        // set to some default
        console.warn(`Cutout group ${idx} not found in state, setting to default`);
        dispatch(setDetailCutoutGroup({ index: idx, service: cutout_defaults.default_cutout_service, tree_path: cutout_defaults.default_cutout_tree_path }));
    }
    const [current_service, setCurrentService] = useState(service)
    const [current_tree_path, setCurrentTreePath] = useState(tree_path)

    function changeSelectedCutouts(selected: string[]) {
        setCurrentService(selected[0]);
        setCurrentTreePath(selected.slice(1));
        // change the selected cutouts in the redux store
        console.log(`Changing selected cutouts for ${idx} to:`, selected[0], selected.slice(1));
        dispatch(setDetailCutoutGroup({ index: idx, service: selected[0], tree_path: selected.slice(1) }));
    }

    function getBreadcrumbs(service, tree_path) {
        let crumbs = []
        crumbs.push(<Typography variant='h5' key={0} color="text.primary">{schema[service].display_name}</Typography>);
        let s_schema = schema[service]["children"]

        for (const sel of tree_path) {
            crumbs.push(<Typography variant='h6' key={crumbs.length} color="text.primary">{s_schema[sel].display_name}</Typography>);
            s_schema = s_schema[sel]["children"]
        }
        return crumbs;

    }

    const [paths, setPaths] = useState(null);

    useEffect(() => {
        console.log(`path selected for carousel_${idx}:`, current_service, current_tree_path);
        if (schemaLoading || schemaHasError) {
            return
        }
        let s_schema = schema[current_service]["children"]
        console.log("schema:", s_schema);

        for (const sel of current_tree_path) {
            console.log("navigating to", sel);
            s_schema = s_schema[sel]["children"]
            console.log("got to:", s_schema);
        }

        s_schema = globalThis.Object.keys(s_schema)

        console.log(s_schema)
        setPaths(s_schema.map((childname) => [...current_tree_path, childname]))
        console.log("paths:", paths)
    }, [schema, schemaHasError, current_service, current_tree_path]);

    if (schemaHasError) {
        return (
            <ErrorMessage do_reporting={false} title="Failed to load cutout service schema" message={schemaError?.message || "Error communicating with backend: failed to load cutout schema."} />
        )
    }

    // const {service, tree_path} = group
    if (schemaLoading || !paths) {
        return (
            <Stack spacing={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <Typography variant='h6'>  Object {object.id} </Typography>
                <Grid container spacing={1} alignItems={'center'} sx={{ width: '100%', height: 'grow', minHeight: cutout_defaults.cutout_card_size }}>
                    {Array(4).map(() =>
                        <Grid size="grow" sx={{ height: "100%" }}>
                            <LoadingCutoutImage />
                        </Grid>)}
                </Grid>
            </Stack>
        )
    }

    // the cutouts should link to the object detail page!!
    return (
        <Stack spacing={2} sx={{ display: 'flex', alignItems: 'start', justifyContent: 'center', width: '100%' }}>
            <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'start', width: '100%' }}>
                <Breadcrumbs
                    separator={<NavigateNext fontSize="small" />}
                    aria-label="breadcrumb"
                >
                    {getBreadcrumbs(current_service, current_tree_path)}
                </Breadcrumbs>
                <SchemaSelector data={schema} dialog_title={"Select Cutout Group"} button_title={"Change"} current_path={[current_service, ...current_tree_path]} onSelectionChange={(path) => { console.log("selected path:", path); changeSelectedCutouts(path) }} target_child_depth={1} />
            </Stack>
                {showRemove && onRemove && <IconButton onClick={() => { onRemove(idx) }}><Close/></IconButton>}
            </Stack>
            <Grid container spacing={1} rowSpacing={1} alignItems={'center'} sx={{ width: '100%',  minHeight: cutout_defaults.cutout_card_size }}>
                {paths.map((t_path) =>
                    <Grid size={3} id={t_path.join("_")} >
                        <CutoutImage obj_id={oid} service={current_service} tree_selector={t_path}/>
                    </Grid>
                )}
            </Grid>
        </Stack>
    )

}