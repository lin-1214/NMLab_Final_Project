import { FC, useState, useEffect, useRef } from "react";
import Title from "../components/Title";
import Message from "../components/Message";
import ChatModal from "../components/ChatModal";
import { useUserData } from "../hooks/useUserData";
import useChat from "../hooks/useChat";
import "./styles/ChatRoom.scss";
import { Button, TextField } from "@mui/material";
import { statusType, ChatBoxStates, ChatRoomProps, messageTypes } from "../types";
import * as ChatRoomStyled from "./styles/ChatRoom.styled";
import SendIcon from "@mui/icons-material/Send";
import ChatRoomTabs from "../components/ChatRoomTabs";
const displayStatus = (status: statusType) => {
    if (status.msg) {
        const { type, msg } = status;
        const content = {
            content: msg,
            duration: type === "error" ? 2 : type === "fatal error" ? 5 : 0.5,
        };
        console.log(content, type);
        // switch (type) {
        //     case "success":
        //         message.success(content);
        //         break;
        //     case "info":
        //         message.info(content);
        //         break;
        //     case "error":
        //     default:
        //         message.error(content);
        //         break;
        // }
    }
};
const ChatRoom: FC<ChatRoomProps> = ({ user }) => {
    const { userName, setLogOut } = useUserData();
    const [body, setBody] = useState("");
    const bodyRef = useRef<HTMLInputElement>(null);
    const RoomBottomRef = useRef<HTMLDivElement>(null);
    const {
        status,
        messages,
        msgSent,
        setMsgSent,
        askInit,
        startChat,
        sendMessageInBox,
        clearChatBox,
    } = useChat();
    console.log("ChatRoom", messages);
    // multiple chat box
    const [activeKey, setActiveKey] = useState("");
    const [chatBoxes, setChatBoxes] = useState<ChatBoxStates[]>([
        { label: "General", children: [], key: "General" },
    ]);
    const [modalOpen, setModalOpen] = useState(false);
    useEffect(() => {
        askInit();
    }, []);
    useEffect(() => {
        displayStatus(status);
    }, [status]);
    useEffect(() => {
        scrollToBottom();
        setMsgSent(false);
    }, [msgSent]);
    useEffect(() => {
        const newChatBoxes = chatBoxes.map(({ label, children, key }) => {
            return {
                label,
                children: activeKey === label ? extractChat(label) : children,
                key,
            };
        });
        setChatBoxes(newChatBoxes);
        scrollToBottom();
    }, [messages]);
    useEffect(() => {
        if (activeKey !== "") {
            startChat(userName, activeKey);
        }
    }, [activeKey]);
    const handleLogOut = () => {
        setLogOut();
    };
    const scrollToBottom = () => {
        RoomBottomRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };
    const displayMessages = (chat: messageTypes[]) => {
        console.log("displayMessages", chat);
        return chat.length === 0 ? (
            <p style={{ color: "#ccc" }}> No messages... </p>
        ) : (
            chat.map(({ name, body }, i) => {
                if (name && body)
                    return <Message key={i} name={name} body={body} user={userName}></Message>;
            })
        );
    }; // 產⽣ Message 的 DOM nodes
    const renderChat = (chat: messageTypes[]) => (
        <ChatRoomStyled.ChatBox>
            {displayMessages(chat)}
            <ChatRoomStyled.FootRef ref={RoomBottomRef} />
        </ChatRoomStyled.ChatBox>
    );
    // 產⽣ chat 的 DOM nodes
    const extractChat = (friend: string) => {
        return renderChat(messages.filter(({ name }) => name === friend || name === userName));
    }; // chatBox 的 children 來源 friend or user
    const createChatBox = (friend: string) => {
        if (chatBoxes.some(({ key }) => key === friend)) {
            throw new Error(friend + "'s chat box has already opened.");
        }
        startChat(userName, friend);
        const chat = extractChat(friend);
        setChatBoxes([...chatBoxes, { label: friend, children: chat, key: friend }]);
        setMsgSent(true);
        console.log("createChatBox", friend);
        return friend;
    };
    const removeChatBox = (targetKey: string, activeKey: string) => {
        const index = chatBoxes.findIndex(({ key }) => key === activeKey);
        const newChatBoxes = chatBoxes.filter(({ key }) => key !== targetKey);
        setChatBoxes(newChatBoxes);
        // console.log(targetKey, activeKey, index);
        return activeKey !== ""
            ? activeKey === targetKey
                ? index === 0
                    ? newChatBoxes.length === 0
                        ? ""
                        : newChatBoxes[0].key
                    : chatBoxes[index - 1].key
                : activeKey
            : "";
    };
    // console.log("Chatroom");

    // text bar
    const handleTextChange = (msg: string) => {
        if (activeKey === "") {
            displayStatus({
                type: "error",
                msg: "Please select a chat room first!",
            });
            return;
        }
        if (msg === "") {
            displayStatus({
                type: "error",
                msg: "You didn't enter any message!",
            });
            return;
        }
        // sendMessage({ name: userName, body: msg });
        sendMessageInBox({
            name: userName,
            to: activeKey,
            body: msg,
        });
        setBody("");
        setMsgSent(true);
    };
    return (
        <ChatRoomStyled.Wrapper>
            <Title name={user}>
                <Button
                    variant="contained"
                    onClick={() => clearChatBox({ name: userName, to: activeKey })}
                >
                    Clear
                </Button>
                <Button
                    variant="contained"
                    onClick={() => handleLogOut()}
                    style={{ marginLeft: "10px" }}
                >
                    Log Out
                </Button>
            </Title>
            <ChatRoomTabs
                onChange={(key: string) => {
                    console.log("onChange", key);
                    setActiveKey(key);
                }}
                onEdit={(targetKey, action) => {
                    if (action === "add") setModalOpen(true);
                    else if (action === "remove") {
                        setActiveKey(removeChatBox(targetKey, activeKey));
                    }
                }}
                items={chatBoxes}
                activeKey={activeKey}
            ></ChatRoomTabs>
            <ChatModal
                open={modalOpen}
                onCreate={(name: string) => {
                    createChatBox(name);
                    // setActiveKey();
                    setModalOpen(false);
                    console.log("onCreate done", name);
                }}
                onCancel={() => {
                    setModalOpen(false);
                }}
            />
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignContent: "center",
                    justifyContent: "center",
                }}
            >
                <TextField
                    ref={bodyRef}
                    placeholder="Type a message here..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onSubmit={() => handleTextChange(body)}
                    autoFocus
                ></TextField>
                <div
                    onClick={() => handleTextChange(body)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <SendIcon></SendIcon>
                </div>
            </div>
        </ChatRoomStyled.Wrapper>
    );
};

export { displayStatus };
export default ChatRoom;
