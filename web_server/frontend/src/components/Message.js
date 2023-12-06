import styled from "styled-components";
import { Tag } from "antd";
const StyledMessage = styled.div`
    display: flex;
    align-items: center;
    flex-direction: ${({ isMe }) => (isMe ? "row-reverse" : "row")};

    margin: 8px 10px;
    & p {
        max-width: 70%;
        word-wrap: break-word;
    }
    & p:first-child {
        margin: 0 5px;
    }
    & p:last-child {
        padding: 2px 5px;
        border-radius: 5px;
        background: #eee;
        color: gray;
        margin: auto 0;
        padding-right: 0.5em;
        padding-left: 0.5em;
    }
`;
const Message = ({ name, body, user }) => {
    // const hi = name === user ? console.log(`${user},${name}`) : null;
    return (
        <StyledMessage isMe={name === user}>
            <p>
                <Tag
                    color="blue"
                    style={name === user ? { display: "none" } : {}}
                >
                    {name}
                </Tag>{" "}
                {body}
            </p>
        </StyledMessage>
    );
};
export default Message;
