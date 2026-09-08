import { Chip, darken } from "@mui/material";


export function DisplayChip({label, icon, onClick = () => {}, extras={}, color='primary'}: {label:string, icon?: React.ReactElement, onClick?: () => void, extras?: object, color?: 'primary' | 'secondary'}) {
    return (
        <Chip
            icon={icon}
            label={label}
            color={color}
            onClick={(event) => { event.stopPropagation(); event.nativeEvent.stopImmediatePropagation(); onClick();} }
            sx={{
                ".MuiChip-deleteIcon": {
                    color: (theme) => theme.palette[color].main,
                    "&:hover": {
                        color: (theme) => theme.palette[color].contrastText,
                    },
                },
                border: "2px solid",
                borderColor: (theme) => theme.palette[color].main,
                backgroundColor: "transparent",
                color: (theme) => theme.palette[color].main,
                "&:hover": {
                    backgroundColor: (theme) => theme.palette[color].main,
                    color: (theme) => theme.palette[color].contrastText,
                    borderColor: (theme) => theme.palette[color].main,
                    ":hover .MuiChip-deleteIcon": {
                        color: (theme) => theme.palette[color].contrastText,
                        "&:hover": {
                            color: (theme) => darken(theme.palette[color].contrastText,0.1),
                        },
                    },
                },
                cursor: "pointer",
            }}
            {...extras}
        />
    );
}

export function LoadingChip({icon}: { icon?: React.ReactElement}) {
    return ( <DisplayChip label="Loading..." icon={icon} onClick = {()=>{}} extras= {{}}/> );
}