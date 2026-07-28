// import { CatalogIcon, FlagIcon, HomeIcon, ObjectIcon, ProposalIcon } from "@assets/icons";
// import theme from "@config/theme";
// import { Box, Button, Stack, Typography } from "@mui/material";
// import { logout } from "@hooks/useAuth";
// import { useEffect } from "react";
// import { CardContainer, CardList } from "@components/general";
// import Proposal from "./proposals";
// import { Description } from "@mui/icons-material";
// import { NavLink } from "react-router";
// import { AppRoutes } from "@config/routes";

// const cards = [
//     {
//         name: "Objects",
//         icon: <ObjectIcon sx={{ fontSize: (theme) => theme.typography.h4.fontSize }} />,
//         route: AppRoutes.objects,
//         description: "Objects, each representing a single position in the sky, are the core data structure in Catcoord. An Object can be created from as little as just an RA and a Dec, but can also be assigned metadata like a MER ID. CatCoord automatically retrieves the Euclid cutouts for each Object that is within the Euclid footprint."
//     },
//     {
//         name: "Flags",
//         icon: <FlagIcon sx={{ fontSize: (theme) => theme.typography.h4.fontSize }} />,
//         route: AppRoutes.flags,
//         description: "Flags are user-created tags that can be applied to Objects to indicate their classification, disposition, or importance. Anyone can add or remove any Flag from any Object, but only the creator of a Flag can edit its name or description."
//     },
//     {
//         name: "Catalogs",
//         icon: <CatalogIcon sx={{ fontSize: (theme) => theme.typography.h4.fontSize }} />,
//         route: AppRoutes.catalogs,
//         description: "Catalogs are to Objects what playlists are to songs - they're user-created groupings of Objects that exist primarily for organizational purposes. Only the creator of a Catalog can add or remove Objects from it or edit its details."
//     },
//     {
//         name: "Proposals",
//         icon: <ProposalIcon sx={{ fontSize: (theme) => theme.typography.h4.fontSize }} />,
//         route: AppRoutes.proposals,
//         description: "Proposals are very similar to Catalogs, but with the added purpose of communicating the existence and status of an observing proposal that would observe the included Objects. Only the creator of a Proposal can add or remove Objects from it or edit its details."
//     }
// ]

// export function Home() {
//     useEffect(() => {
//         document.title = "CatCoord";
//     }, []);
//     return (
//         <Stack direction={"column"} alignItems={"flex-start"} justifyContent={"flex-start"}>
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>

//                 <Stack direction="row" spacing={2} alignItems={'center'} sx={{ width: '100%' }}>
//                     <HomeIcon sx={{ fontSize: 100, color: theme.palette.primary.main }} />
//                     <Typography variant="h3">
//                         CatCoord
//                     </Typography>
//                 </Stack>
//             </Box>
//             {/* <Typography variant="body1" sx={{ marginTop: 1.5 }}>
//                 Welcome to CatCoord! CatCoord is a tool to facilitate coordination between different SWGs/WPs that are classifying and proposing follow-up for (primarily high-z) objects in Euclid data. Through CatCoord you can upload objects, retrieve + view their multi-band Euclid cutouts, mark them with different user-created flags, organize them into proposals and catalogs, and see what other proposals and catalogs a given object belongs to.
//             </Typography> */}
//             <Typography variant="h4" sx={{ marginTop: 1.5 }}>
//                 Key Concepts
//             </Typography>
//             <CardList sx={{ marginTop: 1.5 }}>
//                 {cards.map((item) => (
//                     <CardContainer key={item.name} sx={{ width: '100%' }}>
//                         <NavLink to={item.route} key={item.name} style={{ textDecoration: "none", color: "inherit" }}>
//                             <Stack direction="column" spacing={2} padding={0.5} alignItems={'flex-start'} justifyContent={"center"} sx={{ width: '100%' }}>
//                                 <Stack direction="row" spacing={2} alignItems={'center'} sx={{ width: '100%' }}>
//                                     {item.icon}
//                                     <Typography variant='h5' sx={{ whiteSpace: "nowrap", flexShrink: 0 }}> {item.name} </Typography>
//                                 </Stack>
//                                 <Typography variant='body1' sx={{ fontWeight: 'normal' }}>
//                                     {item.description}
//                                 </Typography>
//                             </Stack>
//                         </NavLink>
//                     </CardContainer>
//                 ))}
//             </CardList>
//             {/* <Typography variant="h5" sx={{ marginTop: 2 }}> */}

//             {/* </Typography> */}
//         </Stack>
//     );
// }

// export default Home;