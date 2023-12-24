import "./styles/Title.scss";
import { FC } from "react";

interface TitleProps {
    name?: string;
    children?: React.ReactNode;
}

const Title: FC<TitleProps> = ({ name, children }) => {
    return (
        <div className="Title">
            <div>Stellar Secrete Conclave✨</div>
            {children}
        </div>
    );
};

export default Title;
