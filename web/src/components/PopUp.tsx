import { FC, useState, SyntheticEvent } from "react";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
interface StatusProps {
    message: string;
    duration?: number;
    open: boolean;
    setOpen: (open: boolean) => void;
}
const SimpleSnackbar: FC<StatusProps> = ({ message, duration, open, setOpen }) => {
    const handleClose = (event: SyntheticEvent | Event, reason?: string) => {
        setOpen(false);
    };

    const action = (
        <>
            <Button color="secondary" size="small" onClick={handleClose}>
                UNDO
            </Button>
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
            message={message}
            action={action}
        />
    );
};

export default SimpleSnackbar;
