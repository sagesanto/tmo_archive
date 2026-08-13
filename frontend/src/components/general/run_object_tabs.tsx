import { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import { AnalysisDisplay } from "@components/analyses";
import { ObjectDisplay } from "@components/objects/object_display";
import { Object } from "@api/object";

export function RunObjectTabs({ observationId, resultsDbId }: { observationId?: number, resultsDbId?: number }) {
    const [tab, setTab] = useState(0);
    const [selectedObj, setSelectedObj] = useState<Object[]>([]);

    return (
        <Box sx={{ width: '100%', height: '100%', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Tabs value={tab} onChange={(_, value) => setTab(value)}>
                <Tab label="Analyses" />
                <Tab label="Objects" />
            </Tabs>
            <Box sx={{ width: '100%', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingTop: '1em' }}>
                {tab === 0 && <AnalysisDisplay title="Analyses" observationId={observationId} resultsDbId={resultsDbId} />}
                {tab === 1 && <ObjectDisplay title="Objects" observationId={observationId} resultsDbId={resultsDbId} selected={selectedObj} setSelected={setSelectedObj} />}
            </Box>
        </Box>
    );
}
