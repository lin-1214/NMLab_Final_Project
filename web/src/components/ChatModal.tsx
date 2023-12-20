import { FC, useState } from "react";
import Modal from "./Modal-template";
import CustomInput from "./Input-template";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { FormControl, FormControlState } from "@mui/base/FormControl";
import ErrorIcon from "@mui/icons-material/Error";
interface ChatModalProps {
    open: boolean;
    onCreate: (values: any) => void;
    onCancel: () => void;
}

const ChatModal: FC<ChatModalProps> = ({ open, onCreate, onCancel }) => {
    const [chatRoomName, setChatRoomName] = useState("");
    const [error, setError] = useState(false);
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // setValues({ ...values, [event.target.name]: event.target.value });
        setChatRoomName(event.target.value);
    };
    const checkNameValidility = (name: string) => {
        if (name.trim() === "") {
            return false;
        }
        name = name.trim();
        const pattern = /^[\w\-]+$/;
        return pattern.test(name);
    };
    return (
        <Modal
            open={open}
            title="Create a new chat room"
            submitText="Create"
            cancelText="Cancel"
            onCancel={onCancel}
            onSubmit={() => {
                if (!checkNameValidility(chatRoomName)) {
                    setError(true);
                    return;
                }
                onCreate(chatRoomName);
            }}
        >
            <FormControl required onChange={handleChange} error={error}>
                {({ filled, focused }: FormControlState) => (
                    <>
                        <CustomInput
                            id="name"
                            label="Chat Room Name"
                            variant="outlined"
                            icon={
                                <AccountCircle
                                    sx={{
                                        color: "action.active",
                                        scale: "200%",
                                        ml: "10px",
                                        mr: "10px",
                                        display: "block",
                                    }}
                                />
                            }
                            inputProps={{ style: { fontSize: 15, width: "150px", height: "15px" } }}
                        />
                        {filled && !focused && error && <ErrorIcon sx={{ color: "red" }} />}
                    </>
                )}
            </FormControl>
        </Modal>
    );
};

export default ChatModal;
