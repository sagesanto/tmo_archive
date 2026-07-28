import { Box, Button, ButtonProps, IconButton, IconButtonProps, Tooltip } from "@mui/material";
import { useNavigate } from "react-router";

import { AppRoutes } from "@config/routes";
import { EditIcon, HomeIcon, ObjectIcon } from "@assets/icons";
import theme from "@config/theme";
// import { Circle, Delete, DeleteOutline } from "@mui/icons-material";

export function HomeButton() {
    let navigate = useNavigate();
    return (
        <IconButton onClick={() => navigate(AppRoutes.home)}>
            <Box
                sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: (theme) => theme.typography.h5.fontSize,
                    height: (theme) => theme.typography.h5.fontSize,
                    backgroundColor: "white",
                    borderRadius: "50%",
                }}
            >
                <HomeIcon
                    sx={{
                        fontSize: (theme) => theme.typography.h2.fontSize,
                        color: theme.palette.primary.main
                    }}
                />
            </Box>
        </IconButton>
    )
}

export function EditButton({ sx = {}, props, tooltip }: { sx?: object, props: ButtonProps, tooltip?: string }) {
    const btn = (
        <Button {...props}
            sx={{ ...sx }}
            variant="contained"
            size="large"
            color="secondary"
            startIcon={<EditIcon sx={{ fontSize: (theme) => theme.typography.h4.fontSize }} />}>
            Edit
        </Button>
    )
    return tooltip ? <Tooltip placement="bottom" arrow title={tooltip}>{btn}</Tooltip> : btn;
}
{/* <Button sx={{ "flex": 1 }} variant="contained" size="large" color="primary" aria-label="upload and add objects" onClick={() => setCreateObjOpen(true)} startIcon={<ObjectIcon sx={{ fontSize: (theme) => theme.typography.h4.fontSize }} />}>Upload</Button> */ }

export function UploadObjButton({ sx = {}, props, tooltip }: { sx?: object, props: ButtonProps, tooltip?: string }) {
    const btn = (
        <Button {...props}
            sx={{ ...sx }}
            variant="contained"
            size="large"
            color="primary"
            startIcon={<ObjectIcon sx={{ fontSize: (theme) => theme.typography.h4.fontSize }} />}>
            Upload
        </Button>
    )
    return tooltip ? <Tooltip placement="bottom" arrow title={tooltip}>{btn}</Tooltip> : btn;
}

// export function DeleteButton({ sx = {}, props, tooltip }: { sx?: object, props: IconButtonProps, tooltip?: string }) {
//     const btn = (
//         <IconButton {...props}
//             sx={{ ...sx }}
//             // variant="outlined"
//             size="small"
//             color="warning">
//             <DeleteOutline sx={{ fontSize: (theme) => theme.typography.h4.fontSize }} />
//         </IconButton>
//     )
//     return tooltip ? <Tooltip placement="bottom" arrow title={tooltip}>{btn}</Tooltip> : btn;
// }