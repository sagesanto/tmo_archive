import { Stack, Theme, Typography } from "@mui/material";

export function PageHeader({title, icon: Icon, sx={}}: {title: string, icon: React.ElementType, sx?: object}) {
    return (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', width: '100%', ...sx }}>
            <Icon sx={{ fontSize: (theme: Theme) => theme.typography.h3.fontSize }} />
            <Typography variant='h3'>{title}</Typography>
        </Stack>
    );
}
