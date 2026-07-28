import { Snackbar, Alert } from "@mui/material"

export function Notifier({ visible, setVisible, text, severity, duration }: {visible: boolean, setVisible: (visible: boolean) => void, text: string, severity: "error" | "info" | "success", duration: number | null}) {
    return (
        <Snackbar open={visible} autoHideDuration={duration} onClose={() => { setVisible(false) }} sx={{ zIndex: (theme) => theme.zIndex.tooltip + 1 }}>
            <Alert severity={severity} onClose={() => { setVisible(false) }}>
                {text}
            </Alert>
        </Snackbar>
    );
}