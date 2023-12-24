import { useEffect, useState } from "react";
import { messageTypes, sendDataTypes, verificationTypes } from "../types";

// console.log("i enter useChat");
import { useUserData } from "./useUserData";
const backendURL = "localhost:4000";
const IOTAURL = "localhost:4096";
const RPiURL = "raspberrypi.local:8000";
var mainServerClient = new WebSocket(`ws://${backendURL}`);
var localRPiClient = new WebSocket(`ws://${RPiURL}`);
// var IOTAServerClient = new WebSocket(`ws://${IOTAURL}`);

const myClients = [mainServerClient, localRPiClient];
enum clientKey {
    backend,
    RPi,
}
console.log("client url: ", mainServerClient.url);
console.log("client protocol: ", mainServerClient.protocol);

console.log("Backend client: ", mainServerClient);
console.log("RPi client: ", localRPiClient);
// console.log("IOTA client: ", IOTAServerClient);

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const isValideMessage = (msg: messageTypes): msg is messageTypes => {
    if (msg.name && msg.to && msg.body) return true;
    return false;
};
const digestMessage = async (message: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hash = await crypto.subtle.digest("SHA-256", data);
    console.log("hash:", hash);
    const decoder = new TextDecoder("utf-8");
    const text = decoder.decode(hash);
    return text;
};

const useChat = () => {
    // define messages, status
    useEffect(() => {
        console.log("creating useChat");
        return () => console.log("unMounting useChat");
    }, []);

    const [messages, setMessages] = useState<messageTypes[]>([]);
    const [status, setStatus] = useState<{ type?: string; msg?: string }>({});
    const [signInCallBak, setSignInCallBack] = useState<() => void>(() => () => {});
    const [signInFailCallBak, setSignInFailCallBack] = useState<() => void>(() => () => {});
    const [msgSent, setMsgSent] = useState(false);
    const { setLogOut, setNowUser, setNowPassword, company, userName } = useUserData();

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
            setStatus({ type: "info", msg: "Connecting..." });
            await delay(100);
            client = new WebSocket(client.url);
            clients[clientKey] = client;
            if (client.readyState === client.CONNECTING) await delay(200);
            if (client.readyState !== client.OPEN) {
                safeSendData(data, clients, clientKey, onmessage, errorMsg, attempt + 1);
                return;
            } else {
                setStatus({ type: "success", msg: "Connected!" });
                askInit();
                client.onmessage = (byteString) => onmessage(byteString);
            }
        }
        client.send(data);
    };

    // TODO: change sendData to sendCryptoData if send to rpi
    const sendRPiData = async (data: string, attempt = 0) => {
        // const dataObj = JSON.parse(data);
        // if (dataObj.state === "login") {
        //     console.log("send login data");
        //     sendData(["Login", dataObj]);
        // } else if (dataObj.state === "register") {
        //     console.log("send register data");
        //     sendData(["Register", dataObj]);
        // }
        safeSendData(
            JSON.stringify(data),
            myClients,
            clientKey.RPi,
            RPiClientOnMsg,
            "RPi Connnection Failed",
            attempt
        );
    };
    // const sendIOTAData = async (data: [sendDataTypes, messageTypes], attempt = 0) => {
    //     safeSendData(
    //         JSON.stringify(data),
    //         myClients,
    //         clientKey.IOTA,
    //         IOTAClientOnMsg,
    //         "IOTA Connnection Failed",
    //         attempt
    //     );
    // };
    const sendData = async (
        data: [sendDataTypes, messageTypes | "init" | verificationTypes],
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
        sendData(["CHAT", { name, to }]);
    };
    const sendMessageInBox = (payload: { name: string; to: string; body: string }) => {
        console.log("MESSAGE", payload);
        sendData(["MESSAGE", payload]);
    };
    const clearChatBox = (participants: { name: string; to: string }) => {
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
                let prevMessages = messages;
                payload?.forEach((msg: messageTypes) => {
                    if (isValideMessage(msg)) {
                        prevMessages = [...prevMessages, msg];
                    } else console.error("invalid message: ", msg);
                });
                setMessages(prevMessages);
                console.log("receive output");
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
                if (data.state === "success") {
                    signInCallBak();
                    setSignInCallBack(() => () => {});
                    console.log("login success");
                } else {
                    setStatus({ type: "error", msg: "Register Failed" });
                    signInFailCallBak();
                    setSignInFailCallBack(() => () => {});
                    setNowUser("");
                    setNowPassword("");
                    setLogOut();
                }
                break;
            }
            case "VP": {
                const { ID, challenge } = payload;
                if (localRPiClient.readyState !== localRPiClient.OPEN) {
                    await askVP({ company, name: userName, challenge, askID: ID });
                } else {
                    await Promise.all([
                        askVP({ company, name: userName, challenge, askID: ID }),
                        sendRPiData(JSON.stringify({ state: "sign", message: challenge })),
                    ]);
                }
                break;
            }
            default:
                break;
        }
    };
    const RPiClientOnMsg = (byteString: MessageEvent<string>) => {
        const { data } = byteString;
        const [task, payload] = JSON.parse(data.replace(/'/g, '"'));
        console.log("from RPi receive: ", task);
        console.log("from RPi receive payload: ", payload);
        // const client = myClients[clientKey.RPi];
        // sendData([task, payload]);
        switch (task) {
            // send to backend
            case "Register": {
                sendData(["Register", payload]);
                break;
            }
            case "Login": {
                sendData(["Login", payload]);
                break;
            }
            case "Signature": {
                sendData(["Signature", payload]);
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
    // const IOTAClientOnMsg = (byteString: MessageEvent<string>) => {
    //     const { data } = byteString;
    //     const [task, payload] = JSON.parse(data);
    //     console.log("RPi receive: ", task);
    //     const client = myClients[clientKey.IOTA];
    //     switch (task) {
    //         case "Login": {
    //             const data = JSON.parse(payload.replace(/'/g, '"'));
    //             if (data.state === "success") {
    //                 console.log("login success");
    //             } else {
    //                 setNowUser("");
    //                 setNowPassword("");
    //                 setLogOut();
    //             }
    //             break;
    //         }
    //         default:
    //             break;
    //     }
    // };
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
        payload.password = password.toString();
        console.log("password:", payload.password);
        sendRPiData(JSON.stringify(payload));
    };
    const sendLoginData = async (payload: {
        state: string;
        userName: string;
        password: string;
        company: string;
    }) => {
        payload.password = await digestMessage(payload.password).then((hash) => hash.toString());
        sendRPiData(JSON.stringify(payload));
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
    myClients[clientKey.backend].onmessage = (byteString) => mainClientOnMsg(byteString);
    myClients[clientKey.RPi].onmessage = (byteString) => RPiClientOnMsg(byteString);
    for (let i = 0; i < myClients.length; i++) {
        myClients[i].onclose = (e) => {
            console.log(`Socket ${i} is closed.`, e.reason);
            let msg = "Server Lost. Reconnect will be attempted in 5 second!";
            setStatus({ type: "fatal error", msg: msg });
        };
    }
    return {
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
    };
};

export default useChat;
