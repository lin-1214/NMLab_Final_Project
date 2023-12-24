import "./styles/Title.scss";
import { FC } from "react";

interface TitleProps {
  name?: string;
  children?: React.ReactNode;
}

const Title: FC<TitleProps> = ({ name, children }) => {
  return (
    <div className="Title">
      <h1>Stellar Secrete Conclave✨</h1>
      {children}
    </div>
  );
};

export default Title;
