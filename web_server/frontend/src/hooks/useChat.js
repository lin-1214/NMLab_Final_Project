import { useEffect, useState } from "react";
console.log("i enter useChat");
var client = new WebSocket("ws://localhost:4000");
console.log(client.readyState);
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const useChat = (setMsgSent) => {
    // define messages, status
    useEffect(() => {
        console.log("creating useChat");
        return console.log("unMounting useChat");
    }, []);
    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState({});

    const sendData = async (data) => {
        if (client.readyState === client.CONNECTING) {
            let msg = "Server Connnecting. Please try again later!";
            setStatus({ type: "error", msg: msg });
            return;
        }
        if (
            client.readyState === client.CLOSED ||
            client.readyState === client.CLOSING
        ) {
            setStatus({ type: "info", msg: "Connecting..." });
            await delay(500);
            client = new WebSocket("ws://localhost:4000");
            console.log(client.readyState);
            if (client.readyState === client.CONNECTING) await delay(2000);
            if (client.readyState !== client.OPEN) {
                let msg = "Connnection Failed. Please try again later!";
                console.log(msg);
                setStatus({ type: "error", msg: msg });
                return;
            } else {
                setStatus({ type: "success", msg: "Connected!" });
                askInit();
                client.onmessage = (byteString) => clientOnMsg(byteString);
            }
        }
        client.send(JSON.stringify(data));
    };
    client.onclose = (e) => {
        console.log(
            "Socket is closed. Reconnect will be attempted in 5 second.",
            e.reason
        );
        console.log(client.readyState);
        let msg = "Server Lost. Reconnect will be attempted in 5 second!";
        setStatus({ type: "fatal error", msg: msg });
        setTimeout(async () => {
            console.log("trying");
            client = new WebSocket("ws://localhost:4000");
            await delay(500);
            if (client.readyState === client.OPEN) {
                setStatus({ type: "success", msg: "Connected!" });
                client.onmessage = (byteString) => clientOnMsg(byteString);
                askInit();
            }
            // let msg = "Reconnnection Failed. Please try again later!";
            // setStatus({ type: "error", msg: msg });
        }, 5000);
    };
    client.onmessage = (byteString) => clientOnMsg(byteString);
    const clientOnMsg = (byteString) => {
        const { data } = byteString;
        const [task, payload] = JSON.parse(data);
        console.log(task);
        switch (task) {
            case "output": {
                setMessages(() => [...messages, ...payload]);
                break;
            }
            case "status": {
                setStatus(payload);
                break;
                // { type:, msg: }
            }
            case "init": {
                console.log("receive init");
                setMessages(payload);
                setMsgSent(true);
                break;
                // { type:, msg: }
            }
            case "cleared": {
                setMessages([]);
                break;
            }
            default:
                break;
        }
    };
    // simple chatbox
    const clearMessages = () => {
        sendData(["clear"]);
    };
    const sendMessage = (payload) => {
        sendData(["input", payload]);
        console.log(payload);
    };
    const askInit = () => {
        sendData(["init", "hi"]);
    };

    //ChatBoxes
    const startChat = (name, to) => {
        console.log(`start a chatbox of ${(name, to)}`);
        sendData(["CHAT", { name, to }]);
    };
    const sendMessageInBox = (payload) => {
        console.log("MESSAGE", payload);
        sendData(["MESSAGE", payload]);
    };
    const clearChatBox = (participants) => {
        sendData(["CLEAR", participants]);
        console.log("clear");
    };
    return {
        status,
        messages,
        sendMessage,
        clearMessages,
        askInit,
        startChat,
        sendMessageInBox,
        clearChatBox,
    };
};
export default useChat;
