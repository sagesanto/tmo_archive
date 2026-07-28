import { Box, Button, ButtonGroup, Checkbox, Container, Divider, Grid, IconButton, Skeleton, Stack, Tooltip, Typography, darken } from "@mui/material";
import { useEffect, useState } from "react";
import theme from "@config/theme";
import { downloadJSON } from "@utils/downloads";
import { Object, useAddObjectsToCatalog, useAddObjectsToProposal } from "@api/object";
import { AnalysisIcon, DownloadActiveIcon, DownloadIcon, FlagIcon, ProposalIcon } from "@assets/icons";
import { AddToCatalogPopup } from "@components/catalogs";
import { AddFlagPopup } from "./add_flag_popups";
import { useAddFlagToObjects } from "@api/flag";
import { useNotifs } from "@hooks/useNotifs";
import { AddToProposalPopup } from "@components/proposals";

export function SelectionActionButton<T>({ action, selected, ariaLabel, disabled = false, sx = {}, title, icon }: { action: (selected: Object[]) => void, selected: Object[], ariaLabel: string, disabled: boolean, sx: object, title?: string, icon?: React.ReactNode }) {
    return (
        <Tooltip title={ariaLabel} placement="top" arrow>
            <div>
                <Button
                    title={title}
                    aria-label={ariaLabel}
                    onClick={() => action(selected)}
                    disabled={disabled || !selected.length}
                    sx={{
                        "&:hover": {
                            ".cancel-icon": {
                                backgroundColor: (theme) => theme.palette.primary.main,
                                background: (theme) => theme.palette.primary.main,
                            },
                            backgroundColor: (theme) => theme.palette.primary.main,
                            color: (theme) => theme.palette.primary.contrastText,
                            borderColor: (theme) => theme.palette.primary.main,
                        },
                        ...sx
                    }}
                >
                    {icon}
                </Button>
            </div>
        </Tooltip>
    )
}

export function DownloadSelectedAction({ selected, setSelected }: { selected: Object[], setSelected: React.Dispatch<React.SetStateAction<Object[]>> }) {
    const [downloadActive, setDownloadActive] = useState(false);

    // cheap trick to disable the download button for a short time after download starts (no good way to tell when the download will actually end)
    useEffect(() => {
        if (downloadActive) {
            setTimeout(() => {
                setDownloadActive(false);
            }, 1000);
        }
    }, [downloadActive]);

    return (
        <SelectionActionButton
            action={(selected: Object[]) => { setSelected(selected); setDownloadActive(true); downloadJSON(selected, `selected_objects.json`) }}
            ariaLabel={"Download objects"}
            selected={selected}
            icon={downloadActive ? <DownloadActiveIcon /> : <DownloadIcon />}
            disabled={downloadActive}
        />
    )
}

export function AddToCatalogAction({ selected, setSelected }: { selected: Object[], setSelected: React.Dispatch<React.SetStateAction<Object[]>> }) {
    const [addToCatOpen, setAddToCatOpen] = useState(false);
    const addObjectsToCatalog = useAddObjectsToCatalog();
    const { updateNotif } = useNotifs()

    useEffect(() => {
        switch (addObjectsToCatalog.status) {
            case 'idle':
                updateNotif(false, "", "", null);
                break;
            case 'pending':
                updateNotif(true, 'Adding objects to catalogs...', 'info', null);
                break;
            case 'error':
                updateNotif(true, `Error adding objects to catalogs: ${addObjectsToCatalog.error}`, 'error', 3000);
                break;
            case 'success':
                updateNotif(true, 'Objects added to catalogs', 'success', 3000);
                break;
        }
    }, [addObjectsToCatalog.status]);

    return (
        <>
            <SelectionActionButton
                action={(selected: Object[]) => { setSelected(selected); setAddToCatOpen(true) }}
                ariaLabel={"Add selected objects to catalogs"}
                selected={selected}
                icon={<AnalysisIcon />}
            />
            <AddToCatalogPopup
                open={addToCatOpen}
                onConfirm={(selectedCats) => { setAddToCatOpen(false); selectedCats.forEach((c) => { addObjectsToCatalog.mutateAsync({ catalog_id: c.id, object_ids: selected.map((o) => { return o.id }) }) }) }}
                onCancel={() => { setAddToCatOpen(false) }}
            />
        </>
    )
}


export function AddToProposalAction({ selected, setSelected }: { selected: Object[], setSelected: React.Dispatch<React.SetStateAction<Object[]>> }) {
    const [addToPropOpen, setAddToPropOpen] = useState(false);
    const addObjectsToProposal = useAddObjectsToProposal();
    const { updateNotif } = useNotifs()

    useEffect(() => {
        switch (addObjectsToProposal.status) {
            case 'idle':
                updateNotif(false, "", "", null);
                break;
            case 'pending':
                updateNotif(true, 'Adding objects to proposals...', 'info', null);
                break;
            case 'error':
                updateNotif(true, `Error adding objects to proposals: ${addObjectsToProposal.error}`, 'error', 3000);
                break;
            case 'success':
                updateNotif(true, 'Objects added to proposals', 'success', 3000);
                break;
        }
    }, [addObjectsToProposal.status]);

    return (
        <>
            <SelectionActionButton
                action={(selected: Object[]) => { setSelected(selected); setAddToPropOpen(true) }}
                ariaLabel={"Add selected objects to proposals"}
                selected={selected}
                icon={<ProposalIcon />}
            />
            <AddToProposalPopup
                open={addToPropOpen}
                onConfirm={(selectedProps) => { setAddToPropOpen(false); selectedProps.forEach((p) => { addObjectsToProposal.mutateAsync({ proposal_id: p.id, object_ids: selected.map((o) => { return o.id }) }) }) }}
                onCancel={() => { setAddToPropOpen(false) }}
            />
        </>
    )
}

export function AttachFlagAction({ selected, setSelected }: { selected: Object[], setSelected: React.Dispatch<React.SetStateAction<Object[]>> }) {
    const [addFlagOpen, setAddFlagOpen] = useState(false);
    const addFlagToObject = useAddFlagToObjects();
    const { updateNotif } = useNotifs()

    useEffect(() => {
        switch (addFlagToObject.status) {
            case 'idle':
                updateNotif(false, "", "", null);
                break;
            case 'pending':
                updateNotif(true, 'Adding flags to objects...', 'info', null);
                break;
            case 'error':
                updateNotif(true, `Error adding flags to objects: ${addFlagToObject.error}`, 'error', 3000);
                break;
            case 'success':
                updateNotif(true, 'Flags added to objects', 'success', 3000);
                break;
        }
    }, [addFlagToObject.status]);

    return (
        <>
            <SelectionActionButton
                action={(selected: Object[]) => { setSelected(selected); setAddFlagOpen(true) }}
                ariaLabel={"Attach flags to selected objects"}
                selected={selected}
                icon={<FlagIcon />}
            />
            <AddFlagPopup open={addFlagOpen} onConfirm={(selectedFlags) => { setAddFlagOpen(false); selectedFlags.forEach((f) => { addFlagToObject.mutateAsync({ flag_id: f.id, obj_ids: selected.map((o) => { return o.id }) }) }) }} onCancel={() => { setAddFlagOpen(false) }} />
        </>
    )
}

