import { useRecoilValue } from "recoil";
import { userAtom } from "../atoms/userAtom";
import { Navigate, useParams } from "react-router-dom";

const ProtectedRouter = ({ children }: any) => {
  const user = useRecoilValue(userAtom);
  const parms = useParams();
console.log(user);

  return (
    user.id != "" && user.roomId != "" ? children : <Navigate to={`/${parms.roomId}`} />
  )
};

export default ProtectedRouter;
