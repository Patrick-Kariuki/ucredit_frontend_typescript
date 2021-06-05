import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Course,
  Distribution,
  Filter,
  FilterType,
  Plan,
  SemesterType,
  UserCourse,
  Year,
} from "../../../commonTypes";
import {
  selectInspectedCourse,
  clearSearch,
  popSearchStack,
  selectSemester,
  selectYear,
  selectPlaceholder,
  selectSearchStack,
  updatePlaceholder,
  updateSearchTime,
  updateSearchFilters,
  updateInspectedCourse,
} from "../../../slices/searchSlice";
import {
  selectUser,
  selectPlanList,
  updatePlanList,
} from "../../../slices/userSlice";
import Placeholder from "./Placeholder";
import PrereqDisplay from "../prereqs/PrereqDisplay";
import { ReactComponent as CloseSvg } from "../../../svg/Close.svg";
import ReactTooltip from "react-tooltip";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getColors } from "../../../assets";
import { testMajorCSNew } from "../../../testObjs";
import {
  selectDistributions,
  selectPlan,
  updateSelectedPlan,
} from "../../../slices/currentPlanSlice";

const api = "https://ucredit-api.herokuapp.com/api";

const termFilters: (SemesterType | "None")[] = [
  "None",
  "Fall",
  "Spring",
  "Intersession",
  "Summer",
];

/* 
  Displays course information once a user selects a course in the search list
*/
// TODO: Try to split this up into more, smaller components.
const CourseDisplay = () => {
  // Redux Setup
  const dispatch = useDispatch();
  const inspected = useSelector(selectInspectedCourse);
  const user = useSelector(selectUser);
  const semester = useSelector(selectSemester);
  const year = useSelector(selectYear);
  const currentPlan = useSelector(selectPlan);
  const planList = useSelector(selectPlanList);
  const distributions = useSelector(selectDistributions);
  const placeholder = useSelector(selectPlaceholder);
  const searchYear = useSelector(selectYear);
  const searchSemester = useSelector(selectSemester);
  const searchStack = useSelector(selectSearchStack);

  // component state setup
  const bioElRef = useRef<HTMLParagraphElement>(null);
  const [inspectedArea, setInspectedArea] = useState("None");
  const [showMore, setShowMore] = useState<number>(2);

  // Matches distribution filter with distribution.
  const getFilter = (distr: Distribution) => {
    let filter = {};
    testMajorCSNew.distributions.forEach((distribution) => {
      if (distribution.name === distr.name) {
        filter = distribution.filter;
      }
    });
    return filter;
  };

  // Checks if inspected course satisfies specific distribution
  const checkDistribution = (distr: Distribution): boolean => {
    const distribution: Distribution = { ...distr, filter: getFilter(distr) };
    const filter = distribution.filter;
    if (inspected !== "None") {
      if (filter.exception !== undefined) {
        if (checkFilters(filter.exception, inspected, false)) {
          return false;
        }
      }
      return checkFilters(filter, inspected, false);
    } else {
      return false;
    }
  };

  // Checks if the course satisfies the filters given to it.
  // Behavior differs based on whether you're checking for credit distributions or fine requirements.
  const checkFilters = (filter: Filter, course: Course, fine: boolean) => {
    if (filter.area !== undefined) {
      const areaRegex: RegExp = new RegExp(
        filter.area.substr(1, filter.area.length - 3)
      );
      const regexMatches = inspectedArea.match(areaRegex);
      if (regexMatches === null && fine) {
        return false;
      } else if (regexMatches !== null && !fine) {
        return true;
      }
    }

    if (filter.tags !== undefined) {
      let found: boolean = false;
      filter.tags.forEach((tag) => {
        if (course.tags.includes(tag)) {
          found = true;
        }
      });
      if (!found && fine) {
        return false;
      } else if (found && !fine) {
        return true;
      }
    }

    if (filter.wi !== undefined) {
      if (course.wi !== filter.wi && fine) {
        return false;
      } else if (!fine && course.wi === filter.wi) {
        return true;
      }
    }

    if (filter.department !== undefined) {
      const depRegex: RegExp = new RegExp(
        filter.department.substr(1, filter.department.length - 3)
      );
      const regexMatches = course.department.match(depRegex);
      if (regexMatches === null && fine) {
        return false;
      } else if (regexMatches !== null && !fine) {
        return true;
      }
    }

    if (filter.number !== undefined && typeof filter.number === "string") {
      const numRegex: RegExp = new RegExp(
        filter.number.substr(1, filter.number.length - 3)
      );
      const regexMatches = course.number.match(numRegex);
      if (regexMatches === null && fine) {
        return false;
      } else if (regexMatches !== null && !fine) {
        return true;
      }
    }

    // if (filter.title !== undefined) {
    //   if (!course.title.match(filter.title)) {
    //     return false;
    //   } else if (!fine) {
    //     return true;
    //   }
    // }

    if (!fine) {
      return false;
    } else {
      return true;
    }
  };

  // Adds course
  const addCourse = () => {
    // Adds course, updates user frontend distributions display, and clears search states.
    if (inspected !== "None" && distributions.length !== 0) {
      let toAdd: Distribution | null = null;
      dispatch(updatePlaceholder(false));
      let filteredDistribution: Distribution[] = [];

      distributions.forEach((distribution) => {
        if (distribution.name === "Total") {
          filteredDistribution.push(distribution);
        } else if (
          checkDistribution(distribution) &&
          toAdd === null &&
          distribution.planned < distribution.required
        ) {
          toAdd = distribution;
          filteredDistribution.push(toAdd);
        }
      });

      // Posts to add course route and then updates distribution.
      updateDistributions(filteredDistribution);

      toast.success(inspected.title + " added!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: 0,
      });

      // Clears search state.
      dispatch(clearSearch());
    }
  };

  // Gets current year name.
  const getYear = (): Year | null => {
    let out: Year | null = null;
    currentPlan.years.forEach((currPlanYear) => {
      if (currPlanYear.year === year) {
        out = currPlanYear;
      }
    });
    return out;
  };

  // Updates distribution bars upon successfully adding a course.
  const updateDistributions = (filteredDistribution: Distribution[]) => {
    let newUserCourse: UserCourse;
    if (inspected !== "None") {
      const addingYear: Year | null = getYear();

      const body = {
        user_id: user._id,
        year_id: addingYear !== null ? addingYear._id : "",
        plan_id: currentPlan._id,
        title: inspected.title,
        term: semester.toLowerCase(),
        year: addingYear !== null ? addingYear.name : "",
        credits: inspected.credits,
        distribution_ids: filteredDistribution.map((distr) => distr._id),
        number: inspected.number,
        area: inspectedArea,
        expireAt:
          user._id === "guestUser"
            ? Date.now() + 60 * 60 * 24 * 1000
            : undefined,
      };

      fetch(api + "/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }).then((retrieved) => {
        retrieved.json().then((data) => {
          if (data.errors === undefined) {
            newUserCourse = { ...data.data };
            const allYears: Year[] = [...currentPlan.years];
            const newYears: Year[] = [];
            allYears.forEach((y) => {
              if (y.year === year) {
                const yCourses = [...y.courses, newUserCourse._id];
                newYears.push({ ...y, courses: yCourses });
              } else {
                newYears.push(y);
              }
            });
            const newPlan: Plan = { ...currentPlan, years: newYears };

            dispatch(updateSelectedPlan(newPlan));
            const newPlanList = [...planList];
            for (let i = 0; i < planList.length; i++) {
              if (planList[i]._id === newPlan._id) {
                newPlanList[i] = newPlan;
              }
            }
            dispatch(updatePlanList(newPlanList));
          } else {
            console.log("Failed to add", data.errors);
          }
        });
      });
    }
  };

  // UseEffect runs when a new course is inspected.
  // It automatically updates the current area in the add course area selection to the first area in the course areas string.
  useEffect(() => {
    setShowMore(2);
    if (
      inspected !== "None" &&
      inspected.areas !== "None" &&
      inspected.areas !== undefined
    ) {
      const firstArea = inspected.areas.charAt(0);
      if (
        firstArea === "N" ||
        firstArea === "S" ||
        firstArea === "H" ||
        firstArea === "Q" ||
        firstArea === "E"
      ) {
        setInspectedArea(firstArea);
      }
    } else {
      setInspectedArea("None");
    }
  }, [inspected]);

  // Returns an array of select options for the distribution area users want to add the course to.
  const getInspectedAreas = () => {
    if (inspected !== "None" && inspected.areas !== "None") {
      const areaOptions = inspected.areas.split("").map((area) => (
        <option key={inspected.number + area} value={area}>
          {area}
        </option>
      ));
      areaOptions.push(<option value={"None"}>None</option>);
      return areaOptions;
    } else {
      return <option value={"None"}>None</option>;
    }
  };

  // Update searching for a certain term.
  const handleTermFilterChange = (event: any): void => {
    const params: { filter: FilterType; value: any } = {
      filter: "term",
      value: event.target.value,
    };
    dispatch(
      updateSearchTime({ searchSemester: event.target.value, searchYear: year })
    );
    dispatch(updateSearchFilters(params));
  };

  // Gets course restrictions
  const getRestrictions = () => {
    if (inspected !== "None") {
      const restrictions = inspected.restrictions.map(
        (restriction) => restriction.RestrictionName
      );
      if (restrictions.length !== 0) {
        return restrictions;
      } else {
        return "No Restrictions!";
      }
    }
  };

  // Everytime the inspected course changes or someone presses show more, update description height.
  useEffect(() => {
    let hasOverflowingChildren = false;
    if (bioElRef.current !== null) {
      const bioEl: HTMLParagraphElement = bioElRef.current;
      hasOverflowingChildren =
        bioEl.offsetHeight < bioEl.scrollHeight ||
        bioEl.offsetWidth < bioEl.scrollWidth;
    }
    if (hasOverflowingChildren && showMore === 2) {
      setShowMore(0);
    }
  }, [showMore, bioElRef, inspected]);

  // For changing the year to add course while in the search popout.
  const handleYearChange = (event: any) => {
    dispatch(
      updateSearchTime({
        searchYear: parseInt(event.target.value),
        searchSemester: searchSemester,
      })
    );
  };

  // Clears inspected course.
  const clearInspected = () => {
    dispatch(updateInspectedCourse("None"));
  };

  return (
    <div className="flex flex-col p-5 w-full bg-gray-200 rounded-r">
      {inspected === "None" ? (
        <div className="flex flex-col items-center justify-center w-full h-full font-normal">
          No selected course!
        </div>
      ) : placeholder ? (
        <Placeholder addCourse={addCourse} />
      ) : (
        <>
          <div className="pb-5 pt-4 px-5 w-full h-full text-base bg-white rounded overflow-y-auto">
            {searchStack.length !== 0 ? (
              <button
                onClick={() => {
                  dispatch(popSearchStack());
                }}
              >
                Back
              </button>
            ) : null}
            <div className="flex flex-row justify-between mb-1 w-full h-auto">
              <h1 className="flex flex-row w-auto h-auto">
                <div className="w-full h-auto text-2xl font-bold">
                  {inspected.title}
                </div>
              </h1>
              <button className="text-2xl" onClick={clearInspected}>
                <CloseSvg className="w-7 h-7 stroke-2" />
              </button>
            </div>
            <div className="grid grid-cols-2 w-auto h-auto">
              <ReactTooltip />
              <div className="w-auto h-auto">
                <div className="flex flex-row items-center">
                  <div className="mr-1 font-semibold">Number: </div>
                  {inspected.number}
                </div>
              </div>
              <div className="w-auto h-auto">
                <div className="flex flex-row items-center">
                  <div className="mr-1 font-semibold">Credit: </div>
                  <div
                    className="flex items-center px-1 w-auto h-5 text-white font-semibold bg-secondary rounded select-none"
                    data-tip={inspected.credits + " credits"}
                  >
                    {inspected.credits}
                  </div>
                </div>
              </div>
              <div className="w-auto h-auto">
                <div className="flex flex-row items-center">
                  <div className="mr-1 font-semibold">Areas:</div>
                  {inspected.areas !== "None" ? (
                    inspected.areas.split("").map((area) => (
                      <div
                        className="flex flex-row items-center"
                        key={area + inspected.number}
                      >
                        <div
                          className="flex items-center px-1 w-auto h-5 text-white font-semibold rounded select-none"
                          style={{ backgroundColor: getColors(area)[0] }}
                        >
                          {area}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      className="flex items-center px-1 w-auto h-5 text-white font-semibold rounded select-none"
                      style={{ backgroundColor: getColors(inspected.areas)[0] }}
                    >
                      None
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-semibold">Department: </span>
                  {inspected.department}
                </div>
              </div>
              <div className="w-auto h-auto">
                <div>
                  <span className="font-semibold">Offered in: </span>
                  {inspected.terms.map((term, index) => {
                    return index === inspected.terms.length - 1
                      ? term
                      : term + ", ";
                  })}
                </div>
                <div>
                  <span className="font-semibold">Restrictions: </span>
                  {getRestrictions()}
                </div>
              </div>
            </div>

            <div className="mb-3 mt-3">
              <p
                className="font-normal overflow-y-hidden"
                style={{ maxHeight: showMore === 1 ? "100%" : "6rem" }}
                ref={bioElRef}
              >
                {inspected.bio}
              </p>

              {showMore === 0 ? (
                <button
                  className="underline"
                  onClick={() => {
                    setShowMore(1);
                  }}
                >
                  Show more...
                </button>
              ) : showMore === 1 ? (
                <button
                  className="underline"
                  onClick={() => {
                    setShowMore(0);
                  }}
                >
                  Show less...
                </button>
              ) : null}
              {/* <CourseEvalSection/> */}
              {/* <CourseEvalSection inspected={inspected}/> */}
            </div>
            <PrereqDisplay />
          </div>
          <div className="flex flex-row flex-grow items-center mt-2">
            <div className="flex flex-col flex-grow justify-center">
              <div className="mb-1 font-medium">Selecting for</div>
              <div className="flex flex-row">
                <div className="flex flex-row items-center w-auto h-auto">
                  Year:
                  <select
                    className="ml-2 text-black text-coursecard rounded"
                    onChange={handleYearChange}
                    value={searchYear}
                  >
                    {currentPlan.years.map((currPlanYear) => (
                      <option key={currPlanYear.year} value={currPlanYear.year}>
                        {currPlanYear.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-row items-center ml-5 w-auto h-auto">
                  Term:
                  <select
                    className="ml-2 h-6 rounded outline-none"
                    onChange={handleTermFilterChange}
                    value={semester}
                  >
                    {termFilters.map((term) => (
                      <option key={term + inspected.number} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-row flex-grow items-center ml-5 w-auto h-auto">
                  Area:
                  <select
                    className="ml-2 w-14 h-6 rounded outline-none"
                    value={inspectedArea}
                    onChange={(event) => setInspectedArea(event.target.value)}
                  >
                    {getInspectedAreas()}
                  </select>
                </div>
              </div>
            </div>
            <button
              className="mt-2 p-2 w-auto h-10 text-white bg-primary rounded"
              onClick={addCourse}
            >
              Add Course
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CourseDisplay;
