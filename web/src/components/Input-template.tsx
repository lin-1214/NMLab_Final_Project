import React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { useFormControlContext } from "@mui/base/FormControl";

interface InputProps {
    id: string;
    label: string;
    icon?: React.ReactNode;
    variant: "standard" | "filled" | "outlined";
}

const Input: React.FC<InputProps> = ({ id, label, icon, variant }) => {
    const formControlContext = useFormControlContext();
    if (formControlContext === undefined) return null;
    const { value, required, onChange, disabled, onFocus, onBlur } = formControlContext;
    return (
        <Box sx={{ display: "flex", alignItems: "flex-end" }}>
            {icon}
            <TextField
                id={id}
                type="text"
                value={value}
                label={label}
                variant={variant}
                required={required}
                onChange={onChange}
                disabled={disabled}
                onFocus={onFocus}
                onBlur={onBlur}
            />
        </Box>
    );
};
export default Input;
