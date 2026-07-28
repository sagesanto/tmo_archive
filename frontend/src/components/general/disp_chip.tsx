import { Chip, darken } from "@mui/material";


export function DisplayChip({label, icon, onClick = () => {}, extras={}}: {label:string, icon?: React.ReactNode, onClick?: () => void, extras?: object}) {
    return (
        <Chip
            icon={icon}
            label={label}
            color='primary'
            onClick={(event) => { event.stopPropagation(); event.nativeEvent.stopImmediatePropagation(); onClick();} }
            sx={{
                ".MuiChip-deleteIcon": {
                    color: (theme) => theme.palette.primary.main,
                    "&:hover": {
                        color: (theme) => theme.palette.primary.contrastText,
                    },
                },
                border: "2px solid",
                borderColor: (theme) => theme.palette.primary.main,
                backgroundColor: "transparent", 
                color: (theme) => theme.palette.primary.main, 
                "&:hover": {
                    backgroundColor: (theme) => theme.palette.primary.main,
                    color: (theme) => theme.palette.primary.contrastText, 
                    borderColor: (theme) => theme.palette.primary.main,
                    ":hover .MuiChip-deleteIcon": {
                        color: (theme) => theme.palette.primary.contrastText,
                        "&:hover": {
                            color: (theme) => darken(theme.palette.primary.contrastText,0.1),
                        },
                    },
                },
                cursor: "pointer",
            }}
            {...extras}
        />
    );
}

export function LoadingChip({icon}: { icon?: React.ReactNode}) { 
    return ( <DisplayChip label="Loading..." icon={icon} onClick = {()=>{}} extras= {{}}/> );
}