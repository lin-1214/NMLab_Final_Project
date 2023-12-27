import { FC, useState, SyntheticEvent } from "react";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { Alert, AlertColor } from "@mui/material";
interface StatusProps {
    message: string;
    duration?: number;
    open: boolean;
    setOpen: (open: boolean) => void;
    severity: AlertColor;
}
const SimpleSnackbar: FC<StatusProps> = ({ message, duration, open, setOpen, severity }) => {
    const handleClose = (event: SyntheticEvent | Event, reason?: string) => {
        setOpen(false);
    };

    const action = (
        <>
            <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
                <CloseIcon fontSize="small" />
            </IconButton>
        </>
    );

    return (
        <Snackbar
            open={open}
            autoHideDuration={duration || 3000}
            onClose={handleClose}
            action={action}
        >
            <Alert severity={severity} onClose={handleClose} sx={{ width: "100%" }}>
                {message}
            </Alert>
        </Snackbar>
    );
};

export default SimpleSnackbar;
