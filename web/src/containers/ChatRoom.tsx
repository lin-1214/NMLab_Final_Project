import { FC, useState, useEffect, useRef } from "react";
import Message from "../components/Message";
import ChatModal from "../components/ChatModal";
import { useUserData } from "../hooks/useUserData";
import { useChat } from "../hooks/useChat";
import "./styles/ChatRoom.scss";
import { Button, TextField } from "@mui/material";
import {
    statusType,
    ChatBoxStates,
    ChatRoomProps,
    messageTypes,
    ChatRoomInputProps,
} from "../types";
import * as ChatRoomStyled from "./styles/ChatRoom.styled";
import SendIcon from "@mui/icons-material/Send";
import ChatRoomTabs from "../components/ChatRoomTabs";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const displayStatus = (status: statusType) => {
    if (status.msg) {
        const { type, msg } = status;
        const content = {
            content: msg,
            duration: type === "error" ? 2 : type === "fatal error" ? 5 : 0.5,
        };
        console.log(content, type);
    }
};
const ChatRoomInput: FC<ChatRoomInputProps> = ({ bodyRef, onSubmit }) => {
    const [body, setBody] = useState("");
    const handleSubmit = () => {
        if (onSubmit(body)) {
            setBody("");
        }
    };
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "row",
                alignContent: "center",
                justifyContent: "flex-start",
                paddingTop: "10px",
                height: "6vh",
                fontSize: "12rem",
            }}
        >
            <TextField
                ref={bodyRef}
                placeholder="Type a message here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key == "Enter" && !e.nativeEvent.isComposing) {
                        // console.log("enter", e);
                        handleSubmit();
                    }
                }}
                size="small"
                inputProps={{
                    style: { fontSize: 18, fontWeight: 600, width: "min(75dvmax,650px)" },
                }}
                autoFocus
            ></TextField>
            <div
                onClick={() => handleSubmit()}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <SendIcon></SendIcon>
            </div>
        </div>
    );
};
const ChatRoom: FC<ChatRoomProps> = ({ user }) => {
    const { userName, company, setLogOut } = useUserData();
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
    // console.log("ChatRoom", messages);
    // multiple chat box
    const [activeKey, setActiveKey] = useState("");
    const [chatBoxes, setChatBoxes] = useState<ChatBoxStates[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [showXmas, setShowXmas] = useState(false);
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
            console.log("3 useEffect", key, activeKey);
            return {
                label,
                children: activeKey === key ? extractChat(key) : children,
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
        // console.log("2 displayMessages", chat);
        return chat.length === 0 ? (
            <p style={{ color: "#ccc" }}> No messages... </p>
        ) : (
            chat.map(({ name, body }, i) => {
                // console.log("displayMessages", name, body);
                if (name && body) {
                    if (
                        i === chat.length - 1 &&
                        (body.includes("Xmas") ||
                            body.includes("xmas") ||
                            body.includes("Christmas") ||
                            body.includes("christmas") ||
                            body.includes("聖誕"))
                    ) {
                        setShowXmas(true);
                        setTimeout(() => {
                            setShowXmas(false);
                        }, 2900);
                    }
                    return <Message key={i} name={name} body={body} user={userName}></Message>;
                }
            })
        );
    }; // 產⽣ Message 的 DOM nodes
    const renderChat = (chat: messageTypes[]) => (
        <ChatRoomStyled.ChatBox>
            {displayMessages(chat)}
            <ChatRoomStyled.FootRef ref={RoomBottomRef} />
        </ChatRoomStyled.ChatBox>
    ); // 產⽣ chat 的 DOM nodes
    const extractChat = (friend: string) => {
        const [toName, toCompany] = friend.split(" ");
        // console.log("1 extractChat", messages, friend, `${userName} ${company}`);
        return renderChat(messages.filter(({ name }) => name === toName || name === userName));
    }; // chatBox 的 children 來源 friend or user
    const createChatBox = ({ name: friend, company }: { name: string; company: string }) => {
        const targetKey = `${friend} ${company}`;
        if (chatBoxes.some(({ key }) => key === targetKey)) {
            throw new Error(friend + "'s chat box has already opened.");
        }
        startChat(userName, targetKey);
        const chat = extractChat(targetKey);
        setChatBoxes([...chatBoxes, { label: friend, children: chat, key: targetKey }]);
        setMsgSent(true);
        // console.log("createChatBox", friend);
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
    // text bar
    const handleTextChange = (msg: string) => {
        if (activeKey === "") {
            displayStatus({
                type: "error",
                msg: "Please select a chat room first!",
            });
            return false;
        }
        if (msg === "") {
            displayStatus({
                type: "error",
                msg: "You didn't enter any message!",
            });
            return false;
        }
        // sendMessage({ name: userName, body: msg });
        const [toName, toCompany] = activeKey.split(" ");
        sendMessageInBox({
            name: userName,
            to: toName,
            companys: [company, toCompany],
            body: msg,
        });
        setMsgSent(true);
        return true;
    };
    return (
        <div className="ChatRoomBackground">
            <ChatRoomStyled.Wrapper>
                <div className="ChatBoxTitle">
                    <div style={{ display: "flex", justifySelf: "end", alignItems: "center" }}>
                        <CheckCircleIcon color={"primary"} />
                        <h1>{userName}'s Chatroom</h1>
                    </div>
                    <Button
                        variant="contained"
                        onClick={() =>
                            clearChatBox({
                                name: userName,
                                to: activeKey.split(" ")[0],
                                companys: [company, activeKey.split(" ")[1]],
                            })
                        }
                        style={{ backgroundColor: "#b2a59b" }}
                    >
                        Clear
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => handleLogOut()}
                        style={{ backgroundColor: "#b2a59b" }}
                    >
                        Log Out
                    </Button>
                </div>
                <ChatRoomTabs
                    onChange={async (key: string) => {
                        // console.log("onChange", key);
                        // if (key !== "") {
                        //     startChat(userName, key);
                        // }
                        // await delay(200);
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
                    setShowXmas={setShowXmas}
                ></ChatRoomTabs>
                <ChatModal
                    open={modalOpen}
                    onCreate={({ name, company }) => {
                        createChatBox({ name, company });
                        setActiveKey(`${name} ${company}`);
                        setModalOpen(false);
                        // console.log("onCreate done", { name, company });
                    }}
                    onCancel={() => {
                        setModalOpen(false);
                    }}
                />
                <ChatRoomInput bodyRef={bodyRef} onSubmit={handleTextChange}></ChatRoomInput>
                <img
                    src="src/assets/XmasTree.png"
                    alt="XmasTree"
                    className={`img-hidden ${showXmas ? "pop" : ""}`}
                ></img>
            </ChatRoomStyled.Wrapper>
        </div>
    );
};

export { displayStatus };
export default ChatRoom;
