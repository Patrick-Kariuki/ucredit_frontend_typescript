import axios from "axios";
import * as React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Switch, Route, useLocation } from "react-router-dom";
import { api } from "./../resources/assets";
import Dashboard from "./dashboard/Dashboard";
import DashboardEntry from "./login/DashboardEntry";
import { updateAllCourses } from "../slices/userSlice";
import LandingPage from "./landing-page/LandingPage";
import { toast, ToastContainer } from "react-toastify";
import ReactTooltip from "react-tooltip";
import { SISRetrievedCourse } from "../resources/commonTypes";
// import bird from "./../resources/images/birdTempGif.gif";
import logoLine from "../resources/images/line-art/logo_line_lighter.png";

/**
 * Root app component, where it all begins...
 * @returns
 */
function App() {
  const dispatch = useDispatch();

  // Component state setup.
  const [welcomeScreen, setWelcomeScreen] = useState<boolean>(true);

  const retrieveData = (counter: number, retrieved: SISRetrievedCourse[]) => {
    axios
      .get(api + "/search/skip/" + counter + "?mod=" + 450)
      .then((courses: any) => {
        if (courses.data.data.length > 0) {

          retrieveData(counter + 1, [...retrieved, ...courses.data.data]);
        } else {
          toast.dismiss();
          toast.success("SIS Courses Cached!");
          setWelcomeScreen(false);
          dispatch(updateAllCourses(retrieved));
        }
      })
      .catch((err) => {
        retrieveData(counter, retrieved);
        console.log("err is ", err.message);
      });
    // Old caching code, where all courses are cacched
    // axios
    //   .get(api + "/search/all", {
    //     params: {},
    //   })
    //   .then((courses: any) => {
    //     const retrieved = courses.data.data;
    //     dispatch(updateAllCourses(retrieved));
    //     toast.dismiss();
    //     toast.success("SIS Courses Cached!");
    //     setWelcomeScreen(false);
    //   })
    //   .catch((err) => {
    //     retrieveData();
    //     console.log(err);
    //   });
  };

  // Retrieves all database SIS courses.
  useEffect(() => {
    if (
      !window.location.href.includes("https") &&
      !window.location.href.includes("localhost")
    ) {
      window.location.href =
        "https://" +
        window.location.href.substr(7, window.location.href.length);
    }

    toast.info("Loading resources...", {
      autoClose: false,
      closeOnClick: false,
    });

    retrieveData(0, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useQuery = () => {
    return new URLSearchParams(useLocation().search);
  }

  const _id = useQuery().get("_id");

  useEffect(() => {
    ReactTooltip.rebuild();
  });
  return (
    <>
      <ReactTooltip
        id="godTip"
        html={true}
        className="max-w-sm"
        place="top"
        effect="solid"
      />
      {welcomeScreen ? (
        <div className="fixed z-50 flex flex-col m-auto w-screen h-screen text-center text-center text-white bg-blue-900">
          <img
            className="mt-auto mx-auto w-1/6"
            src={logoLine}
            alt={"logo line art"}
          ></img>
          <div className="mb-auto mt-4 mx-auto w-full text-center text-5xl italic font-thin select-none">
            UCredit
          </div>
          <button
            onClick={() => {
              setWelcomeScreen(false);
            }}
            data-tip="Tap to dismiss loading screen. Resource loading will still be
              performed in the background."
            data-for="godTip"
            className="mb-3 focus:outline-none"
          >
            Dismiss Loading Screen
          </button>
        </div>
      ) : null} 
      <Switch>
        <Route path="/dashboard">
          <Dashboard _id={_id}/>
        </Route>
        <Route path="/login">
          <DashboardEntry />
        </Route>
        <Route path="/">
          <LandingPage />
        </Route>
      </Switch>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
}

export default App;
