import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { validatePremiumSession } from "../services/dataService";

const PremiumSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      // No session_id → invalid access, go back to landing
      navigate("/membership", { replace: true });
      return;
    }

    const validate = async () => {
      try {
        const res = await validatePremiumSession(sessionId);

        if (!res || !res.intent_id || !res.role) {
          throw new Error("Invalid premium session");
        }

        // Redirect to correct signup flow
        if (res.role === "PROVIDER") {
          navigate(`/signup/provider?premium_intent=${res.intent_id}`, {
            replace: true,
          });
        } else if (res.role === "INSTRUCTOR") {
          navigate(`/signup/instructor?premium_intent=${res.intent_id}`, {
            replace: true,
          });
        } else {
          throw new Error("Unknown role");
        }
      } catch (err) {
        console.error("Premium validation failed", err);
        navigate("/membership", { replace: true });
      }
    };

    validate();
  }, [navigate, searchParams]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <p style={{ fontSize: 18, fontWeight: 600 }}>
        Confirming your premium subscription…
      </p>
    </div>
  );
};

export default PremiumSuccess;