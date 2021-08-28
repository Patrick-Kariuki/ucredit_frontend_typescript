import React from "react";
import { ReactComponent as CloseSVG } from "../../resources/svg/Close.svg";

const FeedbackNotification = ({
  actionHandler,
  notifHandler,
}: {
  actionHandler: Function;
  notifHandler: Function;
}) => {
  return (
    <div className="fixed z-40 bottom-0 flex flex-row pl-16 py-2 w-full font-bold bg-green-400 select-none">
      <div className="flex flex-row flex-grow">
        We use your feedback to improve your planning experience! Please fill
        out{" "}
        <div
          className="ml-1 text-white cursor-pointer"
          onClick={() => actionHandler(true)}
        >
          this feedback form
        </div>
        !
      </div>
      <div className="mr-5 cursor-pointer" onClick={() => notifHandler(false)}>
        <CloseSVG />
      </div>
    </div>
  );
};

export default FeedbackNotification;
