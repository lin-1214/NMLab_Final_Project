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
      <Chip
        color="secondary"
        style={name === user ? { display: "none" } : {}}
        label={name}
      />
      <p
        style={{ fontWeight: 600, color: "white", backgroundColor: "#607274" }}
      >{` ${body}`}</p>
    </div>
  );
};
export default Message;
