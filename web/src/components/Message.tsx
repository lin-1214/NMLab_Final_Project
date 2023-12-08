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
        <div className="message-container" isMe={(name === user).toString()}>
            <p>
                <Chip
                    color="primary"
                    style={name === user ? { display: "none" } : {}}
                    label={name}
                />
                {` ${body}`}
            </p>
        </div>
    );
};
export default Message;
