import "./styles/Message.scss";
import { FC } from "react";
import Chip from "@mui/material/Chip";
interface MessageProps {
    name: string;
    body: string;
    user: string;
}
const Message: FC<MessageProps> = ({ name, body, user }) => {
    return (
        <div className="message-container" isme={(name === user).toString()}>
            <Chip color="primary" style={name === user ? { display: "none" } : {}} label={name} />
            <p>{` ${body}`}</p>
        </div>
    );
};
export default Message;
