import { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { api } from "../../../resources/assets";
import {
  selectPlan,
  updateSelectedPlan,
} from "../../../slices/currentPlanSlice";
import { updateDeletePlanStatus } from "../../../slices/popupSlice";
import { selectPlanList, updatePlanList } from "../../../slices/userSlice";
import PlanChoose from "./PlanChoose";
import { ReactComponent as RemoveSvg } from "../../../resources/svg/Remove.svg";
import ShareLinksPopup from "./ShareLinksPopup";

/**
 * @description ActionBar component
 */
const ActionBar: FC = () => {
  // Redux Setup
  const dispatch = useDispatch();
  const currentPlan = useSelector(selectPlan);
  const planList = useSelector(selectPlanList);

  // Holds temporary plan name.
  const [planName, setPlanName] = useState<string>(currentPlan.name);

  // Determines whether we're editing the name.
  const [editName, setEditName] = useState<boolean>(false);

  // shareable URL
  const [shareableURL, setShareableURL] = useState<string>("");

  // Only edits name if editName is true. If true, calls debounce update function
  useEffect(() => {
    if (editName) {
      const update = setTimeout(updateName, 1000);
      return () => clearTimeout(update);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planName]);

  // Updates current plan every time current plan changes
  useEffect((): void => {
    setPlanName(currentPlan.name);
  }, [currentPlan]);

  /**
   * Updates temporary plan name and notifies useffect on state change to update db plan name with debounce.
   * @param event
   */
  const handlePlanNameChange = (event: any): void => {
    setPlanName(event.target.value);
    setEditName(true);
  };

  const updateName = (): void => {
    const body = {
      plan_id: currentPlan._id,
      majors: currentPlan.majors,
      name: planName,
    };
    fetch(api + "/plans/update", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then(() => {
        const newUpdatedPlan = { ...currentPlan, name: planName };
        dispatch(updateSelectedPlan(newUpdatedPlan));
        let newPlanList = [...planList];
        for (let i = 0; i < planList.length; i++) {
          if (newPlanList[i]._id === currentPlan._id) {
            newPlanList[i] = { ...newUpdatedPlan };
          }
        }
        toast.success("Plan name changed to " + planName + "!");
        setEditName(false);
        dispatch(updatePlanList(newPlanList));
      })
      .catch((err) => console.log(err));
  };

  // Activates delete plan popup.
  const activateDeletePlan = (): void => {
    dispatch(updateDeletePlanStatus(true));
  };

  /**
   * Handles when button for shareable link is clicked.
   */
  const onShareClick = (): void => {
    if (shareableURL !== "") {
      setShareableURL("");
      return;
    }
    setShareableURL(
      (window.location.href.includes("localhost")
        ? "localhost:3000"
        : "https://ucredit.me") +
        "/share?_id=" +
        currentPlan._id
    );
  };
  return (
    <div className="flex flex-row px-2 py-1 bg-white rounded shadow drop-shadow-xl">
      <PlanChoose />
      <div className="flex flex-row items-end ml-2 my-auto h-10 border border-gray-300 rounded rounded shadow drop-shadow-xl">
        <input
          value={planName}
          className="ml-2 my-auto px-1 w-auto text-gray-800 text-2xl font-semibold outline-none"
          onChange={handlePlanNameChange}
          style={{ height: "2.4rem" }}
        />
      </div>
      <div className="flex ml-2 my-auto px-2 w-auto h-10 text-xl font-light border border-gray-300 rounded stroke-2 shadow">
        <div className="py-1">{currentPlan.majors}</div>
      </div>
      <button
        className="flex flex-row items-center ml-1 ml-2 my-auto px-2 h-10 hover:underline hover:bg-red-300 border border-gray-300 rounded shadow transition duration-200 ease-in"
        onClick={activateDeletePlan}
      >
        <RemoveSvg className="my-auto w-5 stroke-2 cursor-pointer select-none transform hover:scale-110 transition duration-200 ease-in" />{" "}
        <div className="ml-1">Delete</div>
      </button>
      <button
        className="flex flex-row items-center ml-1 ml-2 my-auto px-2 h-10 hover:underline hover:bg-green-300 border border-gray-300 rounded shadow transition duration-200 ease-in"
        onClick={onShareClick}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 transform hover:scale-110 transition duration-200 ease-in"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        <div className="ml-1">Share</div>
      </button>
      <div>
        {shareableURL === "" ? null : (
          <ShareLinksPopup link={shareableURL} setURL={onShareClick} />
        )}
      </div>
    </div>
  );
};

export default ActionBar;
