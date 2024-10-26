import React, { useEffect } from "react";
import { useRecoilValue } from "recoil";
import { userAtom } from "../atoms/userAtom";
import { Navigate, useNavigate } from "react-router-dom";

const ProtectedRouter = ({ children }: any) => {
  const user = useRecoilValue(userAtom);



  return (
    user.id != "" ? children : <Navigate to="/register" />
  )
};

export default ProtectedRouter;
