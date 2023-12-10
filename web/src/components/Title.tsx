import "./styles/Title.scss";
import { FC } from "react";

interface TitleProps {
    name?: string;
    children?: React.ReactNode;
}

const Title: FC<TitleProps> = ({ children, name }) => {
    return (
        <div className="Title">
            <h1>
                {name ? ` ${name}'s` : "My"}
                {" Chat Room"}
            </h1>
            {children}
        </div>
    );
};

export default Title;
