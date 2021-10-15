import React, { useState, useEffect } from "react";
import Semester from "./Semester";
import { UserCourse, Year } from "../../../resources/commonTypes";
import { ReactComponent as MoreSvg } from "../../../resources/svg/More.svg";
import { useSelector, useDispatch } from "react-redux";
import {
  selectPlan,
  updateSelectedPlan,
} from "../../../slices/currentPlanSlice";
import { api } from "../../../resources/assets";
import {
  updateYearToDelete,
  updateDeleteYearStatus,
} from "../../../slices/popupSlice";

type yearProps = {
  id: number;
  customStyle: string;
  year: Year;
  courses: UserCourse[];
  setDraggable: Function;
};

export const newYearTemplate: Year = {
  _id: "New Year",
  name: "New Year",
  courses: ["New Year"],
  plan_id: "",
  user_id: "New Year",
};

type SemSelected = {
  fall: boolean;
  spring: boolean;
  intersession: boolean;
  summer: boolean;
};

/**
 * A component displaying all the courses in a specific semester.
 * TODO: Modularize!!!
 *
 * @prop id - id of year
 * @prop customStyle - style object for year
 * @prop year - the year designator
 * @prop courses - courses that belong to this year
 * @prop setDraggable - avtivates/deactivates draggability of year component
 */
function YearComponent({
  id,
  customStyle,
  year,
  courses,
  setDraggable,
}: yearProps) {
  // Component state setup.
  const [fallCourses, setFallCourses] = useState<UserCourse[]>([]);
  const [springCourses, setSpringCourses] = useState<UserCourse[]>([]);
  const [winterCourses, setWinterCourses] = useState<UserCourse[]>([]);
  const [summerCourses, setSummerCourses] = useState<UserCourse[]>([]);
  const [display, setDisplay] = useState<boolean>(false);
  const [hide, setHide] = useState<boolean>(false);
  const [yearName, setYearName] = useState<string>(year.name);
  const [semSelect, setSemSelect] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<boolean>(false);
  const [edittingName, setEdittingName] = useState<boolean>(false);
  const [toShow, setToShow] = useState<SemSelected>({
    fall: true,
    spring: true,
    summer: true,
    intersession: false,
  });

  // Setting up redux
  const currentPlan = useSelector(selectPlan);
  const dispatch = useDispatch();

  // Updates and parses all courses into semesters whenever the current plan or courses array changes.
  useEffect(() => {
    // For each of the user's courses for this year, put them in their respective semesters.
    const parsedFallCourses: UserCourse[] = [];
    const parsedSpringCourses: UserCourse[] = [];
    const parsedIntersessionCourses: UserCourse[] = [];
    const parsedSummerCourses: UserCourse[] = [];
    courses.forEach((course) => {
      if (course.term.toLowerCase() === "fall") {
        parsedFallCourses.push(course);
      } else if (course.term.toLowerCase() === "spring") {
        parsedSpringCourses.push(course);
      } else if (course.term.toLowerCase() === "summer") {
        parsedSummerCourses.push(course);
      } else if (course.term.toLowerCase() === "intersession") {
        parsedIntersessionCourses.push(course);
      }
    });
    setFallCourses(parsedFallCourses);
    setSpringCourses(parsedSpringCourses);
    setWinterCourses(parsedIntersessionCourses);
    setSummerCourses(parsedSummerCourses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, currentPlan, currentPlan.name]);

  // Focuses on year name after clicking edit name option.
  useEffect(() => {
    if (edittingName) {
      document.getElementById(year._id + "input")?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edittingName]);

  // Only edits name if editName is true. If true, calls debounce update function
  useEffect(() => {
    if (editedName) {
      const update = setTimeout(updateName, 1000);
      return () => clearTimeout(update);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearName]);

  /**
   * Update the name of the year
   */
  const updateName = () => {
    const body = {
      year_id: year._id,
      name: yearName,
    };
    fetch(api + "/years/update", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then(() => {
        const newUpdatedYear = { ...year, name: yearName };
        const newYearArray = [...currentPlan.years].map((yr) =>
          yr._id === year._id ? newUpdatedYear : yr
        );
        const newUpdatedPlan = { ...currentPlan, years: newYearArray };
        dispatch(updateSelectedPlan(newUpdatedPlan));
        setEditedName(false);
      })
      .catch((err) => console.log(err));
  };

  /**
   * Updates temporary year name and notifies useffect on state change to update db plan name with debounce.
   * @param event - produced from changes to dropdown
   */
  const handleYearNameChange = (event: any) => {
    setYearName(event.target.value);
    setEditedName(true);
  };

  /**
   * Activates delete year popup.
   */
  const activateDeleteYearPopup = () => {
    dispatch(updateYearToDelete(year));
    dispatch(updateDeleteYearStatus(true));
  };

  const modifyFall = () => {
    setToShow({ ...toShow, fall: !toShow.fall });
  };

  const modifySpring = () => {
    setToShow({ ...toShow, spring: !toShow.spring });
  };

  const modifySummer = () => {
    setToShow({ ...toShow, summer: !toShow.summer });
  };

  const modifyIntersession = () => {
    setToShow({ ...toShow, intersession: !toShow.intersession });
  };

  return (
    <div
      id={id.toString()}
      className={
        customStyle + "cursor-move p-2 rounded mb-4 bg-blue-400 rounded"
      }
      onMouseLeave={() => {
        setSemSelect(false);
        setDraggable(true);
        setDisplay(false);
      }}
      onMouseEnter={() => {
        setDraggable(false);
      }}
    >
      <div className="flex flex-col mt-1 w-full min-w-yearMin h-yearheading font-medium">
        <div className="flex flex-row w-full text-white drop-shadow-lg">
          <div className="mr-1 text-xl font-thin">✥</div>
          {edittingName ? (
            <input
              id={year._id + "input"}
              value={yearName}
              className="flex-shrink mt-auto w-full text-lg font-semibold bg-transparent border-b focus:border-gray-400 border-transparent focus:outline-none cursor-move select-none"
              onChange={handleYearNameChange}
              onBlur={() => {
                setEdittingName(false);
              }}
            />
          ) : (
            <div className="flex-shrink mt-auto w-full text-lg font-semibold bg-transparent border-b focus:border-gray-400 border-transparent focus:outline-none cursor-move select-none">
              {yearName}
            </div>
          )}
          <div className="relative">
            <MoreSvg
              onClick={() => {
                setDisplay(true);
              }}
              className="mt-0.5 w-6 stroke-2 cursor-pointer"
            />
            {display ? (
              <div className="absolute z-50 right-1 flex flex-col w-40 text-black bg-gray-100 rounded shadow">
                <button
                  onClick={() => {
                    setEdittingName(true);
                    setDisplay(false);
                  }}
                  className="hover:bg-gray-300 focus:outline-none"
                >
                  Rename
                </button>
                <button
                  onClick={activateDeleteYearPopup}
                  className="hover:bg-gray-300 border-t border-gray-300 focus:outline-none"
                >
                  Remove
                </button>
                <button
                  className="hover:bg-gray-300 border-t border-gray-300 focus:outline-none"
                  onClick={() => {
                    setSemSelect(!semSelect);
                  }}
                >
                  Select Terms
                </button>
                {semSelect ? (
                  <>
                    <div className="z-50 flex flex-col">
                      <label>
                        <input
                          type="checkbox"
                          name="Fall"
                          className="ml-6 mr-2"
                          onChange={modifyFall}
                          checked={toShow.fall}
                        />
                        Fall
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          name="Spring"
                          className="ml-6 mr-2"
                          onChange={modifySpring}
                          checked={toShow.spring}
                        />
                        Spring
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          name="Summer"
                          className="ml-6 mr-2"
                          onChange={modifySummer}
                          checked={toShow.summer}
                        />
                        Summer
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          name="Intersession"
                          className="ml-6 mr-2"
                          onChange={modifyIntersession}
                          checked={toShow.intersession}
                        />
                        Intersession
                      </label>
                    </div>
                  </>
                ) : null}
                <button
                  onClick={() => {
                    setHide(!hide);
                  }}
                  className="hover:bg-gray-300 border-t border-gray-300 focus:outline-none"
                >
                  {!hide ? "Hide Courses" : "Show Courses"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div
        className="p-2 bg-white rounded shadow cursor-default"
        onMouseLeave={() => setDraggable(false)}
        onMouseEnter={() => setDraggable(true)}
      >
        {!hide ? (
          <div className="flex flex-col items-center">
            {toShow.fall ? (
              <Semester
                customStyle=""
                semesterName="Fall"
                semesterYear={year}
                courses={fallCourses}
              />
            ) : null}{" "}
            {toShow.intersession ? (
              <Semester
                customStyle=""
                semesterName="Intersession"
                semesterYear={year}
                courses={winterCourses}
              />
            ) : null}{" "}
            {toShow.spring ? (
              <Semester
                customStyle=""
                semesterName="Spring"
                semesterYear={year}
                courses={springCourses}
              />
            ) : null}{" "}
            {toShow.summer ? (
              <Semester
                customStyle=""
                semesterName="Summer"
                semesterYear={year}
                courses={summerCourses}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default YearComponent;
