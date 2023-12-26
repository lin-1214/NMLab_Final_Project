import Message from "./models/message";
import { UserModel, MessageModel, ChatBoxModel } from "./models/chatbox";
import IdentityModel from "./models/identity";
import crypto from "crypto";
// 在 global scope 將 chatBoxes 宣告成空物件
const chatBoxes = {};
const needVerification = {};
const IOTAURL = "localhost:4096";

const sendData = (data, ws) => {
    ws.send(JSON.stringify(data));
};
const sendStatus = (payload, ws) => {
    sendData(["status", payload], ws);
};
const initData = (ws) => {
    Message.find()
        .sort({ created_at: -1 })
        .limit(100)
        .exec((err, res) => {
            if (err) throw err;
            // initialize app with existing messages
            console.log(res);
            sendData(["init", res], ws);
        });
};

const makeName = (name, to) => {
    return [name, to].sort().join("_");
};
const validateChatBox = async (name, participants) => {
    let box = await ChatBoxModel.findOne({ name });
    if (!box)
        box = await new ChatBoxModel({
            name,
            users: participants.map((user) => user._id),
        }).save();
    return box.populate(["users", { path: "messages", populate: "sender" }]);
};
const validateUser = async (name) => {
    let user = await UserModel.findOne({ name: name });
    if (user) return user;
    user = await new UserModel({ name: name, chatBoxes: [] }).save();
    return user;
};
const updateUserChatbox = async (user, chatBox_id) => {
    if (!user) return;
    const existing = user.chatBoxes.includes(chatBox_id);
    if (existing) return;
    await UserModel.updateOne(
        { _id: user._id },
        { $set: { chatBoxes: [...user.chatBoxes, chatBox_id] } }
    );
    return;
};
const initChatBoxData = (chatboxData, ws) => {
    // console.log(chatboxData.messages);

    const processedData = chatboxData.messages.map((msg) => {
        // initialize app with existing messages
        // console.log(msg);
        return { name: msg.sender.name, body: msg.body };
    });

    sendData(["init", processedData], ws);
    console.log("init sent");
};
const updateChatboxMsg = async (chatBox, msg) => {
    await ChatBoxModel.updateOne(
        { _id: chatBox._id },
        { $set: { messages: [...chatBox.messages, msg.id] } }
    );
    return;
};
const verifyVP = async ({ name, company, vp, challenge, ws, task }) => {
    await fetch(
        `http://${IOTAURL}/verify?` +
            new URLSearchParams({
                name,
                company,
                vp,
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
            if (!res) throw "VP error";
        })
        .catch((e) => {
            sendData([task, { state: false }], ws);
            console.error(`unCaught askVP error: `, e);
            throw e;
        });
};
const verifySignature = async ({ signature, publicKey, challenge }) => {
    console.log("*************Verify Signature*************");
    const verifier = crypto.createVerify("SHA256");
    const challengeHash = crypto.createHash("sha256").update(challenge).digest();
    verifier.update(challenge);
    verifier.end();
    console.log("signature:\n", signature, "\n\n");
    console.log("publicKey:\n", publicKey, "\n\n");
    console.log("challenge:\n", challenge, "\n\n");
    console.log("challengeHash:\n", challengeHash.toString("hex"), "\n\n");
    const publicKeyBuf = Buffer.from(publicKey, "base64").toString("ascii");
    const signatureBuf = Buffer.from(signature, "base64");
    console.log("change to buffer");
    console.log("publicKey:\n", publicKeyBuf, "\n\n");
    console.log("signatureBuf:\n", signatureBuf, "\n\n");
    const verified = verifier.verify(publicKeyBuf, signatureBuf);
    if (!verified) {
        console.log("*************Verification Fail*************");
        throw "Signature error";
    }
    console.log("*************Signature verified*************");
    return;
};
const handleRegister = async (payload, ws) => {
    const {
        vp,
        challenge,
        userName,
        password,
        pincode,
        signature,
        publicKey,
        company,
        vpChecked,
        signatureChecked,
    } = payload;
    console.log("handleRegister", company);
    if (!vp && !signature) throw "VP and Signature are both empty";
    if (vp && !vpChecked) {
        try {
            await verifyVP({ name: userName, company, vp, challenge, ws, task: "Register" });
        } catch (e) {
            throw `VP error: ${e}`;
        }
    }
    if (signature && !signatureChecked) {
        try {
            await verifySignature({ signature, publicKey, challenge });
        } catch (e) {
            throw `Signature error: ${e}`;
        }
    }

    console.log("handleRegister success");
    return;
};
const handleLogin = async (payload, ws) => {
    const {
        vp,
        challenge,
        userName,
        password,
        signature,
        publicKey,
        company,
        vpChecked,
        signatureChecked,
    } = payload;
    if (!vp && !signature) throw "VP and Signature are both empty";
    if (vp && !vpChecked) {
        try {
            await verifyVP({ name: userName, company, vp, challenge, ws, task: "Login" });
        } catch (e) {
            throw `VP error: ${e}`;
        }
    }
    if (signature && !signatureChecked) {
        try {
            await verifySignature({ signature, publicKey, challenge });
        } catch (e) {
            throw `Signature error: ${e}`;
        }
    }
    console.log("handleLogin success");
    return;
};
export default {
    initData: (ws) => {
        console.log("init Data");
        initData(ws);
    },
    onChatBoxMessage: (wss, ws) => {
        ws.on("message", async (byteString) => {
            const data = byteString;
            const [task, payload] = JSON.parse(data);
            console.log(task, payload);
            if (task === "init") return;

            // deal with save register data to backend
            if (task === "Register") {
                const { userName, password, company, pincode, signature, publicKey } = payload;
                let user = await IdentityModel.findOne({ userName: userName, company: company });
                if (user)
                    sendData(["Register", { state: "exist", msg: "You are Registered!" }], ws);
                const verificationID = Math.random().toString(36).substring(2, 15);
                const challenge = Math.random().toString(36).substring(2, 15);
                needVerification[verificationID] = {
                    identity: { userName, password, company, pincode, signature, publicKey },
                    ws,
                    challenge,
                    task: user ? "reRegister" : "Register",
                    vpChecked: false,
                    signatureChecked: false,
                };
                sendData(["VP", { ID: verificationID, challenge, userName, company }], ws);
                return;
            } else if (task === "Login") {
                console.log("login");
                const { userName, password, company } = payload;
                let user = await IdentityModel.findOne({ userName: userName, company: company });
                console.log(user);
                if (!user) {
                    sendData([task, "User doesn't exist."], ws);
                    sendStatus({ type: "error", msg: "User doesn't exist." }, ws);
                    return;
                }
                console.log("password", user.password, password);
                if (user.password !== password) {
                    sendData([task, "Password error."], ws);
                    sendStatus({ type: "error", msg: "Password error." }, ws);
                    return;
                }
                const verificationID = Math.random().toString(36).substring(2, 15);
                const challenge = Math.random().toString(36).substring(2, 15);
                needVerification[verificationID] = {
                    identity: {
                        userName,
                        password,
                        company: user.company,
                        publicKey: user.publicKey,
                    },
                    ws,
                    challenge,
                    task: "Login",
                    vpChecked: false,
                    signatureChecked: false,
                };
                sendData(["VP", { ID: verificationID, challenge }], ws);
                return;
            } else if (task === "VP") {
                try {
                    const { ID, challenge, vp } = payload;
                    const {
                        identity,
                        challenge: _challenge,
                        ws,
                        task,
                        vpChecked,
                        signatureChecked,
                    } = needVerification[ID];
                    const { userName, company, password, pincode, publicKey } = identity;
                    console.log("VP ID:", ID);
                    console.log("challenge: ", challenge);
                    console.log("_challenge: ", _challenge);
                    console.log("company: ", identity);
                    if (challenge !== _challenge) throw "challenge error";
                    if (task === "Register") {
                        await handleRegister(
                            {
                                userName,
                                company,
                                password,
                                pincode,
                                publicKey,
                                vp,
                                challenge,
                                vpChecked,
                                signatureChecked,
                            },
                            ws
                        );
                        needVerification[ID].vpChecked = true;
                        if (needVerification[ID].signatureChecked) {
                            sendData(["Register", { state: "success" }], ws);
                            const _identity = new IdentityModel({
                                userName,
                                password,
                                pincode,
                                publicKey,
                                company,
                            });
                            await _identity.save();
                        }
                    } else if (task === "Login") {
                        await handleLogin(
                            {
                                userName,
                                company,
                                password,
                                pincode,
                                publicKey,
                                vp,
                                challenge,
                                vpChecked,
                                signatureChecked,
                            },
                            ws
                        );
                        needVerification[ID].vpChecked = true;
                        if (needVerification[ID].signatureChecked) {
                            sendData(["Login", { state: "success" }], ws);
                        }
                    } else if (task === "reRegister") {
                        await handleLogin(
                            {
                                userName,
                                company,
                                password,
                                pincode,
                                publicKey,
                                vp,
                                challenge,
                                vpChecked,
                                signatureChecked,
                            },
                            ws
                        );
                        needVerification[ID].vpChecked = true;
                        if (needVerification[ID].signatureChecked) {
                            sendData(["Login", { state: "success" }], ws);
                            sendStatus("Password changed.", ws);
                            let user = await IdentityModel.findOne({
                                userName: userName,
                                company: company,
                            });
                            user.password = password;
                            await user.save();
                        }
                    }
                    return;
                } catch (e) {
                    sendStatus({ type: "error", msg: "VP error" }, ws);
                    console.error("VP error:", e);
                    return;
                }
            } else if (task === "Signature") {
                try {
                    const { ID, challenge, signature, publicKey } = payload;
                    const {
                        identity,
                        challenge: _challenge,
                        ws,
                        task,
                        vpChecked,
                        signatureChecked,
                    } = needVerification[ID];
                    // console.log(needVerification[ID]);
                    const { userName, company, password, pincode } = identity;
                    console.log("Signature ID:", ID);
                    console.log("challenge: ", challenge);
                    console.log("_challenge: ", _challenge);
                    console.log("company: ", identity);

                    if (challenge !== _challenge) throw "challenge error";
                    if (task === "Register") {
                        await handleRegister(
                            {
                                userName,
                                company,
                                password,
                                pincode,
                                signature,
                                publicKey,
                                challenge,
                                vpChecked,
                                signatureChecked,
                            },
                            ws
                        );
                        needVerification[ID].signatureChecked = true;
                        if (needVerification[ID].vpChecked) {
                            sendData(["Register", { state: "success" }], ws);
                            const _identity = new IdentityModel({
                                userName,
                                password,
                                pincode,
                                publicKey,
                                company,
                            });
                            await _identity.save();
                        }
                    } else if (task === "Login") {
                        try {
                            await handleLogin(
                                {
                                    userName,
                                    company,
                                    password,
                                    pincode,
                                    signature,
                                    publicKey,
                                    challenge,
                                    vpChecked,
                                    signatureChecked,
                                },
                                ws
                            );
                        } catch (e) {
                            // console.log(e);
                        }
                        needVerification[ID].signatureChecked = true;
                        if (needVerification[ID].vpChecked) {
                            sendData(["Login", { state: "success" }], ws);
                        }
                    } else if (task === "reRegister") {
                        await handleLogin(
                            {
                                userName,
                                company,
                                password,
                                pincode,
                                signature,
                                publicKey,
                                challenge,
                                vpChecked,
                                signatureChecked,
                            },
                            ws
                        );
                        needVerification[ID].signatureChecked = true;
                        if (needVerification[ID].vpChecked) {
                            sendData(["Login", { state: "success" }], ws);
                            sendStatus("Password changed.", ws);
                            let user = await IdentityModel.findOne({
                                userName: userName,
                                company: company,
                            });
                            user.password = password;
                            await user.save();
                        }
                    }
                    return;
                } catch (e) {
                    sendStatus({ type: "error", msg: "Signature error" }, ws);
                    console.error("Signature error:", e);
                    return;
                }
            }

            // for chatbox //
            const { name, to } = payload;
            // console.log(name, to);
            const participants = await Promise.all(
                [name, to].map(async (user) => await validateUser(user))
            );
            // console.log("pass");
            const chatBoxName = makeName(name, to);
            // 如果不曾有過 chatBoxName 的對話，將 chatBoxes[chatBoxName] 設定為 empty Set
            if (!chatBoxes[chatBoxName]) chatBoxes[chatBoxName] = new Set(); // make new record for chatbox
            chatBoxes[chatBoxName].add(ws);

            // user(ws) was in another chatbox
            if (ws.box !== chatBoxName) {
                if (ws.box !== "" && chatBoxes[ws.box]) {
                    try {
                        chatBoxes[ws.box].delete(ws);
                    } catch (e) {
                        console.log(e);
                    }
                }
                ws.box = chatBoxName;
            }
            switch (task) {
                case "CHAT":
                    console.log(name, to);
                    const chatboxData = await validateChatBox(makeName(name, to), participants);
                    await Promise.all(
                        participants.map(
                            async (user) => await updateUserChatbox(user, chatboxData._id)
                        )
                    );
                    initChatBoxData(chatboxData, ws);
                    console.log("chatboxdata", chatboxData);
                    break;
                case "MESSAGE":
                    const { body } = payload;
                    let box = await ChatBoxModel.findOne({
                        name: makeName(name, to),
                    });
                    const new_message = new MessageModel({
                        chatBox: box._id,
                        sender: participants[0],
                        body: body,
                    });
                    try {
                        await new_message.save();
                    } catch (e) {
                        sendStatus(
                            {
                                type: "error",
                                msg: "Message DB save error: " + e,
                            },
                            ws
                        );
                        break;
                    }
                    await updateChatboxMsg(box, new_message);

                    // console.log(chatBoxes[chatBoxName]);
                    chatBoxes[chatBoxName].forEach((ws) => {
                        sendData(["output", [{ name: name, to: to, body: body }]], ws);
                    });
                    break;
                case "CLEAR":
                    let clear_box = await ChatBoxModel.findOne({
                        name: makeName(name, to),
                    });
                    await ChatBoxModel.updateOne(
                        { _id: clear_box._id },
                        { $set: { messages: [] } }
                    );
                    MessageModel.deleteMany({ chatBox: clear_box._id }, () => {
                        chatBoxes[chatBoxName].forEach((ws) => {
                            sendData(["cleared"], ws);
                            sendStatus(
                                {
                                    type: "success",
                                    msg: "This chat room db was cleared.",
                                },
                                ws
                            );
                        });
                    });
                    break;
            }
        });
        ws.once("close", () => {
            try {
                chatBoxes[ws.box].delete(ws);
            } catch (e) {
                // console.log(e);
            }
        });
    },
};
