import styled from "@emotion/styled";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    height: min(100vh, 1400px);
    width: min(90dvmax, 700px);
    margin: auto;
    // overflow: scroll;
`;
export const ChatBoxesWrapper = styled(Tabs)`
    width: 100%;
    height: 70vh;
    background: #eeeeee52;
    border-radius: 10px;
    margin: 20px;
    padding: 20px;
    // overflow: scroll;
`;
export const ChatBox = styled.div`
    width: 100%;
    height: min(68vh, 650px);
    background: #eeeeee52;
    padding: 10px;
    overflow-y: auto;
`;
export const FootRef = styled.div`
    height: 40px;
`;
