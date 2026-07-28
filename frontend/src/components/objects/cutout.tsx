import { Object, getObject } from '@api/object';
import { Cutout, getCutout, webGetCutout } from '@api/cutout';
import { Card, CardContent, Typography, Skeleton, Box, CardHeader, Avatar, Stack, Divider, CardActionArea, Grid, Chip } from '@mui/material';
import { ObjectIcon } from '@assets/icons';
import { NavLink } from 'react-router';
import cutout_defaults from '@config/cutout_defaults';
import backend from '@config/backend';
import { queryClient } from '@api/query_client';
import theme from '@config/theme';
import { useDispatch, useSelector } from 'react-redux'

export function PreloadCutoutsForObject(obj_id: number, service:string, selectors: string[][]) {
    let specific_args = cutout_defaults[service]

    for (const tree_selector in selectors) {
        const queryKey = ["cutout", obj_id, cutout_defaults.cutout_size_arcmin, tree_selector, specific_args]
        console.log("Preloading cutout for ", queryKey);
        queryClient.prefetchQuery({ retry:false, staleTime:Infinity, queryKey: queryKey, queryFn: () => webGetCutout(obj_id, service, tree_selector, cutout_defaults.cutout_size_arcmin, specific_args) });
    }
}    

export function LoadingCutoutImage() {
    return <Skeleton variant="rectangular" sx={{ minHeight:cutout_defaults.cutout_card_size, width: "100%", height: "auto", aspectRatio: 1, objectFit: "cover", imageRendering: "pixelated", }} />
}

export function CutoutImage({ obj_id, service, tree_selector, sx = { width: "100%", height: "auto" } }: { obj_id: number, service: string, tree_selector: string[], sx?: object }) {
    const { data: cutout, isLoading, isError, error } = getCutout(obj_id, service, tree_selector, cutout_defaults.cutout_size_arcmin);
    if (isError) {
        return <Card variant="outlined" sx={{ width: "100%", height: "100%" }}>
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                sx={{ height: "100%", width: "100%" }}
            >
                <Typography variant="body1" color="text.secondary">
                    {error?.message || "Unknown error loading cutout :("}
                </Typography>
            </Box>
        </Card>
    }
    if (isLoading || !cutout) {
        return <LoadingCutoutImage/>
    }

    console.log("cutout:",cutout)

    return (
        <Box sx={{
                position: "relative",
                width: "100%",
                height: "100%",
                ...sx,
                overflow: "hidden",
                cursor: "pointer",
                "&:hover .overlay": {
                    opacity: 1,
                    pointerEvents: "auto",
                },
        }}>
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    // width: "100%",
                    // height: "100%",
                    color: "#fff",
                    opacity: 0.8,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    pointerEvents: "none",
                }}
            >
                <Chip label={tree_selector.join(" ")} size="small" color="primary" variant="outlined" sx={{ margin: 0.25, bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText}}  />
            </Box>
            <img src={`${backend.address}/cutout/files/${cutout?.image_path}`} alt="cutout" style={{ ...sx, imageRendering: "pixelated", objectFit: "cover", verticalAlign: "middle" }} />
             <Box className="overlay"
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    bgcolor: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    opacity: 0,
                    transition: "opacity 0.3s",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    pointerEvents: "none",
                }}
            >
                { cutout?.display_info.map((info) => (<Typography variant="subtitle1" sx={{textAlign: "center", wordBreak:"break-all", textWrap: "balance"}}>{info}</Typography>))}
                {/* <Typography variant="h5">{instrument} / {band}</Typography>
                <Typography variant="subtitle1">{(cutout?.size_arcmin*60).toPrecision(2)}" x {(cutout?.size_arcmin*60).toPrecision(2)}"</Typography>
                <Typography variant="subtitle1">{cutout?.obs_collection} - {cutout?.calib_level}</Typography>
                <Typography variant="caption" sx={{textAlign: "center", wordBreak:"break-all", textWrap: "balance"}}>
                    Tile {cutout.tile_index}
                </Typography> */}
            </Box>
        </Box>
    )
}
export function LoadingCutoutCard({ cardsx = {} }: { cardsx?: object; }) {
    return (
        <CutoutCardContainer cardsx={cardsx}>
            <Skeleton variant="rectangular" sx={{ width: "100%", height: "100%" }} width={"100%"} />
        </CutoutCardContainer>
    );
}
export function CutoutCard({ id, service, tree_path, cardsx = {} }: { id: number; service:string, tree_path:string[], cardsx?: object; }) {
    const { data: obj, isLoading, isError } = getObject(id);

    if (isError || (!isLoading && !obj)) {
        return (
            <CutoutCardContainer>
                <Typography> Error loading object :( </Typography>
            </CutoutCardContainer>
        );
    }

    if (isLoading) {
        return (
            <LoadingCutoutCard cardsx={cardsx} />
        );
    }

    return (
        <CutoutCardContainer cardsx={cardsx}>
            <CardActionArea>
                <NavLink to={`/objects/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <CutoutCardContent obj={obj} service={service} tree_path={tree_path} isLoading={isLoading} />
                </NavLink>
            </CardActionArea>
        </CutoutCardContainer>
    );
}
export function CutoutCardContainer({ cardsx = {}, children }: { cardsx?: object; children: React.ReactNode; }) {
    return (
        <Card sx={{ width: cutout_defaults.cutout_card_size, height: cutout_defaults.cutout_card_size, ...cardsx }} onClick={() => { } }>
            <CardContent sx={{ padding: 0, height: '100%', width: '100%' }}>
                {children}
            </CardContent>
        </Card>
    );
}

export function CutoutCardContent({ obj, service, tree_path, isLoading }: { obj: Object; service:string, tree_path:string[], isLoading?: boolean; }) {
    return (
        <>
            {isLoading ? <Skeleton variant="rectangular" sx={{ width: "100%", height: "auto", aspectRatio: 1 }} /> : <CutoutImage obj_id={obj.id} service={service} tree_selector={tree_path} sx={{ width: "100%", height: "auto", aspectRatio: 1 }} />}
        </>
    );
}

