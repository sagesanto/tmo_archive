import { Box, Container, CssBaseline, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import { Navigate, useNavigate, Outlet, NavLink, useLocation } from "react-router";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { AnalysisIcon, AdminIcon, UserIcon, ObjectIcon, FlagIcon, ProposalIcon, ResultsDBIcon, ObservationIcon } from "@assets/icons";
import { AppRoutes } from "@config/routes";
import { feedbackUrl } from "@config/feedback";
import { CardActionArea, Stack } from "@mui/material";
import { HomeButton } from "./simple_buttons";
import theme from "@config/theme";
// import { useAuth } from "@hooks/useAuth";
import backend from "@config/backend"
import { useSelector } from 'react-redux'
import { BorderBottom, DynamicForm, ExpandMore, Logout, More, MoreHoriz, OpenInNew, Warning } from "@mui/icons-material";
import { useEffect, useRef, useState } from "react";
// import { logout } from "@hooks/useAuth";
// import store from "@state/store";
import { axios } from "@api/axios";
// import { useDispatch } from 'react-redux';

const top_bar_iconsize = theme.typography.h4.fontSize;

const topbar_items = [
    { name: "Analyses", icon: <AnalysisIcon sx={{ fontSize: top_bar_iconsize, display: 'block'   }} />, route: AppRoutes.analyses },
    // { name: "Proposals", icon: <ProposalIcon sx={{ fontSize: top_bar_iconsize }} />, route: AppRoutes.proposals },
    { name: "Objects", icon: <ObjectIcon sx={{ fontSize: top_bar_iconsize, display: 'block'  }} />, route: AppRoutes.objects },
    // { name: "Flags", icon: <FlagIcon sx={{ fontSize: top_bar_iconsize }} />, route: AppRoutes.flags },
    // { name: "Users", icon: <UserIcon sx={{ fontSize: top_bar_iconsize }} />, route: AppRoutes.users },
    { name: "Observations", icon: <ObservationIcon sx={{ fontSize: top_bar_iconsize, display: 'block'  }} />, route: AppRoutes.observations },
];

const dropdown_items = [
    // { name: "Users", icon: <UserIcon sx={{ fontSize: top_bar_iconsize }} />, route: AppRoutes.users },
    // { name: "Objects", icon: <ObjectIcon sx={{ fontSize: top_bar_iconsize }} />, route: AppRoutes.objects },
    { name: "Databases", icon: <ResultsDBIcon sx={{ fontSize: top_bar_iconsize, display: 'block'  }} />, route: AppRoutes.results_dbs },
    { name: "Changelog", icon: <DynamicForm sx={{ fontSize: top_bar_iconsize, display: 'block'  }} />, route: AppRoutes.changelog },
]

const admin_item = { name: "Admin", icon: <AdminIcon sx={{ fontSize: top_bar_iconsize, display: 'block'  }} />, route: AppRoutes.admin };

// const dispatch = useDispatch();
export function PageFrame() {
    let navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    let barRef = useRef<HTMLDivElement | null>(null);
    let anchorRef = useRef<HTMLButtonElement | null>(null);
    const [navHeight, setNavHeight] = useState(64);

    useEffect(() => {
        if (!barRef.current) return;
        const observer = new ResizeObserver((entries) => {
            const height = entries[0].contentRect.height;
            if (height > 0) {
                setNavHeight(height);
            }
        });
        observer.observe(barRef.current);
        return () => observer.disconnect();
    }, []);
    const handleMoreClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    // const { loading, userId, error, isAdmin } = useSelector((state) => state.auth)
    let location = useLocation()

    console.log("PageFrame location", location)

    // if (loading) {
    //     return ("Loading...");
    // }
    // // show unauthorized screen if no user is found in redux store
    // if (userId == null) {
    //     console.log("PageFrame: Not authenticated, redirecting to login");
    //     console.log(backend)
    //     return <Navigate to={AppRoutes.login} state={{ from: location.pathname }} replace />;
    // }



    // console.log("Authenticated");
    return (
        // <Box sx={{ display: 'flex', flexDirection: 'column', height:'100vh' }}>

        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
            <CssBaseline />
            <AppBar ref={barRef} color='secondary' position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, width: '100%' }}>
                <Toolbar>
                    <Stack direction={"row"} spacing={2} sx={{ justifyContent: 'space-evenly', width: '100%' }}>
                        <HomeButton sx={{ color: theme.palette.secondary.contrastText, borderBottom: location.pathname === "/" ? `3px solid ${theme.palette.secondary.contrastText}` : "none" }} />
                        {topbar_items.map((item) => (
                            <CardActionArea>
                                <NavLink to={item.route} key={item.name} style={{ textDecoration: "none", color: "inherit" }}>
                                    <Stack direction={"row"} alignItems={"center"} spacing={1} key={item.name} sx={{ padding: 1, justifyContent: 'center', borderBottom: location.pathname.startsWith(item.route) ? `3px solid ${theme.palette.secondary.contrastText}` : "none", }}>
                                        {item.icon}
                                        <Typography key={item.name} sx={{ lineHeight: 1, m: 0 }} variant="h4">
                                            {item.name}
                                        </Typography>
                                    </Stack>
                                </NavLink>
                            </CardActionArea>
                        ))}
                        {
                            <CardActionArea>
                                <NavLink to={admin_item.route} key={admin_item.name} style={{ textDecoration: "none", color: "inherit" }}>
                                    <Stack direction={"row"} alignItems={"center"} spacing={1} key={admin_item.name} sx={{ padding: 1, justifyContent: 'center', borderBottom: location.pathname.startsWith(admin_item.route) ? `3px solid ${theme.palette.secondary.contrastText}` : "none", }}>
                                        {admin_item.icon}
                                        <Typography key={admin_item.name} sx={{ lineHeight: 1, m: 0 }} variant="h4">
                                            {admin_item.name}
                                        </Typography>
                                    </Stack>
                                </NavLink>
                            </CardActionArea>
                        }
                        <CardActionArea ref={anchorRef} id={"moreClickable"} onClick={handleMoreClick} aria-haspopup="true" aria-expanded={open ? 'true' : undefined} aria-controls={open ? 'basic-menu' : undefined}>
                            <Stack direction={"row"} alignItems={"center"} spacing={1} sx={{ padding: 1, justifyContent: 'center', borderBottom: location.pathname.startsWith("/more") ? `3px solid ${theme.palette.secondary.contrastText}` : "none", }}>
                                <ExpandMore sx={{ fontSize: top_bar_iconsize }} />
                                <Typography variant="h4" sx={{ lineHeight: 1, m: 0 }}>
                                    More
                                </Typography>
                            </Stack>
                        </CardActionArea>
                        <Menu id="basic-menu" anchorEl={anchorEl} open={open} onClose={handleClose}
                            slotProps={{
                                list: { 'aria-labelledby': 'moreClickable', },
                                paper: {
                                    sx: {
                                        color: "secondary.contrastText",
                                        backgroundColor: "secondary.main",
                                        width: anchorRef.current ? anchorRef.current.offsetWidth : undefined,
                                        minWidth: anchorRef.current ? anchorRef.current.offsetWidth : undefined,
                                        borderRadius: 0,
                                    }
                                }
                            }}
                        >
                            {dropdown_items.map((item) => (
                                <MenuItem key={item.name} sx={{ height: barRef.current ? barRef.current.offsetHeight : undefined, }} onClick={handleClose}>
                                    <NavLink to={item.route} style={{ textDecoration: "none", color: "inherit" }}>
                                        <Stack direction={"row"} alignItems={"center"} spacing={1} sx={{ padding: 1, justifyContent: 'center' }}>
                                            {item.icon}
                                            <Typography variant="h4">
                                                {item.name}
                                            </Typography>
                                        </Stack>
                                    </NavLink>
                                </MenuItem>
                            ))}
                            <MenuItem sx={{ height: barRef.current ? barRef.current.offsetHeight : undefined, }} onClick={() => { handleClose(); window.open(feedbackUrl, "_blank", "noopener,noreferrer") }}>
                                <Stack direction={"row"} alignItems={"center"} spacing={1} sx={{ padding: 1, justifyContent: 'center' }}>
                                    <OpenInNew sx={{ fontSize: top_bar_iconsize }} />
                                    <Typography variant="h4">
                                        Feedback
                                    </Typography>
                                </Stack>
                            </MenuItem>
                        </Menu>
                    </Stack>
                </Toolbar>
            </AppBar>
            <Box color="primary" sx={{ paddingTop: `${navHeight}px`, flexDirection: "column", display: 'flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%' }}>
                <Stack direction="row" spacing={2} alignItems={'center'} sx={{ backgroundColor: (theme) => theme.palette.primary.main, width: '100%' }}>
                    <Warning sx={{ fontSize: (theme) => theme.typography.h5.fontSize, color: 'primary.contrastText' }} />
                    <Typography variant='h5' sx={{ color: 'primary.contrastText',  lineHeight: 1, m: 0 }}>  Alpha Version </Typography>
                    <Typography variant='body1' sx={{ color: 'primary.contrastText', fontWeight: 'normal' }}>
                        {"This is an alpha version containing bugs and incomplete features. NEOView's stable form may look and feel different from this prototype. Feedback (More > Feedback) is strongly desired."}
                    </Typography>
                </Stack>
            </Box>
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'auto', minHeight: 0 }}>
                {/* <Box paddingTop={10} sx={{ display: 'flex', flexGrow: 1, overflow: 'auto', minHeight: '100vh' }}> */}

                <Container sx={{
                    flexGrow: 1,
                    padding: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1em',
                }}>
                    {/* <AppBar ref={barRef} color="primary" sx={{  zIndex: (theme) => theme.zIndex.drawer + 1, width: '100%' }}> */}

                    {/* </AppBar> */}
                    {/* all page content is placed into the outlet element */}
                    <Outlet />
                </Container>
            </Box>

        </Box >
    )

}


export default PageFrame;