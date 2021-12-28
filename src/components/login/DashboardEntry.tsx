import { FC, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api, getLoginCookieVal, guestUser } from "../../resources/assets";
import { useDispatch, useSelector } from "react-redux";
import { updateUser, selectUser } from "../../slices/userSlice";
import { useCookies } from "react-cookie";
import samplePlan from "../../resources/images/samplePlan.png";
import logo from "../../resources/images/logoDarker.png";
import { toast } from "react-toastify";

const PROD_ORIGIN = "https://ucredit.me/login/";
const DEV_ORIGIN = "http://localhost:3000/login/";

/**
 * The login page, designed after the Spotify login page..
 * @prop cookies contains the various resources provided by the wrapper component of react-cookie
 */
const DashboardEntry: FC = () => {
  // Redux setup.
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [cookies] = useCookies();
  const [finishedLoginCheck, setFinishedLoginCheck] = useState(false);

  // React router state setup.
  let navigate = useNavigate();
  let location = useLocation();

  // Useffect runs once on page load, calling to https://ucredit-api.herokuapp.com/api/retrieveUser to retrieve user data.
  // On successful retrieve, update redux with retrieved user
  // On fail, guest user is used.
  useEffect(() => {
    const currentURL: string = window.location.href;
    if (currentURL.length > 43) {
      let token: string;
      if (!window.location.href.includes("localhost")) {
        token = currentURL.substr(PROD_ORIGIN.length, 20);
      } else {
        token = currentURL.substr(DEV_ORIGIN.length, 20);
      }
      fetchUser(token);
    } else {
      if (user._id === "noUser") {
        initialLogin();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // Initial login for when the user is the initial state, no_user.
  const initialLogin = (): void => {
    const loginId = getLoginCookieVal(cookies);
    fetch(api + "/retrieveUser/" + loginId, {
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
          navigate("/dashboard");
        } else {
          setFinishedLoginCheck(true);
        }
      })
      .catch((err) => {
        console.log("ERROR IS: ", err);
        setFinishedLoginCheck(true);
      });
  };

  // Fetches user based on url token.
  const fetchUser = (token: string): void => {
    fetch(api + "/retrieveUser/" + token, {
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
        if (
          retrievedUser.errors === undefined &&
          !token.includes("dashboard")
        ) {
          document.cookie =
            "connect.sid=" +
            token +
            "; expires=" +
            new Date(Date.now() + 200000000000000).toString() +
            "; path=/";
          dispatch(updateUser(retrievedUser.data));
          navigate("/dashboard");
        } else {
          setFinishedLoginCheck(true);
        }
      })
      .catch(() => {
        console.log("ERROR: couldn't log in with token " + token);
      });
  };

  /**
   * Handles if the user is invalid.
   */
  const handleGuest = (): void => {
    dispatch(updateUser(guestUser));
    navigate("/dashboard");
  };

  return (
    <>
      <div
        className="absolute flex w-screen h-screen"
        style={{
          backgroundImage:
            "url(" +
            samplePlan +
            "), linear-gradient(205deg, rgba(52, 211, 153), rgba(59, 130, 246))",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          // backgroundColor: "black",
          backgroundBlendMode: "lighten",
          filter: "blur(9px) hue-rotate(340deg)",
          zIndex: 45,
        }}
      ></div>
      <div className="absolute z-50 flex w-full h-full">
        <div className="flex flex-col mx-auto mx-auto my-auto p-14 text-white text-lg font-bold bg-gradient-to-b rounded shadow from-blue-500 to-green-400">
          <div className="flex flex-row items-center justify-center mt-auto pr-2 w-full text-3xl">
            <img src={logo} alt="logo" className="mr-2 h-16" />
            <div>uCredit</div>
          </div>
          <div className="mb-14 mt-8 mx-auto w-full text-center text-4xl">
            Quick accessible degree planning.
          </div>
          <a
            href="https://ucredit-api.herokuapp.com/api/login"
            className="flex flex-row items-center justify-center mx-auto w-64 h-12 font-semibold tracking-widest bg-primary rounded-full shadow cursor-pointer select-none transform hover:scale-105 transition duration-200 ease-in"
          >
            JHU SSO Login
          </a>
          <button
            className="flex flex-row items-center justify-center mb-auto mt-5 mx-auto w-64 h-12 font-semibold tracking-widest bg-primary rounded-full focus:outline-none shadow cursor-pointer select-none transform hover:scale-105 transition duration-200 ease-in"
            onClick={
              finishedLoginCheck
                ? handleGuest
                : () => {
                    toast.info(
                      "Please wait while we check if you're logged in..."
                    );
                  }
            }
          >
            Continue as guest
          </button>
        </div>
      </div>
      {/* </div> */}
    </>
  );
};

export default DashboardEntry;
