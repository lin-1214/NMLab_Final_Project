import { FC, useEffect, useRef, useState } from "react";
import { Button, TableContainer, Tabs, Tab, Box, Paper } from "@mui/material";
import { ChatBoxStates } from "../types";
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
}

const TabPanel: FC<TabPanelProps> = (props) => {
    const { children, value, index, ...other } = props;
    console.log("TabPanel", children);
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            style={{ width: "100vw", height: "90%" }}
            {...other}
        >
            {value === index && (
                <Box
                    sx={{
                        width: "100%",
                        height: "100%",
                        paddingRight: "10px",
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
    const [value, setValue] = useState(0);
    const keyID_Pairs = useRef(new Map<number, string>());
    const IDKey_Pairs = useRef(new Map<string, number>());
    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
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
            <Button
                variant="contained"
                onClick={() => {
                    if (onEdit) onEdit("ken", "add");
                }}
            >
                add
            </Button>
            <Tabs
                value={value}
                scrollButtons="auto"
                variant="scrollable"
                indicatorColor="secondary"
                textColor="secondary"
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
                            label={item.label}
                            value={index}
                            {...propsGenerater(index)}
                        />
                    );
                })}
            </Tabs>
            {items.map((item, index) => {
                return (
                    <TabPanel key={item.key} value={value} index={index}>
                        <TableContainer
                            component={Paper}
                            sx={{ overflowX: "hidden", overflowY: "auto" }}
                        >
                            {item.children}
                        </TableContainer>
                    </TabPanel>
                );
            })}
        </>
    );
};
export default ChatRoomTabs;
