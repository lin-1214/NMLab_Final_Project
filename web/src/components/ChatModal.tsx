import { FC, useState } from "react";
import Modal from "./Modal-template";
import CustomInput from "./Input-template";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { FormControl, FormControlState } from "@mui/base/FormControl";
import ErrorIcon from "@mui/icons-material/Error";
import BusinessIcon from "@mui/icons-material/Business";
interface ChatModalProps {
    open: boolean;
    onCreate: (values: any) => void;
    onCancel: () => void;
}

const ChatModal: FC<ChatModalProps> = ({ open, onCreate, onCancel }) => {
    const [chatRoomName, setChatRoomName] = useState("");
    const [company, setCompany] = useState("");
    const [error, setError] = useState(false);
    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // setValues({ ...values, [event.target.name]: event.target.value });
        setChatRoomName(event.target.value);
    };
    const handleCompanyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // setValues({ ...values, [event.target.name]: event.target.value });
        setCompany(event.target.value);
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
                if (!checkNameValidility(chatRoomName) || !checkNameValidility(company)) {
                    setError(true);
                    return;
                }
                onCreate({ name: chatRoomName, company: company });
            }}
        >
            <FormControl required onChange={handleNameChange} error={error}>
                <CustomInput
                    id="chatmodal-name"
                    label="Name"
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
            </FormControl>
            <div style={{ height: "20px" }}> </div>
            <FormControl required onChange={handleCompanyChange} error={error}>
                <CustomInput
                    id="chatmodal-company"
                    label="Company"
                    variant="outlined"
                    icon={
                        <BusinessIcon
                            sx={{
                                color: "action.active",
                                scale: "200%",
                                ml: "10px",
                                mr: "10px",
                                display: "block",
                            }}
                        />
                    }
                    inputProps={{
                        style: { fontSize: 15, width: "150px", height: "15px" },
                    }}
                />
            </FormControl>
        </Modal>
    );
};

export default ChatModal;
