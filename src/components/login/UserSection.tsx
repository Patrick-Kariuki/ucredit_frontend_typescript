import { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateUser,
  selectUser,
  resetUser,
  updatePlanList,
  selectPlanList,
  updateCourseCache,
} from "../../slices/userSlice";
import { useHistory } from "react-router-dom";
import {
  resetCurrentPlan,
  selectCurrentPlanCourses,
  selectPlan,
  updateCurrentPlanCourses,
  updateImportingStatus,
  updateSelectedPlan,
} from "../../slices/currentPlanSlice";
import { api, guestUser } from "../../resources/assets";
import bird from "../../resources/images/logoDarker.png";
import axios from "axios";
import { Plan, User, UserCourse, Year } from "../../resources/commonTypes";
import { getMajorFromCommonName } from "../../resources/majors";
import { toast } from "react-toastify";
import {
  updateAddingPlanStatus,
  updateToAddName,
  updateToAddMajor,
  updateGeneratePlanAddStatus,
  selectGeneratePlanAddStatus,
} from "../../slices/popupSlice";
import { useCookies } from "react-cookie";

/**
 * User login/logout buttons.
 */
const UserSection: FC<{
  _id: string | null;
}> = ({ _id }) => {
  // Redux setup
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const curPlan = useSelector(selectPlan);
  const currentCourses = useSelector(selectCurrentPlanCourses);
  const planList = useSelector(selectPlanList);
  const generatePlanAddStatus = useSelector(selectGeneratePlanAddStatus);

  // Component state setup
  const [loginId, setLoginId] = useState(document.cookie.split("=")[1]);
  const [toAdd, setToAdd] = useState<Year[]>([]);
  const [shouldAdd, setShouldAdd] = useState<boolean>(false);
  const [cached, setCached] = useState<boolean>(false);
  const [cookies] = useCookies(["connect.sid"]);
  let history = useHistory();

  // Imports or creates new plan.
  useEffect(() => {
    if (
      shouldAdd &&
      user._id !== "noUser" &&
      curPlan._id !== "noPlan" &&
      cached &&
      !generatePlanAddStatus
    ) {
      addCourses();
      setShouldAdd(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    shouldAdd,
    toAdd,
    user,
    curPlan,
    currentCourses,
    cached,
    generatePlanAddStatus,
  ]);

  /**
   * Caches all courses in plans
   * @param years - an array of years of the plan
   */
  const cache = (years: Year[]) => {
    let total = 0;
    let cum = 0;
    years.forEach((y) => {
      y.courses.forEach((c) => {
        total++;
        axios
          .get("https://ucredit-dev.herokuapp.com/api/search", {
            params: { query: c },
          })
          .then((retrieved) => {
            dispatch(updateCourseCache([retrieved.data.data]));
            cum++;
            if (cum === total) {
              setCached(true);
            }
          });
      });
    });
  };

  /**
   * Deep copies sharer's plan into your own.
   */
  const addCourses = async () => {
    let added: UserCourse[] = [];
    let total = 0;
    let empty = true;
    for (const year of toAdd) {
      for (const course of year.courses) {
        total++;
        empty = false;
        // eslint-disable-next-line no-loop-func
        addCourse(course, toAdd.indexOf(year)).then((curCourse) => {
          added.push(curCourse);
          if (added.length === total) {
            let allYears: Year[] = [...curPlan.years];
            let newYears: Year[] = [];
            for (let y of allYears) {
              newYears.push({ ...y });
            }
            for (let cur of added) {
              const nextYears: Year[] = [];
              for (let y of newYears) {
                if (cur.year_id === y._id) {
                  nextYears.push({ ...y, courses: [...y.courses, cur._id] });
                } else {
                  nextYears.push(y);
                }
              }
              newYears = nextYears;
            }
            let newPlan: Plan = { ...curPlan, years: newYears };
            const newPlanList = [...planList];
            for (let i = 0; i < planList.length; i++) {
              if (planList[i]._id === newPlan._id) {
                newPlanList[i] = newPlan;
              }
            }
            dispatch(updatePlanList(newPlanList));
            dispatch(updateCurrentPlanCourses(added));
            dispatch(updateSelectedPlan(newPlan));
            dispatch(updateImportingStatus(false));
            toast.dismiss();
            toast.success("Plan Imported!", {
              autoClose: 5000,
              closeOnClick: false,
            });
            dispatch(updateAddingPlanStatus(false));
          }
        });
      }
    }
    if (empty) {
      dispatch(updateImportingStatus(false));
      dispatch(updateAddingPlanStatus(false));
    }
  };

  /**
   * Overloaded function that adds courses from plan from shareable link.
   * @param id - plan id of sharer's plan
   * @param yearIndex - position of year in plan
   * @returns a promise that resolves on successful deep copy of plan
   */
  const addCourse = async (
    id: string,
    yearIndex: number
  ): Promise<UserCourse> => {
    return new Promise((resolve) => {
      axios.get(api + "/courses/" + id).then((response) => {
        let course: UserCourse = response.data.data;
        const addingYear: Year = curPlan.years[yearIndex];
        const body = {
          user_id: user._id,
          year_id: addingYear !== null ? addingYear._id : "",
          plan_id: curPlan._id,
          title: course.title,
          term: course.term,
          year: addingYear !== null ? addingYear.name : "",
          credits: course.credits,
          distribution_ids: curPlan.distribution_ids,
          isPlaceholder: false,
          number: course.number,
          area: course.area,
          preReq: course.preReq,
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
              let newUserCourse: UserCourse = { ...data.data };
              return resolve(newUserCourse);
            } else {
              console.log("Failed to add", data.errors);
            }
          });
        });
      });
    });
  };

  /**
   * Attempts to log in user
   * @param cookieVal - value of stored login session hash
   * @returns a promises that resolves on success or failure in logging in
   */
  const login = (cookieVal: string) =>
    new Promise<void>((resolve) => {
      if (user._id === "noUser") {
        let curUser: User;
        // Retrieves user if user ID is "noUser", the initial user id state for userSlice.tsx.
        // Make call for backend
        fetch(api + "/retrieveUser/" + cookieVal, {
          mode: "cors",
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        })
          .then((resp) => resp.json())
          .then((retrievedUser) => {
            if (retrievedUser.errors === undefined) {
              dispatch(updateUser(retrievedUser.data));
              curUser = retrievedUser.data;
              getPlans(curUser).then(() => {
                resolve();
              });
            } else {
              console.log("ERROR: Couldn't log in with " + cookieVal);
              history.push("/login");
            }
          })
          .catch((err) => {
            console.log("ERROR with cookieVal " + cookieVal + " is ", err);
            if (_id === null) {
              history.push("/login");
            }
          });
      } else {
        resolve();
      }
    });

  /**
   * Gets all plans from current user.
   * @param curUser - current user
   * @returns a promise that resolves once plans are finished fetching
   */
  const getPlans = (curUser: User) =>
    new Promise<void>((resolve) =>
      axios.get(api + "/plansByUser/" + curUser._id).then((retrieved) => {
        const retrievedPlans: Plan[] = retrieved.data.data;
        if (retrievedPlans.length > 0) {
          const totPlans: Plan[] = [];
          retrievedPlans.forEach((plan) => {
            axios
              .get(api + "/years/" + plan._id)
              .then((resp) => {
                totPlans.push({ ...plan, years: resp.data.data });
                if (totPlans.length === retrievedPlans.length) {
                  // Initial load, there is no current plan, so we set the current to be the first plan in the array.
                  dispatch(updatePlanList(totPlans));
                  dispatch(updateSelectedPlan(totPlans[0]));
                  resolve();
                }
              })
              .catch((err) => console.log(err));
          });
        }
      })
    );

  // Useffect runs once on page load, calling to https://ucredit-api.herokuapp.com/api/retrieveUser to retrieve user data.
  // On successful retrieve, update redux with retrieved user,
  useEffect(() => {
    if (_id !== null) {
      toast.info("Importing Plan...", {
        autoClose: false,
        closeOnClick: false,
      });
      dispatch(updateImportingStatus(true));
      // means that the user entered a sharable link
      // first login with guest, then populate the plan with the information from the id
      history.push("/dashboard");
      let plan: Plan;
      // Get the plan that we are importing, stored in plan
      axios
        .get(api + "/plans/" + _id)
        .then((planResponse) => {
          plan = planResponse.data.data;
          // get the years of that plan, stored in years
          axios
            .get(api + "/years/" + _id)
            .then((yearsResponse) => {
              let years: Year[] = yearsResponse.data.data;
              cache(years);
              // check whether the user is logged in (whether a cookie exists)
              let cookieVal = "";
              Object.entries(cookies).forEach((cookie: any) => {
                if (cookie[0] === "_hjid" || cookie[0] === "connect.sid")
                  cookieVal = cookie[1];
              });
              if (cookieVal === "") {
                // if not, create a user first, then add
                dispatch(updateUser({ ...guestUser }));
                dispatch(updateToAddName("Imported Plan"));
                dispatch(
                  updateToAddMajor(getMajorFromCommonName(plan.majors[0]))
                );
                dispatch(updateGeneratePlanAddStatus(true));
                setToAdd(years);
                setShouldAdd(true);
              } else {
                // if so, login first, then add
                login(cookieVal).then(() => {
                  dispatch(updateToAddName("Imported Plan"));
                  dispatch(
                    updateToAddMajor(getMajorFromCommonName(plan.majors[0]))
                  );
                  dispatch(updateGeneratePlanAddStatus(true));
                  setToAdd(years);
                  setShouldAdd(true);
                });
              }
            })
            .catch((e) => {
              console.log("ERROR: ", e);
            });
        })
        .catch((e) => {
          dispatch(updateImportingStatus(false));
          toast.dismiss();
          toast.error(
            "Failed to Import. Please log in and try again... If that doesn't work. This is an issue on our end! Please report it in the feedback form and we will get to it asap!",
            {
              closeOnClick: false,
              autoClose: false,
            }
          );
          history.push("/login");
        });
    } else if (user._id === "noUser") {
      // Retrieves user if user ID is "noUser", the initial user id state for userSlice.tsx.
      // Make call for backend const cookieVals = document.cookie.split("=");
      let cookieVal = "";
      Object.entries(cookies).forEach((cookie: any) => {
        if (cookie[0] === "_hjid" || cookie[0] === "connect.sid")
          cookieVal = cookie[1];
      });
      fetch(api + "/retrieveUser/" + cookieVal, {
        mode: "cors",
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
        .then((resp) => resp.json())
        .then((retrievedUser) => {
          if (retrievedUser.errors === undefined) {
            dispatch(updateUser(retrievedUser.data));
            setLoginId(cookieVal);
          } else {
            console.log("ERROR: ", retrievedUser.errors);
            history.push("/login");
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.cookie]);

  return (
    <div className="fixed z-20 p-3 px-6 w-full h-header bg-gradient-to-r shadow from-blue-500 to-green-400 select-none">
      <div className="flex flex-row items-center justify-end w-full h-full">
        {/* <div className="flex flex-row items-center justify-center mr-3 w-11 h-11 bg-white rounded-full"> */}
        {/* <UserSvg className="w-6 h-6 stroke-2" /> */}
        {/* </div> */}
        <div className="flex flex-row flex-grow items-center ml-5 text-white text-4xl italic font-bold">
          <img src={bird} alt="logo" className="mr-3 h-9"></img>
          <div>uCredit</div>
        </div>
        {window.innerWidth > 800 ? (
          <div className="mr-3 text-white font-semibold">
            Logged in as {user.name}!
          </div>
        ) : null}
        {user._id === "guestUser" ? (
          <a
            href="https://ucredit-api.herokuapp.com/api/login"
            className="flex flex-row items-center justify-center mr-3 w-24 h-9 hover:text-white hover:bg-blue-400 bg-white rounded cursor-pointer select-none transform hover:scale-105 transition duration-200 ease-in"
          >
            Log In
          </a>
        ) : (
          <button
            onClick={() => {
              fetch(api + "/retrieveUser/" + loginId, {
                mode: "cors",
                method: "DELETE",
                credentials: "include",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
              })
                .then(() => {
                  dispatch(resetUser());
                  dispatch(resetCurrentPlan());
                  history.push("/login");
                })
                .catch((err) => {
                  console.log(err);
                });
            }}
            className="flex flex-row items-center justify-center w-24 h-9 bg-white rounded focus:outline-none cursor-pointer select-none transform hover:scale-110 transition duration-200 ease-in"
          >
            Log Out
          </button>
        )}
      </div>
    </div>
  );
};

export default UserSection;
