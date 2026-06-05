import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/sign-in");
  }, [navigate]);
  return null;
}
