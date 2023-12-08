import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

interface ModalProps {
    open: boolean;
    title: string;
    content?: string;
    submitText?: string;
    cancelText?: string;
    onSubmit: () => void;
    onCancel: () => void;
    children?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
    open,
    title,
    content,
    submitText = "Submit",
    cancelText = "Cancel",
    onSubmit,
    onCancel,
    children,
}) => {
    const handleClose = () => {
        onCancel();
    };
    const handleSubmit = () => {
        onSubmit();
    };

    return (
        <>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{content}</DialogContentText>
                </DialogContent>
                {children}
                <DialogActions>
                    <Button onClick={handleClose}>{cancelText}</Button>
                    <Button onClick={handleSubmit}>{submitText}</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Modal;
