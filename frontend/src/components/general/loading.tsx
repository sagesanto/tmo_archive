import { LinearProgressProps, Box, LinearProgress, Typography } from "@mui/material";

// from https://mui.com/material-ui/react-progress/

// "if the progress bar is describing the loading progress of a particular region of a page, 
// you should use aria-describedby to point to the progress bar, 
// and set the aria-busy attribute to true on that region until it has finished loading."
export function LinearProgressWithLabel({value, sx = {}, props = {}}: {value: number, sx?: object, props?: LinearProgressProps }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
            <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" {...props} value={value} sx={{width: "100%"}} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
                <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary' }}
                >{`${Math.round(value)}%`}</Typography>
            </Box>
        </Box>
    );
}