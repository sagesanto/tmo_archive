import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

type ConfirmationPopupProps = {
    open: boolean;
    message: string;
    onConfirm: () => void;
    onClose: () => void;
    confirmText?: string;
    cancelText?: string;
};

export function ConfirmationPopup({open, message, onConfirm, onClose, confirmText = 'Confirm',cancelText = 'Cancel',}: {open: boolean; message: string; onConfirm: () => void; onClose: () => void; confirmText?: string; cancelText?: string;}) {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Confirmation</DialogTitle>
            <DialogContent>
                <DialogContentText>{message}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{cancelText}</Button>
                <Button onClick={handleConfirm} color="primary" variant="contained" autoFocus>
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};