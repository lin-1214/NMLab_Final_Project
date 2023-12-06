import styled from "styled-components";
const TitleWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    & h1 {
        margin: 0;
        margin-right: 20px;
        font-size: 3em;
    }
`;

const Title = (props) => {
    const { children, name } = props;
    return (
        <TitleWrapper>
            <h1>
                {name ? ` ${name}'s` : "My"}
                {" Chat Room"}
            </h1>
            {children}
        </TitleWrapper>
    );
};

export default Title;
