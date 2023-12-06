import Message from "./models/message";
import { UserModel, MessageModel, ChatBoxModel } from "./models/chatbox";
// 在 global scope 將 chatBoxes 宣告成空物件
const chatBoxes = {};

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

// hw7
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
export default {
    initData: (ws) => {
        console.log("init Data");
        initData(ws);
    },
    onMessage: (ws) =>
        ws.on("message", async (byteString) => {
            const data = byteString;
            const [task, payload] = JSON.parse(data);
            console.log(task);
            switch (task) {
                case "input": {
                    const { name, body } = payload;
                    // Save payload to DB
                    const message = new Message({ name, body });
                    try {
                        await message.save();
                    } catch (e) {
                        sendStatus(
                            {
                                type: "error",
                                msg: "Message DB save error: " + e,
                            },
                            ws
                        );
                        break;
                        // throw new Error("Message DB save error: " + e);
                    }
                    // Respond to client
                    sendData(["output", [payload]], ws);
                    sendStatus(
                        {
                            type: "success",
                            msg: "Message sent.",
                        },
                        ws
                    );
                    break;
                }
                case "init": {
                    initData(ws);
                    break;
                }
                case "CHAT":
                    const { name, to } = payload;
                    console.log(name, to);
                    const participants = await Promise.all(
                        [name, to].map(async (user) => await validateUser(user))
                    );
                    const chatboxData = await validateChatBox(
                        makeName(name, to),
                        participants
                    );
                    await Promise.all(
                        participants.map(
                            async (user) =>
                                await updateUserChatbox(user, chatboxData._id)
                        )
                    );
                    initChatBoxData(chatboxData);
                    // console.log("chatboxdata", someData);
                    break;
                case "clear": {
                    Message.deleteMany({}, () => {
                        sendData(["cleared"], ws);
                        sendStatus(
                            { type: "success", msg: "Message cache cleared." },
                            ws
                        );
                    });
                    break;
                }
                default:
                    break;
            }
        }),
    onChatBoxMessage: (wss, ws) => {
        ws.on("message", async (byteString) => {
            const data = byteString;
            const [task, payload] = JSON.parse(data);
            console.log(task, payload);
            if (task === "init") return;
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
                if (ws.box !== "" && chatBoxes[ws.box])
                    chatBoxes[ws.box].delete(ws);
                ws.box = chatBoxName;
            }
            switch (task) {
                case "CHAT":
                    console.log(name, to);
                    const chatboxData = await validateChatBox(
                        makeName(name, to),
                        participants
                    );
                    await Promise.all(
                        participants.map(
                            async (user) =>
                                await updateUserChatbox(user, chatboxData._id)
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
                        sendData(["output", [{ name: name, body: body }]], ws);
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
            chatBoxes[ws.box].delete(ws);
        });
    },
};
