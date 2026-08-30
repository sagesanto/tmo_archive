import { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import { ObjectDisplay } from "@components/objects/object_display";
import { ImageViewer } from "@components/images";
import { Object } from "@api/object";

export function ObjectImageTabs({ analysisKey, fullscreen, onToggleFullscreen }: { analysisKey: string, fullscreen?: boolean, onToggleFullscreen?: () => void }) {
    const [tab, setTab] = useState(0);
    const [selectedObj, setSelectedObj] = useState<Object[]>([]);

    return (
        <Box sx={{ width: '100%', height: '100%', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {!fullscreen && (
                <Tabs value={tab} onChange={(_, value) => setTab(value)}>
                    <Tab label="Objects" />
                    <Tab label="Images" />
                </Tabs>
            )}
            <Box sx={{ width: '100%', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingTop: fullscreen ? 0 : '1em' }}>
                {tab === 0 && <ObjectDisplay title="Objects" analysisKey={analysisKey} selected={selectedObj} setSelected={setSelectedObj} />}
                {tab === 1 && <ImageViewer analysisKey={analysisKey} fullscreen={fullscreen} onToggleFullscreen={onToggleFullscreen} />}
            </Box>
        </Box>
    );
}
