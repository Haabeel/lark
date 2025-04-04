import React from "react";
import styled from "styled-components";

const Loader = () => {
  return (
    <TextWrapper>
      <div className="loader">
        <span>LARK</span>
        <span>LARK</span>
      </div>
    </TextWrapper>
  );
};

const TextWrapper = styled.div`
  .loader {
    position: relative;
  }

  .loader span {
    position: absolute;
    color: #fff;
    transform: translate(-50%, -50%);
    font-size: 64px;
    letter-spacing: 5px;
  }

  .loader span:nth-child(1) {
    color: transparent;
    -webkit-text-stroke: 1px #48225f;
  }

  .loader span:nth-child(2) {
    color: #48225f;
    -webkit-text-stroke: 1px #48225f;
    animation: uiverse723 3s ease-in-out infinite;
  }

  @keyframes uiverse723 {
    0%,
    100% {
      clip-path: polygon(
        0% 45%,
        15% 44%,
        32% 50%,
        54% 60%,
        70% 61%,
        84% 59%,
        100% 52%,
        100% 100%,
        0% 100%
      );
    }

    50% {
      clip-path: polygon(
        0% 60%,
        16% 65%,
        34% 66%,
        51% 62%,
        67% 50%,
        84% 45%,
        100% 46%,
        100% 100%,
        0% 100%
      );
    }
  }
`;

export default Loader;
