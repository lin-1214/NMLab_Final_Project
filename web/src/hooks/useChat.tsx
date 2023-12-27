import { FC, createContext, useEffect, useState, useContext } from "react";
import {
    messageTypes,
    sendDataTypes,
    verificationTypes,
    RSASessionCommandTypes,
    publicKeysTypes,
    ChatBoxDataTypes,
    ChatBoxSessionStatus,
    ChatBoxStates,
} from "../types";

// console.log("i enter useChat");
import { useUserData } from "./useUserData";
// import crypto from "crypto";

const backendURL = "localhost:4000";
const IOTAURL = "localhost:4096";
const RPiURL = "localhost:8000";
// const RPiURL = "raspberrypi.local:8000";
var mainServerClient = new WebSocket(`ws://${backendURL}`);
var localRPiClient = new WebSocket(`ws://${RPiURL}`);
// var IOTAServerClient = new WebSocket(`ws://${IOTAURL}`);

const myClients = [mainServerClient, localRPiClient];
enum clientKey {
    backend,
    RPi,
}
// console.log("client url: ", mainServerClient.url);
// console.log("client protocol: ", mainServerClient.protocol);
// console.log("Backend client: ", mainServerClient);
// console.log("RPi client: ", localRPiClient);

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const isValideMessage = (msg: messageTypes): msg is messageTypes => {
    if (msg.name && msg.to && msg.body) return true;
    return false;
};
const digestMessage = async (message: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hash = await crypto.subtle.digest("SHA-256", data);
    const hash8 = new Uint8Array(hash);
    const text = btoa(String.fromCharCode(...hash8));
    return text;
};

interface UseChatTypes {
    status: { type?: string; msg?: string };
    messages: messageTypes[];
    msgSent: boolean;
    setMsgSent: React.Dispatch<React.SetStateAction<boolean>>;
    askInit: () => void;
    startChat: (name: string, to: string) => void;
    sendMessageInBox: (payload: messageTypes) => void;
    clearChatBox: (participants: messageTypes) => void;
    sendLoginData: (payload: {
        state: string;
        userName: string;
        password: string;
        company: string;
    }) => void;
    sendRegisterData: (payload: {
        state: string;
        company: string;
        userName: string;
        password: string;
        pincode?: string;
    }) => void;
    askVP: (payload: { company: string; name: string; challenge: string; askID: string }) => void;
    setSignInCallBack: React.Dispatch<React.SetStateAction<() => void>>;
    setSignInFailCallBack: React.Dispatch<React.SetStateAction<() => void>>;
}

const ChatData = createContext<UseChatTypes>({
    status: {},
    messages: [],
    msgSent: false,
    setMsgSent: () => {},
    askInit: () => {},
    startChat: () => {},
    sendMessageInBox: () => {},
    clearChatBox: () => {},
    sendLoginData: () => {},
    sendRegisterData: () => {},
    askVP: () => {},
    setSignInCallBack: () => {},
    setSignInFailCallBack: () => {},
});
interface UseChatProviderProps {
    children: React.ReactNode;
}

const UseChatProvider: FC<UseChatProviderProps> = (props) => {
    // define messages, status
    useEffect(() => {
        console.log("creating useChat");
        return () => console.log("unMounting useChat");
    }, []);

    const [messages, setMessages] = useState<messageTypes[]>([]);
    const [status, setStatus] = useState<{ type?: string; msg?: string }>({});
    const [signInCallBak, setSignInCallBack] = useState<() => void>(() => () => {});
    const [signInFailCallBak, setSignInFailCallBack] = useState<() => void>(() => () => {});
    const [chatBoxSessions, setChatBoxSessions] = useState<{ [key: string]: ChatBoxSessionStatus }>(
        {}
    ); // {box: key}
    const [msgSent, setMsgSent] = useState(true);
    const { setLogOut, setNowUser, setNowPassword, company, userName, signedIn } = useUserData();
    useEffect(() => {
        setMessages([]);
        setStatus({});
        setSignInCallBack(() => () => {});
        setSignInFailCallBack(() => () => {});
    }, [signedIn]);

    const safeSendData = async (
        data: string,
        clients: WebSocket[],
        clientKey: number,
        onmessage: (byteString: MessageEvent<string>) => void,
        errorMsg: string = "Connnection Failed",
        attempt = 0
    ) => {
        let client = clients[clientKey];
        if (attempt > 5) {
            // console.error(errorMsg);
            setStatus({ type: "error", msg: errorMsg });
            return;
        }
        if (client.readyState === client.CONNECTING) {
            safeSendData(data, clients, clientKey, onmessage, errorMsg, attempt + 1);
            return;
        }
        if (client.readyState === client.CLOSED || client.readyState === client.CLOSING) {
            // setStatus({ type: "info", msg: "Connecting..." });
            await delay(100);
            client = new WebSocket(client.url);
            clients[clientKey] = client;
            if (client.readyState === client.CONNECTING) await delay(200);
            if (client.readyState !== client.OPEN) {
                safeSendData(data, clients, clientKey, onmessage, errorMsg, attempt + 1);
                return;
            } else {
                // setStatus({ type: "success", msg: "Connected!" });
                askInit();
                client.onmessage = (byteString) => onmessage(byteString);
            }
        }
        client.send(data);
    };
    // TODO: change sendData to sendCryptoData if send to rpi
    const sendRPiData = async (data: string, attempt = 0) => {
        // const dataObj = JSON.parse(data);
        // dataObj.publicKey = await digestMessage(dataObj.userName);
        // dataObj.signature = await digestMessage(dataObj.company + dataObj.userName);
        // if (dataObj.state === "login") {
        //     console.log("send login data");
        //     sendData(["Login", dataObj]);
        // } else if (dataObj.state === "register") {
        //     console.log("send register data");
        //     sendData(["Register", dataObj]);
        // } else {
        //     console.log("send data");
        //     dataObj.challenge = dataObj.message;
        //     sendData(["Signature", dataObj]);
        // }
        // return;
        console.log("send data: ", data);
        safeSendData(
            JSON.stringify(data),
            myClients,
            clientKey.RPi,
            RPiClientOnMsg,
            "RPi Connnection Failed",
            attempt
        );
    };
    const sendData = async (
        data:
            | [sendDataTypes, messageTypes | "init" | verificationTypes]
            | [RSASessionCommandTypes, ChatBoxDataTypes],
        attempt = 0
    ) => {
        safeSendData(
            JSON.stringify(data),
            myClients,
            clientKey.backend,
            mainClientOnMsg,
            "Main Server Connnection Failed",
            attempt
        );
    };
    const askInit = () => {
        sendData(["init", "init"]);
    };
    //ChatBoxes
    const startChat = (name: string, to: string) => {
        console.log(`start a chatbox of ${name + to}`);
        const [toName, toCompany] = to.split(" ");
        setMessages([]);
        sendData(["CHAT", { name, to: toName, companys: [company, toCompany] }]);
    };
    const sendMessageInBox = (payload: messageTypes) => {
        console.log("MESSAGE", payload);
        sendData(["MESSAGE", payload]);
    };
    const clearChatBox = (participants: messageTypes) => {
        console.log("clear");
        sendData(["CLEAR", participants]);
    };
    const mainClientOnMsg = async (byteString: MessageEvent<string>) => {
        const { data } = byteString;
        const [task, payload] = JSON.parse(data);
        console.log("main receive: ", task);
        console.log("payload:", payload);
        switch (task) {
            case "output": {
                console.log("receive output");
                let prevMessages = messages;
                payload?.forEach((msg: messageTypes) => {
                    if (isValideMessage(msg)) {
                        prevMessages = [...prevMessages, msg];
                    } else console.error("invalid message: ", msg);
                });
                // console.log("prevMessages: ", prevMessages);
                setMessages(prevMessages);
                break;
            }
            case "status": {
                setStatus(payload);
                break;
            }
            case "init": {
                console.log("receive init", payload);
                setMessages(payload);
                setMsgSent(true);
                break;
            }
            case "cleared": {
                setMessages([]);
                break;
            }
            case "Login": {
                const data = payload;
                console.log("login: ", data);
                if (data.state === "success") {
                    signInCallBak();
                    setSignInCallBack(() => () => {});
                    console.log("login success");
                } else {
                    setStatus({ type: "error", msg: "Login Failed" });
                    signInFailCallBak();
                    setSignInFailCallBack(() => () => {});
                    setNowUser("");
                    setNowPassword("");
                    setLogOut();
                }
                break;
            }
            case "Register": {
                const data = payload;
                console.log("register: ", data);

                if (data.state === "success") {
                    signInCallBak();
                    setSignInCallBack(() => () => {});
                    console.log("login success");
                } else if (data.state === "exist") {
                    setStatus({ type: "error", msg: "Account Exist!" });
                } else {
                    setStatus({ type: "error", msg: "Register Failed!" });
                    signInFailCallBak();
                    setSignInFailCallBack(() => () => {});
                    setNowUser("");
                    setNowPassword("");
                    setLogOut();
                }
                break;
            }
            case "VP": {
                const { ID, challenge, userName, company } = payload;
                // if (localRPiClient.readyState !== localRPiClient.OPEN) {
                //     await askVP({ company, name: userName, challenge, askID: ID });
                // } else {
                //     await Promise.all([
                //         askVP({ company, name: userName, challenge, askID: ID }),
                //         sendRPiData(JSON.stringify({ state: "sign", message: challenge })),
                //     ]);
                // }
                console.log("askVP: ", payload);
                await Promise.all([
                    askVP({ company, name: userName, challenge, askID: ID }),
                    sendRPiData(
                        JSON.stringify({
                            state: "sign",
                            message: challenge,
                            company,
                            userName,
                            ID,
                        })
                    ),
                ]);
                break;
            }
            default:
                break;
        }
    };
    const RPiClientOnMsg = (byteString: MessageEvent<string>) => {
        const { data } = byteString;
        console.log("from RPi receive: ", data);
        // const [task, payload] = JSON.parse(data);
        const [task, payload] = JSON.parse(data.replace(/"/g, '"').replace(/'/g, '"'));
        console.log("from RPi receive: ", task);
        console.log("from RPi receive payload: ", payload);
        // const client = myClients[clientKey.RPi];
        // sendData([task, payload]);
        const { state } = payload;
        switch (state) {
            // send to backend
            case "register": {
                sendData(["Register", payload]);
                break;
            }
            case "login": {
                sendData(["Login", payload]);
                break;
            }
            default:
                break;
        }
        switch (task) {
            case "Signature": {
                sendData(["Signature", { ...payload, challenge: payload.message }]);
                break;
            }
            case "Message": {
                sendData(["MESSAGE", payload]);
                break;
            }
            default:
                break;
        }
    };
    // TODO: send login content plaintext to RPi
    const sendRegisterData = async (payload: {
        state: string;
        company: string;
        userName: string;
        password: string;
        pincode?: string;
    }) => {
        console.log("Register payload: ", JSON.stringify(payload));
        const password = await digestMessage(payload.password);
        sendRPiData(JSON.stringify({ ...payload, password }));
    };
    const sendLoginData = async (payload: {
        state: string;
        userName: string;
        password: string;
        company: string;
    }) => {
        const password = await digestMessage(payload.password);
        sendRPiData(JSON.stringify({ ...payload, password }));
    };
    const askVP = async (payload: {
        company: string;
        name: string;
        challenge: string;
        askID: string;
    }) => {
        const { company, name, challenge, askID } = payload;
        await fetch(
            `http://${IOTAURL}/sign?` +
                new URLSearchParams({
                    company,
                    name,
                    challenge,
                })
        )
            .then(async (res) => {
                if (res.status !== 200) {
                    throw `askVP error ${res.status}: ${await res.text()}`;
                }
                return await res.text();
            })
            .then(async (res) => {
                console.log(res);
                if (res) {
                    sendData(["VP", { ID: askID, challenge, vp: res }]);
                } else {
                    console.error(`askVP error: `, res);
                }
            })
            .catch((e) => {
                console.error(`unCaught askVP error: `, e);
            });
    };
    const ChatBoxControll = async ({ status, key, publicKeys, id, name, to }: ChatBoxDataTypes) => {
        switch (status) {
            case "close":
                return {
                    task: ["RSAEstablishing", { id, name, to, publicKeys }],
                    nextState: "RSAEstablishing",
                    needEncrypt: false,
                    needTransmit: true,
                    needDecrypt: false,
                    rpiSave: false,
                };
            case "RSAEstablishing":
                const sessionKey = await crypto.subtle.generateKey(
                    {
                        name: "AES-GCM",
                        length: 256,
                    },
                    true,
                    ["encrypt", "decrypt"]
                );
                const exportedSessionKey = await crypto.subtle.exportKey("jwk", sessionKey);
                if (!publicKeys) throw "publicKeys not found";
                if (!publicKeys[to]) throw "publicKeys 'to' not found";
                if (!publicKeys[name]) throw "publicKeys 'name' not found";
                return {
                    task: [
                        "RSAEstablished",
                        { id, name, to, publicKeys, key: JSON.stringify(exportedSessionKey) },
                    ],
                    nextState: "RSAEstablished",
                    needEncrypt: false,
                    needTransmit: true,
                    needDecrypt: false,
                    rpiSave: false,
                };
            case "RSAEstablished":
                return {
                    task: ["KeyExchanged", { id, name, to, publicKeys, key }],
                    nextState: "KeyExchanged",
                    needEncrypt: false,
                    needTransmit: false,
                    needDecrypt: true,
                    rpiSave: true,
                };
            case "KeyExchanged":
                return {
                    task: ["KeyExchanged", { id, name, to, publicKeys, key }],
                    nextState: "KeyExchanged",
                    needEncrypt: false,
                    needTransmit: false,
                    needDecrypt: true,
                    rpiSave: true,
                };
        }
    };
    // useEffect(() => {
    //     setMsgSent(() => !msgSent);
    // }, [status]);

    myClients[clientKey.backend].onmessage = (byteString) => mainClientOnMsg(byteString);
    myClients[clientKey.RPi].onmessage = (byteString) => RPiClientOnMsg(byteString);
    for (let i = 0; i < myClients.length; i++) {
        myClients[i].onclose = (e) => {
            if (i === clientKey.RPi) return;
            console.log(`Socket ${i} is closed.`, e.reason);
            let msg = "Server Lost. Please Check your Internet!";
            setStatus({ type: "fatal error", msg: msg });
        };
    }
    return (
        <ChatData.Provider
            value={{
                status,
                messages,
                msgSent,
                setMsgSent,
                askInit,
                startChat,
                sendMessageInBox,
                clearChatBox,
                sendLoginData,
                sendRegisterData,
                askVP,
                setSignInCallBack,
                setSignInFailCallBack,
            }}
            {...props}
        ></ChatData.Provider>
    );
};

const useChat = () => useContext(ChatData);
export { useChat, UseChatProvider };
