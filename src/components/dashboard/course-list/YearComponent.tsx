import React, { useState, useEffect } from "react";
import Semester from "./Semester";
import { UserCourse, Year } from "../../../resources/commonTypes";
import { ReactComponent as MoreSvg } from "../../../resources/svg/More.svg";
import { useSelector, useDispatch } from "react-redux";
import {
  selectPlan,
  updateSelectedPlan,
} from "../../../slices/currentPlanSlice";
import { ReactComponent as RemoveSvg } from "../../../resources/svg/Remove.svg";
import { toast } from "react-toastify";
import { api } from "../../../resources/assets";
import {
  updateDeleteYearStatus,
  updateYearToDelete,
} from "../../../slices/userSlice";

type yearProps = {
  id: number;
  customStyle: string;
  year: Year;
  courses: UserCourse[];
};

export const newYearTemplate: Year = {
  _id: "New Year",
  name: "New Year",
  year: -1,
  courses: ["New Year"],
  plan_id: "",
  user_id: "New Year",
};

/**
 * A component displaying all the courses in a specific semester.
 * TODO: Add popups confirmind delete!
 *
 * @param id - id of year
 * @param customStyle - style object for year
 * @param year - the year designator
 * @param courses - courses that belong to this year
 */
function YearComponent({ id, customStyle, year, courses }: yearProps) {
  // Component state setup.
  const [fallCourses, setFallCourses] = useState<UserCourse[]>([]);
  const [springCourses, setSpringCourses] = useState<UserCourse[]>([]);
  const [winterCourses, setWinterCourses] = useState<UserCourse[]>([]);
  const [summerCourses, setSummerCourses] = useState<UserCourse[]>([]);
  const [display, setDisplay] = useState<boolean>(true);
  const [yearName, setYearName] = useState<string>(year.name);
  // Determines whether we're editing the name.
  const [editName, setEditName] = useState<boolean>(false);

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

  // Displays dropdown showing semester categories
  const displaySemesters = () => {
    setDisplay(!display);
  };

  // Updates temporary year name and notifies useffect on state change to update db plan name with debounce.
  const handleYearNameChange = (event: any) => {
    setYearName(event.target.value);
    setEditName(true);
  };

  // Only edits name if editName is true. If true, calls debounce update function
  useEffect(() => {
    if (editName) {
      const update = setTimeout(updateName, 1000);
      return () => clearTimeout(update);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearName]);

  // update the name of the year
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

        toast.success("Year name changed to " + yearName + "!");
        setEditName(false);
      })
      .catch((err) => console.log(err));
  };

  const activateDeleteYearPopup = () => {
    dispatch(updateYearToDelete(year));
    dispatch(updateDeleteYearStatus(true));
  };

  return (
    <div
      id={id.toString()}
      className={`${customStyle} max-w-yearheading w-yearheading min-w-yearMin bg-white rounded p-2 mb-4 mx-auto transform hover:scale-101 transition duration-200 ease-in`}
    >
      <div className="flex flex-col mt-1 h-yearheading font-medium">
        <div className="flex flex-row justify-between px-0.5 w-full bg-white">
          <input
            value={yearName}
            className="flex-shrink mt-auto w-full text-lg font-semibold border-b hover:border-gray-400 border-transparent focus:outline-none select-none"
            onChange={handleYearNameChange}
          />
          <RemoveSvg
            className="w-6 stroke-2 cursor-pointer select-none transform hover:scale-110 transition duration-200 ease-in"
            onClick={activateDeleteYearPopup}
          />
          <MoreSvg
            className="w-6 stroke-2 cursor-pointer"
            onClick={displaySemesters}
          />
        </div>
        <div className="w-full h-px bg-gradient-to-r from-blue-500 to-green-400"></div>
      </div>
      {display ? (
        <div className="flex flex-col items-center">
          <Semester
            customStyle=""
            semesterName="Fall"
            semesterYear={year}
            courses={fallCourses}
          />
          <Semester
            customStyle=""
            semesterName="Spring"
            semesterYear={year}
            courses={springCourses}
          />
          <Semester
            customStyle=""
            semesterName="Intersession"
            semesterYear={year}
            courses={winterCourses}
          />
          <Semester
            customStyle=""
            semesterName="Summer"
            semesterYear={year}
            courses={summerCourses}
          />
        </div>
      ) : null}
    </div>
  );
}

export default YearComponent;
