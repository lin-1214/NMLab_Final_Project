import { FC, useEffect, useRef, useState } from "react";
import { Button, TableContainer, Tabs, Tab, Box, Paper } from "@mui/material";
import { ChatBoxStates } from "../types";
import { ChatBox } from "../containers/styles/ChatRoom.styled";
interface TabPanelProps {
    children?: React.ReactNode;
    dir?: string;
    index: number;
    value: number;
}
interface ChatRoomTabsProps {
    children?: React.ReactNode;
    activeKey: string;
    items: ChatBoxStates[];
    onChange: (key: string) => void;
    onEdit?: (targetKey: string, action: string) => void;
    setShowXmas?: (showXmas: boolean) => void;
}

const TabPanel: FC<TabPanelProps> = (props) => {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            style={{ width: "100%" }}
            {...other}
        >
            {value === index && (
                <Box
                    sx={{
                        width: "100%",
                        height: "100%",
                        overflowX: "hidden",
                        borderRadius: "5px",
                    }}
                >
                    {children}
                </Box>
            )}
        </div>
    );
};

function propsGenerater(index: number) {
    return {
        id: `chatroom-tab-${index}`,
        "aria-controls": `chatroom-tabpanel-${index}`,
    };
}
const ChatRoomTabs: FC<ChatRoomTabsProps> = (props) => {
    const { activeKey, items, onChange, onEdit } = props;
    const [value, setValue] = useState<number | false>(false);
    const keyID_Pairs = useRef(new Map<number, string>());
    const IDKey_Pairs = useRef(new Map<string, number>());
    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        if (newValue === items.length + 1) {
            console.log("add");
            if (onEdit) onEdit("", "add");
            return;
        }
        setValue(newValue);
        const __key = keyID_Pairs.current.get(newValue);
        if (__key) onChange(__key);
    };
    useEffect(() => {
        const currentID = IDKey_Pairs.current.get(activeKey);
        if (currentID) setValue(currentID);
    }, [activeKey]);
    return (
        <>
            <Tabs
                value={value}
                scrollButtons="auto"
                variant="scrollable"
                indicatorColor="primary"
                textColor="primary"
                onChange={handleChange}
                aria-label="basic tabs example"
            >
                {items.map((item, index) => {
                    // if (item.key === activeKey) setValue(index);
                    // this is stupid and bad performance but it should works
                    keyID_Pairs.current.set(index, item.key);
                    IDKey_Pairs.current.set(item.key, index);
                    return (
                        <Tab
                            key={item.key}
                            label={`✓${item.label}`}
                            value={index}
                            {...propsGenerater(index)}
                        />
                    );
                })}
                <Tab
                    key={"add"}
                    label={"+"}
                    value={items.length + 1}
                    {...propsGenerater(items.length)}
                />
            </Tabs>
            {items.length !== 0 ? (
                items.map((item, index) => {
                    return (
                        <TabPanel key={item.key} value={value || 0} index={index}>
                            <TableContainer
                                component={Paper}
                                sx={{ overflowX: "hidden", padding: "1vw" }}
                                // sx={{ overflowX: "hidden", overflowY: "scroll", padding: "1vw" }}
                            >
                                {item.children}
                            </TableContainer>
                        </TabPanel>
                    );
                })
            ) : (
                <TabPanel key={"add"} value={value || 0} index={items.length}>
                    <TableContainer
                        component={Paper}
                        sx={{
                            overflowX: "hidden",
                            padding: "1vw",
                        }}
                        // sx={{
                        //     overflowX: "hidden",
                        //     overflowY: "scroll",
                        //     padding: "1vw",
                        // }}
                    >
                        <ChatBox />
                    </TableContainer>
                </TabPanel>
            )}
        </>
    );
};
export default ChatRoomTabs;
