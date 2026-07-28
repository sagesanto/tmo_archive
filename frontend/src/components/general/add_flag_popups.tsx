import { Flag, getFlags, useAddFlagToObject } from "@api/flag";
import { Button, skeletonClasses, Stack, Typography } from "@mui/material";
import { useRef, useState, useEffect } from "react";
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { SelectableFlagList } from "@components/flags";


export function AddFlagPopup({ open, onConfirm, onCancel }: { open: boolean, onConfirm: (selected: Flag[]) => void, onCancel: () => void }) {
    const { data: flags, isLoading, isError } = getFlags();
    const [selected, setSelected] = useState<Flag[]>([]);

    if (isLoading) {
        return (
            <Dialog open={open} onClose={onCancel}>
                <DialogTitle>Loading Flags</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Loading flags...
                    </DialogContentText>
                </DialogContent>
            </Dialog>
        )
    }

    if (isError || (!isLoading && !flags)) {
        return (
            <Dialog open={open} onClose={onCancel}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Error while loading flags :(
                    </DialogContentText>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onClose={() => {setSelected([]); onCancel();}} scroll="paper" maxWidth="md" fullWidth={true}>
            <DialogTitle>Add Flags to Objects</DialogTitle>
            <DialogContent dividers={true}>
                <SelectableFlagList flags={flags!} selected={selected} setSelected={setSelected} />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => {setSelected([]); onCancel();}} variant="outlined" color='primary'>
                    Cancel
                </Button>
                <Button onClick={() => {onConfirm(selected); setSelected([]);}} variant="contained" color='primary'>
                    Add
                </Button>
            </DialogActions>
        </Dialog>
    )
}