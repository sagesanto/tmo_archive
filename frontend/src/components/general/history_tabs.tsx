import { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { AuditTable } from './audit_table';

// both panels are pinned to this height so switching tabs doesn't shift the page
const PANEL_HEIGHT = 340;

export function HistoryTabs({ target_type, target_key }: { target_type: string, target_key: string }) {
    const [tab, setTab] = useState(0);

    return (
        <Box sx={{ width: '100%' }}>
            <Tabs value={tab} onChange={(_, value) => setTab(value)}>
                <Tab label="Activity" />
                <Tab label="Comments" />
            </Tabs>
            <Box sx={{ height: PANEL_HEIGHT, width: '100%', display: 'flex', flexDirection: 'column', paddingTop: '1em' }}>
                {tab === 0 ? (
                    <AuditTable target_type={target_type} target_key={target_key} />
                ) : (
                    <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Comments to be implemented</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
